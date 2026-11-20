import type { Color } from "../types/global.ts";
import { ACCENT_COLORS, ACTIVE_COLORS, COLOR_MODES, IPS } from "./constants.ts";
import { accentOrder, accents } from "./accents.ts";
import { sequenceOrder, sequences } from "./sequences/index.ts";
import { VirtualLightMap, type LightId } from "./light-map.ts";
import {
  DEFAULT_TRANSITION,
  TICKS_PER_BEAT,
  mulberry32,
  type TimelineData,
} from "./timeline.ts";

interface LightKeyframe {
  color?: Color;
  dimming?: number;
  /** Seconds. */
  transition: number;
}

interface QueuedLighting {
  sequence?: string;
  sequenceColorMode?: string;
  sequenceColor?: Color;
  accent?: string;
  accentColorMode?: string;
  accentColor?: Color;
}

export interface LightingLoopState {
  cueTimestamp: number;
  seedShift: number;
  bpm: number;
  activeSequence: string;
  runningSequence: string;
  sequenceColorMode: string;
  sequenceColor: Color;
  sequenceDimming: number;
  activeAccent: string;
  runningAccent: string;
  accentColorMode: string;
  accentColor: Color;
  accentDimming: number;
  queue: QueuedLighting;
  currentBeat: number;
  currentTick: number;
}

export type ActiveLighting = Pick<
  LightingLoopState,
  | "activeSequence"
  | "activeAccent"
  | "sequenceColorMode"
  | "sequenceColor"
  | "accentColorMode"
  | "accentColor"
>;

export function getActiveLighting(state: LightingLoopState): ActiveLighting {
  return {
    activeSequence: state.activeSequence,
    activeAccent: state.activeAccent,
    sequenceColorMode: state.sequenceColorMode,
    sequenceColor: state.sequenceColor,
    accentColorMode: state.accentColorMode,
    accentColor: state.accentColor,
  };
}

const getSeededItem = <T>(items: readonly T[], seed: number): T => {
  const rng = mulberry32(seed);
  return items[Math.floor(rng() * items.length)];
};

export function createLightingLoopState(): LightingLoopState {
  return {
    cueTimestamp: 0,
    seedShift: 0,
    bpm: 120,
    activeSequence: "",
    runningSequence: "",
    sequenceColorMode: "shuffle",
    sequenceColor: [255, 255, 255],
    sequenceDimming: 1,
    activeAccent: "",
    runningAccent: "",
    accentColorMode: "shuffle",
    accentColor: [255, 255, 255],
    accentDimming: 1,
    queue: {},
    currentBeat: -1,
    currentTick: -1,
  };
}

/**
 * Queue changes to take effect on the next bar. Empty values are ignored,
 * except for `accent`, where "" means "turn the accent off".
 */
export function queueLightingUpdate(
  state: LightingLoopState,
  update: QueuedLighting,
) {
  const { queue } = state;
  if (update.sequence) queue.sequence = update.sequence;
  if (update.sequenceColorMode)
    queue.sequenceColorMode = update.sequenceColorMode;
  if (update.sequenceColor) queue.sequenceColor = update.sequenceColor;
  if (update.accent !== undefined) queue.accent = update.accent;
  if (update.accentColorMode) queue.accentColorMode = update.accentColorMode;
  if (update.accentColor) queue.accentColor = update.accentColor;
}

/** Apply everything queued with `queueLightingUpdate`; runs on each bar. */
function applyQueue(state: LightingLoopState) {
  const { queue } = state;
  if (queue.sequence) {
    state.activeSequence = queue.sequence;
    state.runningSequence = queue.sequence;
  }
  if (queue.sequenceColorMode) state.sequenceColorMode = queue.sequenceColorMode;
  if (queue.sequenceColor) state.sequenceColor = queue.sequenceColor;
  if (queue.accent !== undefined) {
    state.activeAccent = queue.accent;
    state.runningAccent = queue.accent;
  }
  if (queue.accentColorMode) state.accentColorMode = queue.accentColorMode;
  if (queue.accentColor) state.accentColor = queue.accentColor;
  state.queue = {};
}

// Beyond this many missed ticks (e.g. a backgrounded tab), jump to the present.
const MAX_CATCH_UP_TICKS = 64;
// Map history kept behind the newest processed time, for lagging samplers.
const HISTORY_MS = 2000;
const BEATS_PER_BAR = 4;
const BEATS_PER_PHRASE = 16;

export interface LightingEngine {
  state: LightingLoopState;
  map: VirtualLightMap;
  /** Cue and BPM the processed ticks were laid out on. */
  gridCue?: number;
  gridBpm?: number;
  lastTickIndex?: number;
}

export function createLightingEngine(
  state: LightingLoopState = createLightingLoopState(),
): LightingEngine {
  return { state, map: new VirtualLightMap() };
}

/** Make the next advance fire the current tick again (on start or resync). */
export function resetLightingEngine(engine: LightingEngine) {
  engine.lastTickIndex = undefined;
  engine.state.currentBeat = -1;
  engine.state.currentTick = -1;
}

/**
 * Process every tick up to show time `time`, writing keyframes into the map
 * at their exact grid timestamps. Safe to call often and from several output
 * loops; it is a no-op until the next tick is due. Returns whether a tick ran.
 */
