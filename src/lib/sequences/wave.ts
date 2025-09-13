import randomColor from "randomcolor";
import { ROWS } from "../constants.ts";
import type { Color } from "../../types/global.ts";

export const alternatingWaveRandomColor = {
  label: "Alternating Wave Random Color",
  beat: 1,
  loop: (updateLight: any, bpm: number) => {
    let delay = 0;
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
          timeouts.push(
            setTimeout(() => {
              row.forEach((index) => {
                updateLight(index, {
                  dimming: 0,
                });
              });
            }, 100)
          );
        }, delay)
      );
      delay += (1000 * 60) / bpm / (ROWS.length - 1);
    });
    return timeouts;
  },
};
