import { RADIAL, ROWS_X, ROWS_Y, lightIds } from "../constants.ts";
import {
  createCachedTimeline,
  type LightingPattern,
  type LightingTimeline,
  type TimelineData,
  type TimelinePosition,
} from "../timeline.ts";

interface WaveShape {
  /** Timeline length in ticks. */
  length: number;
  /** Ticks between one row lighting up and the next. */
  stepTicks: number;
  /** Rows behind the head that dim to half; omit for no half step. */
  halfLag?: number;
  /** Rows behind the head that turn off. */
  offLag: number;
}

/**
 * A wave that lights `rows` one after another. At step `s`, row `s` turns on,
 * row `s - halfLag` dims to half and row `s - offLag` turns off. The first
 * step also turns every other row off, so each loop starts clean.
 */
const waveTimeline = (
  rows: readonly number[][],
  { length, stepTicks, halfLag, offLag }: WaveShape,
): LightingTimeline => {
  const row = (index: number, dimming: number): TimelineData[] =>
    rows[index] ? [{ ips: lightIds(rows[index]), dimming }] : [];
  return Array.from({ length }, (_, tick) => {
    if (tick % stepTicks) return [];
    const step = tick / stepTicks;
    return [
      ...row(step, 0),
      ...(step === 0 ? [{ ips: lightIds(rows.slice(1).flat()), dimming: 1 }] : []),
      ...(halfLag === undefined ? [] : row(step - halfLag, 0.5)),
      ...row(step - offLag, 1),
    ];
  });
};

const Y_WAVE: WaveShape = { length: 8, stepTicks: 1, halfLag: 2, offLag: 3 };
const X_WAVE: WaveShape = { length: 8, stepTicks: 2, halfLag: 1, offLag: 2 };
const RADIATE: WaveShape = { length: 8, stepTicks: 1, offLag: 3 };

const reversed = <T>(items: readonly T[]) => [...items].reverse();

const wave = (
  title: string,
  rows: readonly number[][],
  shape: WaveShape,
): LightingPattern => ({
  title,
  timeline: createCachedTimeline(() => waveTimeline(rows, shape)),
});

export const waveWindowDoor = wave("Wave Window Door", ROWS_Y, Y_WAVE);
export const waveDoorWindow = wave("Wave Door Window", reversed(ROWS_Y), Y_WAVE);

const alternatingTimelines = [
  waveTimeline(reversed(ROWS_Y), Y_WAVE),
  waveTimeline(ROWS_Y, Y_WAVE),
];
export const waveAlternating: LightingPattern = {
  title: "Wave Alternating",
  // Derived from the beat (not toggled per call) so several engines, such as
  // the button previews, can share this timeline.
  timeline: ({ beat }: TimelinePosition) =>
    alternatingTimelines[Math.floor(beat / 2) % 2],
};

export const waveWallKitchen = wave("Wave Wall Kitchen", ROWS_X, X_WAVE);
export const waveKitchenWall = wave("Wave Kitchen Wall", reversed(ROWS_X), X_WAVE);

export const waveRadiateOut = wave("Wave Radiate Out", RADIAL, RADIATE);
export const waveRadiateIn = wave("Wave Radiate In", reversed(RADIAL), RADIATE);