export function advanceLightingEngine(
  engine: LightingEngine,
  time: number,
): boolean {
  const { state } = engine;
  const { cueTimestamp, bpm } = state;
  if (cueTimestamp !== engine.gridCue || bpm !== engine.gridBpm) {
    engine.gridCue = cueTimestamp;
    engine.gridBpm = bpm;
    engine.lastTickIndex = undefined;
  }

  const tickLength = 60000 / bpm / TICKS_PER_BEAT;
  const latest = Math.floor((time - cueTimestamp) / tickLength);
  let next =
    engine.lastTickIndex === undefined ? latest : engine.lastTickIndex + 1;
  if (latest - next >= MAX_CATCH_UP_TICKS) next = latest;
  if (next > latest) return false;

  for (let index = next; index <= latest; index++) {
    processTick(engine, index, cueTimestamp + index * tickLength);
  }
  engine.lastTickIndex = latest;
  engine.map.prune(time - HISTORY_MS);
  return true;
}

/** Positive modulo, so ticks before the cue still land on the grid. */
const mod = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

/** A timeline's step for this beat and tick; timelines loop on whole beats. */
function stepAt<T>(timeline: readonly T[], beat: number, tick: number) {
  const beats = timeline.length / TICKS_PER_BEAT;
  return beats ? timeline[mod(beat, beats) * TICKS_PER_BEAT + tick] : undefined;
}

/** Pick a shuffled pattern, never repeating the one that is running. */
const shuffle = (order: readonly string[], running: string, seed: number) =>
  getSeededItem(
    order.filter((name) => name !== running),
    seed,
  );

function processTick(engine: LightingEngine, index: number, time: number) {
  const { state, map } = engine;
  const elapsedBeats = index / TICKS_PER_BEAT;
  const absoluteBeat = Math.floor(elapsedBeats);
  const beat = mod(absoluteBeat, BEATS_PER_PHRASE);
  const tick = mod(index, TICKS_PER_BEAT);
  const seed = Math.round(elapsedBeats + state.seedShift);
  state.currentBeat = beat;
  state.currentTick = tick;

  const onBar = beat % BEATS_PER_BAR === 0 && tick === 0;
  if (onBar) applyQueue(state);
  // Shuffle picks on every bar, and immediately if it started mid-bar (when
  // nothing has been picked yet).
  if (
    state.activeSequence === "shuffle" &&
    (onBar || !Object.hasOwn(sequences, state.runningSequence))
  ) {
    state.runningSequence = shuffle(sequenceOrder, state.runningSequence, seed);
  }
  if (
    state.activeAccent === "shuffle" &&
    (onBar || !Object.hasOwn(accents, state.runningAccent))
  ) {
    // Unlike sequences, the accent shuffle may pick the current accent again.
    state.runningAccent = getSeededItem(accentOrder, seed);
  }

  if (beat % 2 === 0 && tick === 0) {
    if (state.sequenceColorMode === COLOR_MODES[0])
      state.sequenceColor = getSeededItem(ACTIVE_COLORS, seed);
    if (state.accentColorMode === COLOR_MODES[0]) {
      state.accentColor = getSeededItem(
        ACCENT_COLORS,
        seed + ACTIVE_COLORS.length / 2,
      );
    }
  }

  const position = {
    beat,
    tick,
    absoluteBeat,
    seedShift: state.seedShift,
  };
  const keyframes = new Map<LightId, LightKeyframe>();

  const sequence = sequences[state.runningSequence];
  const sequenceStep = sequence && stepAt(sequence.timeline(position), beat, tick);
  if (sequenceStep) {
    if (state.sequenceColorMode === COLOR_MODES[1] && tick % 2 === 0) {
      state.sequenceColor = getSeededItem(ACTIVE_COLORS, seed);
    }
    // Seeded from the tick, so every engine sharing the cue twinkles alike.
    let rng: (() => number) | undefined;
    const dimmingOf = (data: TimelineData) => {
      if (!data.randomDimming) return data.dimming;
      rng ??= mulberry32(Math.imul(index, 0x9e3779b1) ^ state.seedShift);
      const [min, max] = data.randomDimming;
      return min + rng() * (max - min);
    };
    for (const data of sequenceStep) {
      const transition =
        data.transition ?? sequence.transition ?? DEFAULT_TRANSITION;
      for (const ip of data.ips ?? IPS) {
        const dimming = dimmingOf(data);
        keyframes.set(ip, {
          dimming:
            dimming === undefined
              ? undefined
              : 1 - (1 - dimming) * state.sequenceDimming,
          color: state.sequenceColor,
          transition,
        });
      }
    }
  }

  const accent = accents[state.runningAccent];
  const accentStep = accent && stepAt(accent.timeline(position), beat, tick);
  if (accentStep) {
    for (const data of accentStep) {
      const keyframe = {
        dimming: Math.min(1, data.dimming + (1 - state.accentDimming)),
        color: state.accentColor,
        transition: data.transition ?? accent.transition ?? DEFAULT_TRANSITION,
      };
      for (const ip of data.ips) keyframes.set(ip, keyframe);
    }
  }

  for (const [ip, { color, dimming, transition }] of keyframes) {
    map.set(
      ip,
      { color, brightness: dimming === undefined ? undefined : 1 - dimming },
      time,
      transition * 1000,
    );
  }
}
