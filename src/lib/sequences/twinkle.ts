import { IPS } from "../constants.ts";

export const tinkleWhiteAccentOnly = {
  label: "Twinkle White Accent Only",
  timeline: () => {
    const accents = [];
    const ips = [...IPS];
    for (let i = 0; i < 6; ++i) {
      const index = Math.floor(Math.random() * IPS.length);
      accents.push(IPS[index]);
      ips.splice(index, 1);
    }
    return [
      [
        {
          ips: accents,
          color: [255, 255, 255],
        },
        {
          ips,
          color: [255, 0, 0],
          dimming: 0,
        },
      ],
      [],
      [
        {
          ips: accents,
          color: [255, 255, 255],
        },
        {
          ips,
          color: [255, 0, 0],
          dimming: 0,
        },
      ],
      [],
    ];
  },
};

let beatCashed = 0;
let accentsCashed: number[] = [];
let ipsCached: number[] = [];

export const twinkleRandomAccent = {
  label: "Twinkle Random Accent",
  timeline: ({ beat }: any) => {
    if (beat !== beatCashed) {
      beatCashed = beat;
      accentsCashed = [];
      ipsCached = [...IPS];
      for (let i = 0; i < 2; ++i) {
        const index = Math.floor(Math.random() * IPS.length);
        accentsCashed.push(IPS[index]);
        ipsCached.splice(index, 1);
      }
    }
    return [
      [
        {
          ips: accentsCashed,
          color: [255, 255, 255],
        },
        {
          ips: ipsCached,
          randomColor: true,
          randomDimming: [0.5, 1],
        },
      ],
      [],
      [
        {
          ips: ipsCached,
          randomColor: true,
          randomDimming: [0.5, 1],
        },
      ],
      [],
    ];
  },
};

export const twinkleCustomAccent = {
  label: "Twinkle Custom Accent",
  timeline: ({ beat }: any) => {
    if (beat !== beatCashed) {
      beatCashed = beat;
      accentsCashed = [];
      ipsCached = [...IPS];
      for (let i = 0; i < 2; ++i) {
        const index = Math.floor(Math.random() * IPS.length);
        accentsCashed.push(IPS[index]);
        ipsCached.splice(index, 1);
      }
    }
    return [
      [
        {
          ips: accentsCashed,
          color: [255, 255, 255],
        },
        {
          ips: ipsCached,
          customColor: true,
          randomDimming: [0.2, 1],
        },
      ],
      [],
      [
        {
          ips: ipsCached,
          customColor: true,
          randomDimming: [0.2, 1],
        },
      ],
      [],
    ];
  },
};
