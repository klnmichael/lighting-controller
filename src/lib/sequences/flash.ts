import randomColor from "randomcolor";
import { IPS } from "../constants.ts";
import { updateWizLight } from "../../utils/updateWizLight.ts";
import type { Color } from "../../types/wiz.ts";

export const flashWhite = {
  label: "Flash White",
  beat: 1,
  loop: (bpm: number) => {
    IPS.forEach((_, index) => {
      updateWizLight(index, {
        color: [255, 255, 255],
        dimming: 100,
      });
    });
    return [
      setTimeout(() => {
        IPS.forEach((_, index) => {
          updateWizLight(index, {
            dimming: 0,
          });
        });
      }, (1000 * 60) / bpm / 2),
    ];
  },
};

export const flashRandomColor = {
  label: "Flash Random Color",
  beat: 1,
  loop: (bpm: number) => {
    IPS.forEach((_, index) => {
      const color = randomColor({
        luminosity: "bright",
        format: "rgbArray",
      }) as unknown as Color;
      updateWizLight(index, {
        color,
        dimming: 100,
      });
    });
    return [
      setTimeout(() => {
        IPS.forEach((_, index) => {
          updateWizLight(index, {
            dimming: 0,
          });
        });
      }, (1000 * 60) / bpm / 2),
    ];
  },
};

let customColor: Color = [255, 0, 255];

export const flashCustomColor = {
  label: "Flash Custom Color",
  beat: 1,
  loop: (bpm: number) => {
    IPS.forEach((_, index) => {
      // TODO color update
      updateWizLight(index, {
        color: customColor,
        dimming: 100,
      });
    });
    return [
      setTimeout(() => {
        IPS.forEach((_, index) => {
          updateWizLight(index, {
            dimming: 0,
          });
        });
      }, (1000 * 60) / bpm / 2),
    ];
  },
  update: ({ color }: any) => {
    customColor = color;
  },
};
