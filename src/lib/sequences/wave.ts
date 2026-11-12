import { IPS, RADIAL, ROWS_X, ROWS_Y } from "../constants.ts";

const waveYTimeline = (rows: number[][], custom?: boolean) => {
  return [
    [
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: [
          ...rows[1].map((index) => IPS[index]),
          ...rows[2].map((index) => IPS[index]),
          ...rows[3].map((index) => IPS[index]),
          ...rows[4].map((index) => IPS[index]),
          ...rows[5].map((index) => IPS[index]),
          ...rows[6].map((index) => IPS[index]),
        ],
        dimming: 1,
      },
    ],
    [
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0,
      },
    ],
    [
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0.5,
      },
    ],
    [
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [
      {
        ips: rows[4].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [
      {
        ips: rows[5].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [
      {
        ips: rows[6].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[4].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [
      {
        ips: rows[5].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[4].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
  ];
};

const waveXTimeline = (rows: number[][]) => {
  return [
    [
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: [
          ...rows[1].map((index) => IPS[index]),
          ...rows[2].map((index) => IPS[index]),
          ...rows[3].map((index) => IPS[index]),
        ],
        dimming: 1,
      },
    ],
    [],
    [
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 0.5,
      },
    ],
    [],
    [
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[0].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [],
    [
      {
        ips: rows[3].map((index) => IPS[index]),
        dimming: 0,
      },
      {
        ips: rows[2].map((index) => IPS[index]),
        dimming: 0.5,
      },
      {
        ips: rows[1].map((index) => IPS[index]),
        dimming: 1,
      },
    ],
    [],
  ];
};

let alternatingCached = 0;

export const waveWindowDoor = {
  title: "Wave Window Door",
  timeline: () => waveYTimeline([...ROWS_Y]),
};

export const waveDoorWindow = {
  title: "Wave Door Window",
  timeline: () => waveYTimeline([...ROWS_Y].reverse()),
};

export const waveAlternating = {
  title: "Wave Alternating",
  timeline: ({ beat, tick }: any) => {
    if (!(beat % 2) && tick === 0) alternatingCached = ++alternatingCached % 2;
    const rows = !alternatingCached ? [...ROWS_Y] : [...ROWS_Y].reverse();
    return waveYTimeline(rows);
  },
};

export const waveWallKitchen = {
  title: "Wave Kitchen Wall",
  timeline: () => {
    const rows = [...ROWS_X];
    return waveXTimeline(rows);
  },
};

export const waveKitchenWall = {
  title: "Wave Kitchen Wall",
  timeline: () => {
    const rows = [...ROWS_X].reverse();
    return waveXTimeline(rows);
  },
};

const waveRadiateTimeline = (rings: number[][]) => {
  const ring = (position: number, dimming: number) => ({
    ips: rings[position].map((index) => IPS[index]),
    dimming,
  });

  return [
    [
      ring(0, 0),
      {
        ips: rings
          .slice(1)
          .flatMap((radialRing) => radialRing.map((index) => IPS[index])),
        dimming: 1,
      },
    ],
    [ring(1, 0)],
    [ring(2, 0)],
    [ring(3, 0), ring(0, 1)],
    [ring(1, 1)],
    [ring(2, 1)],
    [ring(3, 1)],
    [],
  ];
};

export const waveRadiateOut = {
  title: "Wave Radiate Out",
  timeline: () => waveRadiateTimeline(RADIAL),
};

export const waveRadiateIn = {
  title: "Wave Radiate In",
  timeline: () => waveRadiateTimeline([...RADIAL].reverse()),
};
