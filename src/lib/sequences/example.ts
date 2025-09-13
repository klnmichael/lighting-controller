import randomColor from "randomcolor";
import { IPS, ROWS } from "../constants.ts"; // potentially ROW_Y ROW_X
import type { Color } from "../../types/global.ts";

let customColor: Color = [255, 0, 255];

export const titleCamelCase = {
  label: "Title Space Separated",
  beats: 1,
  loop: (updateLight: any, bpm: number) => {
    const timeouts: any[] = [];
    IPS.forEach((index) => {
      updateLight(index, {
        color: [255, 0, 0],
        dimming: 100,
      });
      timeouts.push(
        setTimeout(() => {
          updateLight(index, {
            dimming: 50,
          });
        }, 100)
      );
    });
    updateLight(0, {
      color: [255, 0, 0],
      dimming: 100,
    });
    updateLight(12, {
      color: [255, 0, 0],
      dimming: 100,
    });
    return timeouts;
  },
  // sends config to server to update global variable
  update: ({ color }: any) => {
    customColor = color;
  },
};
