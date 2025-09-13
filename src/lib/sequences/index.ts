import { flashWhite, flashRandomColor, flashCustomColor } from "./flash.ts";
import { alternatingWaveRandomColor } from "./wave.ts";

export const sequences: {
  [name: string]: any;
} = {
  flashWhite,
  flashRandomColor,
  flashCustomColor,
  alternatingWaveRandomColor,
};

export const order = [
  "flashWhite",
  "flashRandomColor",
  "flashCustomColor",
  "alternatingWaveRandomColor",
];
