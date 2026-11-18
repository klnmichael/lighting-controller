import type { Color } from "../types/global.ts";
import { ACCENT_COLORS, ACTIVE_COLORS, COLOR_MODES, IPS } from "./constants.ts";
import { accentOrder, accents } from "./accents.ts";
import { sequenceOrder, sequences } from "./sequences/index.ts";
import { VirtualLightMap, type LightId } from "./light-map.ts";
import { DEFAULT_TRANSITION, mulberry32 } from "./timeline.ts";

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

export function queueLightingUpdate(
  state: LightingLoopState,
  update: QueuedLighting,
) {
  if (update.sequence) state.queue.sequence = update.sequence;
  if (update.sequenceColorMode)
    state.queue.sequenceColorMode = update.sequenceColorMode;
  if (update.sequenceColor) state.queue.sequenceColor = update.sequenceColor;
  if (update.accent || update.accent === "") state.queue.accent = update.accent;
  if (update.accentColorMode)
    state.queue.accentColorMode = update.accentColorMode;
  if (update.accentColor) state.queue.accentColor = update.accentColor;
}

const TICKS_PER_BEAT = 4;
// Beyond this many missed ticks (e.g. a backgrounded tab), jump to the present.
const MAX_CATCH_UP_TICKS = 64;
// Map history kept behind the newest processed time, for lagging samplers.
const HISTORY_MS = 2000;

export interface LightingEngine {
  state: LightingLoopState;
  map: VirtualLightMap;
  grid?: string;
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
  const tickLength = 60000 / state.bpm / TICKS_PER_BEAT;
  const grid = `${state.cueTimestamp}:${state.bpm}`;
  if (grid !== engine.grid) {
    engine.grid = grid;
    engine.lastTickIndex = undefined;
  }

  const latest = Math.floor((time - state.cueTimestamp) / tickLength);
  let next =
    engine.lastTickIndex === undefined ? latest : engine.lastTickIndex + 1;
  if (latest - next >= MAX_CATCH_UP_TICKS) next = latest;
  if (next > latest) return false;

  for (let index = next; index <= latest; index++) {
    processTick(engine, index, state.cueTimestamp + index * tickLength);
  }
  engine.lastTickIndex = latest;
  engine.map.prune(time - HISTORY_MS);
  return true;
}

function processTick(engine: LightingEngine, index: number, time: number) {
  const { state, map } = engine;
  const elapsedBeats = index / TICKS_PER_BEAT;
  const seed = Math.round(elapsedBeats + state.seedShift);
  state.currentBeat = ((Math.floor(elapsedBeats) % 16) + 16) % 16;
  state.currentTick =
    ((index % TICKS_PER_BEAT) + TICKS_PER_BEAT) % TICKS_PER_BEAT;

  if (!(state.currentBeat % 4) && state.currentTick === 0) {
    if (state.queue.sequence) {
      state.activeSequence = state.queue.sequence;
      state.runningSequence = state.queue.sequence;
    }
    if (state.queue.sequenceColorMode)
      state.sequenceColorMode = state.queue.sequenceColorMode;
    if (state.queue.sequenceColor)
      state.sequenceColor = state.queue.sequenceColor;
    if (state.queue.accent || state.queue.accent === "") {
      state.activeAccent = state.queue.accent;
      state.runningAccent = state.queue.accent;
    }
    if (state.queue.accentColorMode)
      state.accentColorMode = state.queue.accentColorMode;
    if (state.queue.accentColor) state.accentColor = state.queue.accentColor;
    state.queue = {};

    if (state.activeSequence === "shuffle") {
      const availableSequences = sequenceOrder.filter(
        (sequence) => sequence !== state.runningSequence,
      );
      state.runningSequence = getSeededItem(availableSequences, seed);
    }
    if (state.activeAccent === "shuffle")
      state.runningAccent = getSeededItem(accentOrder, seed);
  }

  if (!(state.currentBeat % 2) && state.currentTick === 0) {
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
    beat: state.currentBeat,
    tick: state.currentTick,
    absoluteBeat: Math.floor(elapsedBeats),
    seedShift: state.seedShift,
  };
  const keyframes: Record<LightId, LightKeyframe> = {};

  const sequence = sequences[state.runningSequence];
  const sequenceTimeline = sequence?.timeline(position) || [];
  const sequenceTimelineBeats = sequenceTimeline.length / 4;
  const sequenceTimelineBeat =
    ((state.currentBeat % sequenceTimelineBeats) + sequenceTimelineBeats) %
    sequenceTimelineBeats;
  const sequenceTimelineData =
    sequenceTimeline[sequenceTimelineBeat * 4 + state.currentTick];
  if (sequenceTimelineData) {
    if (
      state.sequenceColorMode === COLOR_MODES[1] &&
      !(state.currentTick % 2)
    ) {
      state.sequenceColor = getSeededItem(ACTIVE_COLORS, seed);
    }
    sequenceTimelineData.forEach((data) => {
      [...(data.ips || IPS)].forEach((ip: number) => {
        const dimming = data.randomDimming
          ? Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
            data.randomDimming[0]
          : data.dimming;
        keyframes[ip] = {
          dimming:
            dimming === undefined
              ? undefined
              : 1 - (1 - dimming) * state.sequenceDimming,
          color: state.sequenceColor,
          transition:
            data.transition ?? sequence.transition ?? DEFAULT_TRANSITION,
        };
      });
    });
  }

  const accent = accents[state.runningAccent];
  const accentTimeline = accent?.timeline(position) || [];
  const accentTimelineBeats = accentTimeline.length / 4;
  const accentTimelineData =
    accentTimeline[
      (state.currentBeat % accentTimelineBeats) * 4 + state.currentTick
    ];
  if (accentTimelineData) {
    accentTimelineData.forEach((data) => {
      data.ips?.forEach((ip: number) => {
        keyframes[ip] = {
          dimming: Math.min(1, data.dimming + (1 - state.accentDimming)),
          color: state.accentColor,
          transition:
            data.transition ?? accent.transition ?? DEFAULT_TRANSITION,
        };
      });
    });
  }

  for (const [ip, keyframe] of Object.entries(keyframes)) {
    map.set(
      Number(ip),
      {
        color: keyframe.color,
        brightness:
          keyframe.dimming === undefined ? undefined : 1 - keyframe.dimming,
      },
      time,
      keyframe.transition * 1000,
    );
  }
}
