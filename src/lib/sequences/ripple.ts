import randomColor from "randomcolor";
import { IPS, ROWS } from "../constants.ts"; // potentially ROW_Y ROW_X
import type { Color } from "../../types/global.ts";

export const rippleOutwardWhite = {
  label: "Ripple Outward White",
  beats: 1,
  loop: (updateLight: any, bpm: number) => {
    const timeouts: any[] = [];
    const center = Math.floor(ROWS.length / 2);
    const sequence = []; // This holds the order for the ripple (center -> out)

    for (let i = 0; i <= center; i++) {
      if (ROWS[center - i]) sequence.push(ROWS[center - i]); // above center
      if (i !== 0 && ROWS[center + i]) sequence.push(ROWS[center + i]); // below center
    }

    let delay = 0;
    sequence.forEach((row) => {
      const color = [255, 255, 255];
      timeouts.push(
        setTimeout(() => {
          row.forEach((index) => updateLight(index, { color, dimming: 100 }));
          timeouts.push(
            setTimeout(() => {
              row.forEach((index) => updateLight(index, { dimming: 0 }));
            }, 100)
          );
        }, delay)
      );
      delay += (1000 * 60) / bpm / (ROWS.length - 1);
    });

    return timeouts;
  },
};

export const rippleOutwardRandomColor = {
  label: "Ripple Outward Random Color",
  beats: 1,
  loop: (updateLight: any, bpm: number) => {
    const timeouts: any[] = [];
    const center = Math.floor(ROWS.length / 2);
    const sequence = []; // This holds the order for the ripple (center -> out)

    for (let i = 0; i <= center; i++) {
      if (ROWS[center - i]) sequence.push(ROWS[center - i]); // add above center
      if (i !== 0 && ROWS[center + i]) sequence.push(ROWS[center + i]); // add below center
    }

    let delay = 0;
    sequence.forEach((row) => {
      const color = randomColor({
        luminosity: "bright",
        format: "rgbArray",
      }) as unknown as Color;
      timeouts.push(
        setTimeout(() => {
          row.forEach((index) => updateLight(index, { color, dimming: 100 }));
          timeouts.push(
            setTimeout(() => {
              row.forEach((index) => updateLight(index, { dimming: 0 }));
            }, 100)
          );
        }, delay)
      );
      delay += (1000 * 60) / bpm / (ROWS.length - 1);
    });

    return timeouts;
  },
};


let customColor: Color = [255, 0, 255];

export const rippleOutwardCustomColor = {
  label: "Ripple Outward Custom Color",
  beats: 1,
  loop: (updateLight: any, bpm: number) => {
    const timeouts: any[] = [];
    const center = Math.floor(ROWS.length / 2);
    const sequence = []; // This holds the order for the ripple (center -> out)

    for (let i = 0; i <= center; i++) {
      if (ROWS[center - i]) sequence.push(ROWS[center - i]); // add above center
      if (i !== 0 && ROWS[center + i]) sequence.push(ROWS[center + i]); // add below center
    }

    let delay = 0;
    sequence.forEach((row) => {
      const color = customColor;
      timeouts.push(
        setTimeout(() => {
          row.forEach((index) => updateLight(index, { color, dimming: 100 }));
          timeouts.push(
            setTimeout(() => {
              row.forEach((index) => updateLight(index, { dimming: 0 }));
            }, 100)
          );
        }, delay)
      );
      delay += (1000 * 60) / bpm / (ROWS.length - 1);
    });

    return timeouts;
  },
  
  update: ({ color }: any) => {
    customColor = color;
  },
};