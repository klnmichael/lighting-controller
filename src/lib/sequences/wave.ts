import randomColor from "randomcolor";
import type { Color } from "../../types/global.ts";
import { IPS, RADIAL, ROWS_X, ROWS_Y } from "../constants.ts";

const waveYTimeline = (rows: number[][], custom?: boolean) => {
  return [
    [
      {
        ips: rows[0].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[6].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[1].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
    ],
    [
      {
        ips: rows[2].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[3].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[4].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[5].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[6].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
        customColor: custom,
      },
      {
        ips: rows[4].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[5].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
  ];
};

const waveXTimeline = (rows: number[][]) => {
  return [
    [
      {
        ips: rows[0].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
      },
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [],
    [
      {
        ips: rows[1].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [],
    [
      {
        ips: rows[2].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [],
    [
      {
        ips: rows[3].map((index) => IPS[index]),
        color: randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color,
      },
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [],
  ];
};

let beatCashed = 0;
let alternatingCached = 0;
let colorCached: Color;

export const waveWindowDoorRandom = {
  label: "Wave Window Door Random",
  timeline: () => waveYTimeline([...ROWS_Y]),
};

export const waveDoorWindowRandom = {
  label: "Wave Door Window Random",
  timeline: () => waveYTimeline([...ROWS_Y].reverse()),
};

export const waveAlternatingRandom = {
  label: "Wave Alternating Random",
  timeline: ({ beat, tick }: any) => {
    if (!(beat % 2) && tick === 0) alternatingCached = ++alternatingCached % 2;
    const rows = !alternatingCached ? [...ROWS_Y] : [...ROWS_Y].reverse();
    return waveYTimeline(rows);
  },
};

export const waveAlternatingCustom = {
  label: "Wave Alternating Custom",
  timeline: ({ beat, tick }: any) => {
    if (!(beat % 2) && tick === 0) alternatingCached = ++alternatingCached % 2;
    const rows = !alternatingCached ? [...ROWS_Y] : [...ROWS_Y].reverse();
    return waveYTimeline(rows, true);
  },
};

export const waveKitchenWallRandom = {
  label: "Wave Kitchen Wall Random",
  timeline: () => {
    const rows = [...ROWS_X].reverse();
    return waveXTimeline(rows);
  },
};

export const waveRadiateRandom = {
  label: "Wave Radiate Random",
  timeline: ({ beat }: any) => {
    if (beat !== beatCashed) {
      beatCashed = beat;
      colorCached = randomColor({
        luminosity: "bright",
        format: "rgbArray",
      }) as unknown as Color;
    }
    return [
      [
        {
          ips: RADIAL[0].map((index) => IPS[index]),
          color: colorCached,
        },
      ],
      [
        {
          ips: RADIAL[1].map((index) => IPS[index]),
          color: colorCached,
        },
      ],
      [
        {
          ips: RADIAL[2].map((index) => IPS[index]),
          color: colorCached,
        },
      ],
      [
        {
          ips: RADIAL[3].map((index) => IPS[index]),
          color: colorCached,
        },
      ],
    ];
  },
};
