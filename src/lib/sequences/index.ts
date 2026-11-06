import { COUCH, DANCE, IPS, KITCHEN, OUTLINE, RADIAL } from "../constants.ts";
import {
  waveWindowDoor,
  waveDoorWindow,
  waveAlternating,
  waveRadiate,
  waveKitchenWall,
} from "./wave.ts";

let cachedIPs1: number[] = [];
let cachedIPs2: number[] = [];
let cachedIPs3: number[] = [];
let cachedIPs4: number[] = [];

const circleTimeline = (streakCount: 1 | 2, direction: 1 | -1 = 1) => {
  const ticks = 16;
  const tailLength = 4;
  return Array.from({ length: ticks }, (_, tick) => {
    const heads = Array.from(
      { length: streakCount },
      (_, streak) => (tick / ticks + streak / streakCount) * OUTLINE.length,
    );
    return [
      { dimming: 1 },
      ...OUTLINE.map((index, position) => ({
        ips: [IPS[index]],
        dimming: Math.min(
          ...heads.map((head) => {
            const distance =
              (head - direction * position + OUTLINE.length) % OUTLINE.length;
            // Fade in ahead of the fractional head and fade out behind it.
            return Math.min(
              1,
              distance / tailLength,
              OUTLINE.length - distance,
            );
          }),
        ),
      })),
    ];
  });
};

export const sequences: {
  [name: string]: any;
} = {
  dark: {
    title: "Dark",
    timeline: () => [[{ dimming: 1 }], [], [], []],
  },
  full: {
    title: "Full",
    timeline: () => [[{ dimming: 0 }], [], [], []],
  },
  twinkle: {
    title: "Twinkle",
    timeline: () => [[{ randomDimming: [0, 1] }], [], [], []],
  },
  flash: {
    title: "Flash",
    timeline: () => [[{ dimming: 0 }], [], [{ dimming: 1 }], []],
  },
  waveWindowDoor,
  waveDoorWindow,
  waveAlternating,
  waveRadiate,
  waveKitchenWall,
  pulsate: {
    title: "Pulsate",
    timeline: ({ beat, tick }: any) => {
      if (beat % 4 === 0 && tick === 0) {
        cachedIPs1 = [];
        cachedIPs2 = [];
        cachedIPs3 = [];
        cachedIPs4 = [];
        const ips = [...IPS];
        for (let i = 0; i < 6; ++i) {
          const index = Math.floor(Math.random() * IPS.length);
          cachedIPs1.push(IPS[index]);
          ips.splice(index, 1);
        }
        for (let i = 0; i < 2; ++i) {
          const index = Math.floor(Math.random() * IPS.length);
          cachedIPs2.push(IPS[index]);
          ips.splice(index, 1);
        }
        for (let i = 0; i < 6; ++i) {
          const index = Math.floor(Math.random() * IPS.length);
          cachedIPs3.push(IPS[index]);
          ips.splice(index, 1);
        }
        for (let i = 0; i < 4; ++i) {
          const index = Math.floor(Math.random() * IPS.length);
          cachedIPs4.push(IPS[index]);
          ips.splice(index, 1);
        }
      }
      return [
        [
          { ips: IPS, dimming: 1 },
          {
            ips: cachedIPs1,
            dimming: 0,
          },
        ],
        [],
        [
          {
            ips: cachedIPs1,
            dimming: 0.25,
          },
        ],
        [],
        [
          { ips: IPS, dimming: 1 },
          {
            ips: cachedIPs1,
            dimming: 0.5,
          },
          {
            ips: cachedIPs2,
            dimming: 0,
          },
        ],
        [],
        [
          {
            ips: cachedIPs1,
            dimming: 1,
          },
          {
            ips: cachedIPs2,
            dimming: 0.25,
          },
        ],
        [],
        [
          { ips: IPS, dimming: 1 },
          {
            ips: cachedIPs2,
            dimming: 0.5,
          },
          {
            ips: cachedIPs3,
            dimming: 0,
          },
        ],
        [],
        [
          {
            ips: cachedIPs2,
            dimming: 1,
          },
          {
            ips: cachedIPs3,
            dimming: 0.25,
          },
        ],
        [],
        [
          { ips: IPS, dimming: 1 },
          {
            ips: cachedIPs3,
            dimming: 0.5,
          },
          {
            ips: cachedIPs4,
            dimming: 0,
          },
        ],
        [],
        [
          {
            ips: cachedIPs3,
            dimming: 1,
          },
          {
            ips: cachedIPs4,
            dimming: 0,
          },
        ],
        [],
      ];
    },
  },
  circle1: {
    title: "1 Circle",
    timeline: () => circleTimeline(1),
  },
  circle2: {
    title: "2 Circle",
    timeline: () => circleTimeline(2),
  },
  circle1Reverse: {
    title: "1 Circle Reverse",
    timeline: () => circleTimeline(1, -1),
  },
  circle2Reverse: {
    title: "2 Circle Reverse",
    timeline: () => circleTimeline(2, -1),
  },
};

export const sequenceOrder = [
  "twinkle",
  "waveWindowDoor",
  "waveDoorWindow",
  "waveAlternating",
  "waveRadiate",
  "waveKitchenWall",
  "pulsate",
  "circle1",
  "circle2",
  "circle1Reverse",
  "circle2Reverse",
];
