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

export const waveRadiate = {
  title: "Wave Radiate",
  timeline: () => {
    return [
      [
        {
          ips: RADIAL[0].map((index) => IPS[index]),
          dimming: 0,
        },
        {
          ips: [
            ...RADIAL[1].map((index) => IPS[index]),
            ...RADIAL[2].map((index) => IPS[index]),
            ...RADIAL[3].map((index) => IPS[index]),
          ],
          dimming: 1,
        },
      ],
      [
        {
          ips: RADIAL[1].map((index) => IPS[index]),
          dimming: 0,
        },
      ],
      [
        {
          ips: RADIAL[2].map((index) => IPS[index]),
          dimming: 0,
        },
      ],
      [
        {
          ips: RADIAL[3].map((index) => IPS[index]),
          dimming: 0,
        },
        {
          ips: RADIAL[0].map((index) => IPS[index]),
          dimming: 1,
        },
      ],
      [
        {
          ips: RADIAL[1].map((index) => IPS[index]),
          dimming: 1,
        },
      ],
      [
        {
          ips: RADIAL[2].map((index) => IPS[index]),
          dimming: 1,
        },
      ],
      [
        {
          ips: RADIAL[3].map((index) => IPS[index]),
          dimming: 1,
        },
      ],
      [],
    ];
  },
};
