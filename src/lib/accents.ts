import {
  seededIps,
  type AccentTimelineData,
  type LightingPattern,
  type TimelinePosition,
} from "./timeline.ts";

const one = (
  position: TimelinePosition,
  count: number,
): AccentTimelineData[][] => {
  const cachedIPs1 = seededIps(position, "one", count, 1);
  return [
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0 }],
    [{ ips: cachedIPs1, dimming: 0.5 }],
    [{ ips: cachedIPs1, dimming: 1 }],
  ];
};

const drum = (
  position: TimelinePosition,
  count: number,
): AccentTimelineData[][] => {
  const cachedIPs1 = seededIps(position, "drum", count, 2);
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
  position: TimelinePosition,
  count: number,
): AccentTimelineData[][] => {
  const cachedIPs1 = seededIps(position, "snare", count, 2);
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
    title: "3 On One",
    timeline: (position: TimelinePosition) => one(position, 3),
  },
  drum3: {
    title: "3 Drum",
    timeline: (position: TimelinePosition) => drum(position, 3),
  },
  drum6: {
    title: "6 Drum",
    timeline: (position: TimelinePosition) => drum(position, 6),
  },
  snare3: {
    title: "3 Snare",
    timeline: (position: TimelinePosition) => snare(position, 3),
  },
  snare6: {
    title: "6 Snare",
    timeline: (position: TimelinePosition) => snare(position, 6),
  },
};

export const accentOrder = ["drum3", "drum6", "snare3", "snare6", "one"];
