import type { Color } from "../types/global.ts";
import { ACCENT_COLORS, ACTIVE_COLORS, COLOR_MODES, IPS } from "./constants.ts";
import { accentOrder, accents } from "./accents.ts";
import { sequenceOrder, sequences } from "./sequences/index.ts";

export interface LightConfig {
  color?: Color;
  dimming?: number;
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

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

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
    sequenceColorMode: "random",
    sequenceColor: [255, 255, 255],
    sequenceDimming: 1,
    activeAccent: "",
    runningAccent: "",
    accentColorMode: "random",
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

export function advanceLightingLoop(
  state: LightingLoopState,
  time = Date.now(),
  timeOffset = 0,
): Record<number, LightConfig> | undefined {
  const adjustedTime = time + timeOffset;
  const elapsedBeats =
    (adjustedTime - state.cueTimestamp) / (60000 / state.bpm);
  const seed = Math.round(elapsedBeats + state.seedShift);
  const beat = ((elapsedBeats % 16) + 16) % 16;
  const beatFloor = Math.floor(beat);
  const tick = (beat - beatFloor) * 4;
  const tickFloor = Math.floor(tick);
  if (state.currentBeat === beatFloor && state.currentTick === tickFloor)
    return;
  state.currentBeat = beatFloor;
  state.currentTick = tickFloor;

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
  }

  if (!(state.currentBeat % 4) && state.currentTick === 0) {
    if (state.activeSequence === "random") {
      const availableSequences = sequenceOrder.filter(
        (sequence) => sequence !== state.runningSequence,
      );
      state.runningSequence = getSeededItem(availableSequences, seed);
    }
    if (state.activeAccent === "random")
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

  const lightMap: Record<number, LightConfig> = {};
  const sequenceTimeline =
    sequences[state.runningSequence]?.timeline({
      beat: state.currentBeat,
      tick: state.currentTick,
    }) || [];
  const sequenceTimelineBeats = sequenceTimeline.length / 4;
  const sequenceTimelineBeat =
    ((state.currentBeat % sequenceTimelineBeats) + sequenceTimelineBeats) %
    sequenceTimelineBeats;
  const sequenceTimelineData =
    sequenceTimeline[
      sequenceTimelineBeat * 4 + state.currentTick
    ];
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
          ? Math.random() *
              (data.randomDimming[1] - data.randomDimming[0]) +
            data.randomDimming[0]
          : data.dimming;
        lightMap[ip] = {
          dimming:
            dimming === undefined
              ? undefined
              : 1 - (1 - dimming) * state.sequenceDimming,
          color: state.sequenceColor,
        };
      });
    });
  }

  const accentTimeline =
    accents[state.runningAccent]?.timeline({
      beat: state.currentBeat,
      tick: state.currentTick,
    }) || [];
  const accentTimelineBeats = accentTimeline.length / 4;
  const accentTimelineData =
    accentTimeline[
      (state.currentBeat % accentTimelineBeats) * 4 + state.currentTick
    ];
  if (accentTimelineData) {
    accentTimelineData.forEach((data) => {
      data.ips?.forEach((ip: number) => {
        lightMap[ip] ??= {};
        lightMap[ip].dimming = Math.min(
          1,
          data.dimming + (1 - state.accentDimming),
        );
        lightMap[ip].color = state.accentColor;
      });
    });
  }

  return lightMap;
}
