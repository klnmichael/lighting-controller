import type { Color } from "../types/global.ts";

/** Lights are addressed by their WiZ IP suffix for now; any stable key works. */
export type LightId = number;

export interface LightValue {
  color: Color;
  /** 0 (off) to 1 (full). */
  brightness: number;
}

export interface LightTarget {
  color?: Color;
  brightness?: number;
}

export interface LightSample extends LightValue {
  /** Where the light is heading; drivers with native fades can use this. */
  target: LightValue;
  /** Milliseconds until `target` is reached (0 when settled). */
  remaining: number;
}

interface Transition {
  start: number;
  duration: number;
  from: LightValue;
  to: LightValue;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sameValue = (a: LightValue, b: LightValue) =>
  a.brightness === b.brightness &&
  a.color[0] === b.color[0] &&
  a.color[1] === b.color[1] &&
  a.color[2] === b.color[2];

/**
 * Virtual light map: each light's state as a function of show time.
 *
 * Writers add keyframes (a target plus a transition duration) at exact
 * timestamps. Readers sample any light at any time, so output loops running
 * at different rates, or ahead of time for latency compensation, all see one
 * consistent, smoothly interpolated state.
 */
export class VirtualLightMap {
  private readonly tracks = new Map<LightId, Transition[]>();
  private readonly initial: LightValue;

  constructor(initial: LightValue = { color: [255, 255, 255], brightness: 0 }) {
    this.initial = initial;
  }

  /** Fade `id` towards `target` starting at `time`, over `duration` ms. */
  set(id: LightId, target: LightTarget, time: number, duration: number) {
    let track = this.tracks.get(id);
    if (!track) {
      track = [];
      this.tracks.set(id, track);
    }
    // A keyframe replaces anything scheduled at or after its start time.
    while (track.length && track[track.length - 1].start >= time) track.pop();

    const base = track.length ? track[track.length - 1].to : this.initial;
    const to: LightValue = {
      color: target.color ? [...target.color] : base.color,
      brightness: target.brightness ?? base.brightness,
    };
    // Same destination: let the running transition finish undisturbed.
    if (sameValue(to, base)) return;

    track.push({
      start: time,
      duration: Math.max(0, duration),
      from: this.valueAt(track, time),
      to,
    });
  }

  sample(id: LightId, time: number): LightSample {
    const track = this.tracks.get(id);
    const transition = track && findTransition(track, time);
    if (!transition) {
      return { ...this.initial, target: this.initial, remaining: 0 };
    }
    const elapsed = time - transition.start;
    return {
      ...interpolate(transition, elapsed),
      target: transition.to,
      remaining: Math.max(0, transition.duration - elapsed),
    };
  }

  /** Drop history that no sample at or after `time` can reach. */
  prune(time: number) {
    for (const track of this.tracks.values()) {
      let drop = 0;
      while (drop + 1 < track.length && track[drop + 1].start <= time) drop++;
      if (drop) track.splice(0, drop);
    }
  }

  private valueAt(track: Transition[], time: number): LightValue {
    const transition = findTransition(track, time);
    return transition
      ? interpolate(transition, time - transition.start)
      : this.initial;
  }
}

function findTransition(track: Transition[], time: number) {
  for (let i = track.length - 1; i >= 0; i--) {
    if (track[i].start <= time) return track[i];
  }
  return undefined;
}

function interpolate(
  { duration, from, to }: Transition,
  elapsed: number,
): LightValue {
  const t = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 1;
  if (t === 1) return to;
  return {
    color: [
      lerp(from.color[0], to.color[0], t),
      lerp(from.color[1], to.color[1], t),
      lerp(from.color[2], to.color[2], t),
    ],
    brightness: lerp(from.brightness, to.brightness, t),
  };
}
