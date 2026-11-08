import { IPS } from "./constants.ts";

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

const drum = (beat: number, tick: number, count: number) => {
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

const snare = (beat: number, tick: number, count: number) => {
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

export const accents: {
  [name: string]: any;
} = {
  drum2: {
    title: "2 Drum",
    timeline: ({ beat, tick }: any) => drum(beat, tick, 2),
  },
  drum4: {
    title: "4 Drum",
    timeline: ({ beat, tick }: any) => drum(beat, tick, 4),
  },
  drum8: {
    title: "8 Drum",
    timeline: ({ beat, tick }: any) => drum(beat, tick, 8),
  },
  snare2: {
    title: "2 Snare",
    timeline: ({ beat, tick }: any) => snare(beat, tick, 2),
  },
  snare4: {
    title: "4 Snare",
    timeline: ({ beat, tick }: any) => snare(beat, tick, 4),
  },
  snare8: {
    title: "8 Snare",
    timeline: ({ beat, tick }: any) => snare(beat, tick, 8),
  },
};

export const accentOrder = [
  "drum2",
  "drum4",
  "drum8",
  "snare2",
  "snare4",
  "snare8",
];
