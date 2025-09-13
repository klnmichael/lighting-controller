import { flashWhite, flashRandomColor, flashCustomColor } from "./flash.ts";
import { rippleOutwardCustomColor, rippleOutwardRandomColor, rippleOutwardWhite } from "./ripple.ts";
import { suspenseWhite } from "./suspense.ts";
import { alternatingWaveRandomColor } from "./wave.ts";

export const sequences: {
  [name: string]: any;
} = {
  flashWhite,
  flashRandomColor,
  flashCustomColor,
  alternatingWaveRandomColor,
  suspenseWhite,
  rippleOutwardWhite,
  rippleOutwardRandomColor,
  rippleOutwardCustomColor
};

export const order = [
  "flashWhite",
  "flashRandomColor",
  "flashCustomColor",
  "alternatingWaveRandomColor",
  "suspenseWhite",
  "rippleOutwardWhite",
  "rippleOutwardRandomColor",
  "rippleOutwardCustomColor"
];
