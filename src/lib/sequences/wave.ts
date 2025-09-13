import randomColor from "randomcolor";
import { ROWS } from "../constants.ts";
import type { Color } from "../../types/global.ts";

export const alternatingWaveRandomColor = {
  label: "Alternating Wave Random Color",
  beats: 1,
  loop: (updateLight: any, bpm: number) => {
    let delay = 0;
    const rowDelay = (1000 * 60) / bpm / (ROWS.length - 1);
    const timeouts: any[] = [];
    ROWS.forEach((row) => {
      const color = randomColor({
        luminosity: "bright",
        format: "rgbArray",
      }) as unknown as Color;
      timeouts.push(
        setTimeout(() => {
          row.forEach((index) => {
            updateLight(index, {
              color: color,
              dimming: 100,
            });
          });
        }, delay)
      );
      timeouts.push(
        setTimeout(() => {
          row.forEach((index) => {
            updateLight(index, {
              dimming: 0,
            });
          });
        }, delay + rowDelay / 2)
      );
      delay += rowDelay;
    });
    return timeouts;
  },
};
