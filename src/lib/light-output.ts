import type { LightId, LightSample, VirtualLightMap } from "./light-map.ts";
import { TICKS_PER_BEAT } from "./timeline.ts";

/**
 * How often a driver samples the map:
 * - `fps`: a fixed frame rate, not aligned to the beat.
 * - `perBeat`: a fixed beat subdivision grid.
 * - `maxFps`: as many whole frames per tick (16th note) as fit under the cap,
 *   so keyframes always start exactly on a frame at any tempo.
 */
export type OutputRate =
  | { fps: number }
  | { perBeat: number }
  | { maxFps: number };

/** Frames per beat for beat-aligned rates. */
const framesPerBeat = (rate: { perBeat: number } | { maxFps: number }, bpm: number) => {
  if ("perBeat" in rate) return rate.perBeat;
  const perTick = Math.floor((rate.maxFps * 60) / bpm / TICKS_PER_BEAT);
  return TICKS_PER_BEAT * Math.max(1, perTick);
};

export interface LightDriver<TPayload> {
  name: string;
  lights: readonly LightId[];
  rate: OutputRate;
  /** Milliseconds between sending and the light visibly changing. */
  latency: number;
  /** Convert a sample into the brand's payload. Equal payloads are not resent. */
  encode(sample: LightSample): TPayload;
  /** Return false if the light can't be reached yet, to retry next frame. */
  send(id: LightId, payload: TPayload): boolean | void;
}

export interface LightSource {
  /** Current show time in ms (wall clock plus any sync offset). */
  now(): number;
  grid(): { cueTimestamp: number; bpm: number };
  /** Bring the map up to date for `time` before it is sampled. */
  advance(time: number): void;
  map: VirtualLightMap;
}

// Timers can fire slightly early; still treat that as the intended grid step.
const EARLY_TOLERANCE = 2;

/**
 * Runs one driver's update loop. Each frame is sampled from the virtual map at
 * the show time it will be visible (now + latency), so every brand lands on
 * the beat regardless of its own rate or delay.
 */
export function createLightOutput<TPayload>(
  driver: LightDriver<TPayload>,
  source: LightSource,
) {
  const lastSent = new Map<LightId, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let lastGridTime: number | undefined;
  let nextFrameTime: number | undefined;

  const frame = (time: number) => {
    source.advance(time);
    for (const id of driver.lights) {
      const payload = driver.encode(source.map.sample(id, time));
      const key = JSON.stringify(payload);
      if (lastSent.get(id) === key) continue;
      if (driver.send(id, payload) !== false) lastSent.set(id, key);
    }
  };

  const schedule = (showTime: number) => {
    const delay = showTime - driver.latency - source.now();
    timer = setTimeout(tick, Math.max(0, delay));
  };

  const tick = () => {
    timer = undefined;
    if (!running) return;
    const visibleAt = source.now() + driver.latency;
    const { rate } = driver;

    if ("fps" in rate) {
      const interval = 1000 / rate.fps;
      frame(visibleAt);
      nextFrameTime =
        nextFrameTime === undefined || nextFrameTime + interval < visibleAt
          ? visibleAt + interval
          : nextFrameTime + interval;
      schedule(nextFrameTime);
      return;
    }

    const { cueTimestamp, bpm } = source.grid();
    const interval = 60000 / bpm / framesPerBeat(rate, bpm);
    const step = Math.floor(
      (visibleAt + EARLY_TOLERANCE - cueTimestamp) / interval,
    );
    const gridTime = cueTimestamp + step * interval;
    if (gridTime !== lastGridTime) {
      lastGridTime = gridTime;
      // The light holds this value until the next step, so send where the map
      // will be by then: on-beat keyframes land crisply, longer fades step.
      frame(gridTime + interval);
    }
    schedule(gridTime + interval);
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastSent.clear();
      lastGridTime = undefined;
      nextFrameTime = undefined;
      tick();
    },
    stop() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = undefined;
    },
  };
}
