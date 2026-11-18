import { IPS } from "./constants.ts";

export interface TimelinePosition {
  /** Beat within the 16-beat bar. */
  beat: number;
  tick: number;
  /** Beats since the cue; identical on every engine sharing the cue. */
  absoluteBeat: number;
  /** Shared random shift chosen at cue time. */
  seedShift: number;
}

export const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++)
    hash = Math.imul(hash ^ value.charCodeAt(i), 0x01000193);
  return hash;
};

const seededIpsCache = new Map<string, number[]>();

/**
 * A deterministic, duplicate-free set of `count` lights that changes every
 * `periodBeats` beats. Derived only from the cue's beat grid and seed shift,
 * so the hub, the client and the button previews all pick the same lights.
 * `key` separates patterns so they don't share a selection.
 */
export function seededIps(
  { absoluteBeat, seedShift }: TimelinePosition,
  key: string,
  count: number,
  periodBeats: number,
): number[] {
  const period = Math.floor(absoluteBeat / periodBeats);
  const cacheKey = `${key}:${count}:${seedShift}:${period}`;
  let picked = seededIpsCache.get(cacheKey);
  if (!picked) {
    const rng = mulberry32(
      hashString(key) ^ Math.imul(period, 0x9e3779b1) ^ seedShift,
    );
    const ips = [...IPS];
    // Partial Fisher-Yates: the first `count` entries are the selection.
    for (let i = 0; i < Math.min(count, ips.length); i++) {
      const j = i + Math.floor(rng() * (ips.length - i));
      [ips[i], ips[j]] = [ips[j], ips[i]];
    }
    picked = ips.slice(0, count);
    if (seededIpsCache.size > 256) seededIpsCache.clear();
    seededIpsCache.set(cacheKey, picked);
  }
  return picked;
}

/** Seconds a keyframe takes to fade in when neither entry nor pattern sets one. */
export const DEFAULT_TRANSITION = 0.1;

export interface TimelineData {
  ips?: number[];
  dimming?: number;
  randomDimming?: [number, number];
  /** Fade duration in seconds; overrides the pattern's transition. */
  transition?: number;
}

export interface AccentTimelineData extends TimelineData {
  ips: number[];
  dimming: number;
}

export type LightingTimeline = TimelineData[][];

export type TimelineFactory<TData extends TimelineData = TimelineData> = (
  position: TimelinePosition,
) => TData[][];

export interface LightingPattern<TData extends TimelineData = TimelineData> {
  title: string;
  timeline: TimelineFactory<TData>;
  /** Fade duration in seconds for this pattern's keyframes. */
  transition?: number;
}

export function createCachedTimeline(
  factory: () => LightingTimeline,
): TimelineFactory {
  let cached: LightingTimeline | undefined;
  return () => {
    cached ??= factory();
    return cached;
  };
}
