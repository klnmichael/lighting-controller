import { IPS } from "./constants.ts";
import type {
  AccentTimelineData,
  LightingPattern,
  TimelinePosition,
} from "./timeline.ts";

let cachedIPs1: number[] = [];

const cacheIps = (count: number) => {
  cachedIPs1 = [];
  const ips = [...IPS];
  for (let i = 0; i < count; ++i) {
    const index = Math.floor(Math.random() * IPS.length);
    cachedIPs1.push(IPS[index]);
    ips.splice(index, 1);
  }
};

const one = (
  beat: number,
  tick: number,
  count: number,
): AccentTimelineData[][] => {
  if (beat % 1 === 0 && tick === 0) cacheIps(count);
  return [
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0.5 }],
    [{ ips: cachedIPs1, dimming: 1 }],
  ];
};

const drum = (
  beat: number,
  tick: number,
  count: number,
): AccentTimelineData[][] => {
  if (beat % 2 === 0 && tick === 0) cacheIps(count);
  return [
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0.25 }],
    [{ ips: cachedIPs1, dimming: 0.25 }],
    [{ ips: cachedIPs1, dimming: 0.5 }],
    [{ ips: cachedIPs1, dimming: 0.5 }],
    [{ ips: cachedIPs1, dimming: 0.75 }],
    [{ ips: cachedIPs1, dimming: 1 }],
  ];
};

const snare = (
  beat: number,
  tick: number,
  count: number,
): AccentTimelineData[][] => {
  if (beat % 2 === 0 && tick === 0) cacheIps(count);
  return [
    [],
    [],
    [],
    [],
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0.5 }],
    [{ ips: cachedIPs1, dimming: 1 }],
  ];
};

export const accents: Record<string, LightingPattern<AccentTimelineData>> = {
  one: {
    title: "2 On One",
    timeline: ({ beat, tick }: TimelinePosition) => one(beat, tick, 2),
  },
  drum2: {
    title: "2 Drum",
    timeline: ({ beat, tick }: TimelinePosition) => drum(beat, tick, 2),
  },
  drum6: {
    title: "6 Drum",
    timeline: ({ beat, tick }: TimelinePosition) => drum(beat, tick, 6),
  },
  snare2: {
    title: "2 Snare",
    timeline: ({ beat, tick }: TimelinePosition) => snare(beat, tick, 2),
  },
  snare6: {
    title: "6 Snare",
    timeline: ({ beat, tick }: TimelinePosition) => snare(beat, tick, 6),
  },
};

export const accentOrder = ["one", "drum2", "drum6", "snare2", "snare6"];
