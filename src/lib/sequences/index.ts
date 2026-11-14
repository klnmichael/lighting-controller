import {
  COUCH,
  DANCE,
  IPS,
  KITCHEN,
  OUTLINE,
  RADIAL,
  ROWS_X,
} from "../constants.ts";
import {
  createCachedTimeline,
  type LightingPattern,
  type LightingTimeline,
  type TimelinePosition,
} from "../timeline.ts";
import {
  waveWindowDoor,
  waveDoorWindow,
  waveAlternating,
  waveRadiateOut,
  waveRadiateIn,
  waveWallKitchen,
  waveKitchenWall,
} from "./wave.ts";

let cachedIPs1: number[] = [];
let cachedIPs2: number[] = [];
let cachedIPs3: number[] = [];
let cachedIPs4: number[] = [];

const trailDimming = (head: number, position: number, tailLength: number) => {
  const distance = (head - position + OUTLINE.length) % OUTLINE.length;
  // Fade in ahead of the fractional head and fade out behind it.
  return Math.min(1, distance / tailLength, OUTLINE.length - distance);
};

const circleTimeline = (
  streakCount: 1 | 2,
  direction: 1 | -1 = 1,
): LightingTimeline => {
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
          ...heads.map((head) =>
            trailDimming(head, direction * position, tailLength),
          ),
        ),
      })),
    ];
  });
};

export const sequences: Record<string, LightingPattern> = {
  dark: {
    title: "Dark",
    timeline: createCachedTimeline(() => [[{ dimming: 1 }], [], [], []]),
  },
  full: {
    title: "Full",
    timeline: createCachedTimeline(() => [[{ dimming: 0 }], [], [], []]),
  },
  twinkle: {
    title: "Twinkle",
    timeline: createCachedTimeline(() => [
      [{ randomDimming: [0.25, 1] }],
      [],
      [],
      [],
    ]),
  },
  twinkleFast: {
    title: "Twinkle Fast",
    timeline: createCachedTimeline(() => [
      [{ randomDimming: [0.5, 1] }],
      [],
      [{ randomDimming: [0.5, 1] }],
      [],
    ]),
  },
  flash: {
    title: "Flash",
    timeline: createCachedTimeline(() => [
      [{ dimming: 0 }],
      [],
      [{ dimming: 1 }],
      [],
    ]),
  },
  waveWindowDoor,
  waveDoorWindow,
  waveAlternating,
  waveRadiateOut,
  waveRadiateIn,
  waveWallKitchen,
  waveKitchenWall,
  pulsate: {
    title: "Pulsate",
    timeline: ({ beat, tick }: TimelinePosition) => {
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
    timeline: createCachedTimeline(() => circleTimeline(1)),
  },
  circle1Reverse: {
    title: "1 Circle Reverse",
    timeline: createCachedTimeline(() => circleTimeline(1, -1)),
  },
  circle2: {
    title: "2 Circle",
    timeline: createCachedTimeline(() => circleTimeline(2)),
  },
  circle2Reverse: {
    title: "2 Circle Reverse",
    timeline: createCachedTimeline(() => circleTimeline(2, -1)),
  },
  waveBounce: {
    title: "Wave Bounce",
    timeline: createCachedTimeline(() =>
      Array.from({ length: 16 }, (_, tick) => {
        const head = (1 - Math.abs(tick / 8 - 1)) * (ROWS_X.length - 1);
        return [
          { dimming: 1 },
          ...ROWS_X.map((row, position) => ({
            ips: row.map((index) => IPS[index]),
            dimming: Math.min(1, Math.abs(position - head)),
          })),
        ];
      }),
    ),
  },
  radialRipple: {
    title: "Radial Ripple",
    timeline: createCachedTimeline(() =>
      Array.from({ length: 16 }, (_, tick) => [
        { dimming: 1 },
        ...RADIAL.map((ring, position) => ({
          ips: [...new Set(ring)].map((index) => IPS[index]),
          dimming:
            (1 -
              Math.cos((tick / 16 - position / RADIAL.length) * 2 * Math.PI)) /
            2,
        })),
      ]),
    ),
  },
  zoneCrossfade: {
    title: "Zone Crossfade",
    timeline: createCachedTimeline(() => {
      const zones = [COUCH, KITCHEN, DANCE];
      return Array.from({ length: 16 }, (_, tick) => {
        const head = (tick * zones.length) / 16;
        const current = Math.floor(head);
        const blend = head - current;
        return [
          { dimming: 1 },
          { ips: zones[current].map((index) => IPS[index]), dimming: blend },
          {
            ips: zones[(current + 1) % zones.length].map((index) => IPS[index]),
            dimming: 1 - blend,
          },
        ];
      });
    }),
  },
  orbitCollision: {
    title: "Orbit Collision",
    timeline: createCachedTimeline(() =>
      Array.from({ length: 16 }, (_, tick) => {
        const head = (tick / 16) * OUTLINE.length;
        return [
          { dimming: 1 },
          ...OUTLINE.map((index, position) => ({
            ips: [IPS[index]],
            dimming: Math.min(
              trailDimming(head, position, 4),
              trailDimming(head, -position, 4),
            ),
          })),
        ];
      }),
    ),
  },
};

export const sequenceOrder = [
  "twinkle",
  "twinkleFast",
  "pulsate",
  "radialRipple",
  "zoneCrossfade",
  "waveWindowDoor",
  "waveDoorWindow",
  "waveAlternating",
  "waveRadiateOut",
  "waveRadiateIn",
  "waveWallKitchen",
  "waveKitchenWall",
  "waveBounce",
  "circle1",
  "circle1Reverse",
  "circle2",
  "circle2Reverse",
  "orbitCollision",
];
