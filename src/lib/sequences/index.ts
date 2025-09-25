import { flashWhite, flashRandom, flashCustom } from "./flash.ts";
import {
  tinkleWhiteAccentOnly,
  twinkleRandomAccent,
  twinkleCustomAccent,
} from "./twinkle.ts";
import {
  waveWindowDoorRandom,
  waveDoorWindowRandom,
  waveAlternatingRandom,
  waveAlternatingCustom,
  waveKitchenWallRandom,
  waveRadiateRandom,
} from "./wave.ts";

export const sequences: {
  [name: string]: any;
} = {
  dark: {
    label: "Dark",
    timeline: () => [[{ dimming: 0 }], [], [], []],
  },
  random: {
    label: "Random",
    timeline: () => [
      [{ randomColor: true, randomDimming: [0.75, 1] }],
      [],
      [{ randomColor: true, randomDimming: [0.75, 1] }],
      [],
    ],
  },
  randomDim: {
    label: "Random Dim",
    timeline: () => [
      [{ randomColor: true, randomDimming: [0.25, 0.5] }],
      [],
      [{ randomColor: true, randomDimming: [0.25, 0.5] }],
      [],
    ],
  },
  custom: {
    label: "Custom",
    timeline: () => [
      [{ customColor: true, randomDimming: [0.75, 1] }],
      [],
      [{ customColor: true, randomDimming: [0.75, 1] }],
      [],
    ],
  },
  customDim: {
    label: "Custom Dim",
    timeline: () => [
      [{ customColor: true, randomDimming: [0.25, 0.5] }],
      [],
      [{ customColor: true, randomDimming: [0.25, 0.5] }],
      [],
    ],
  },
  tinkleWhiteAccentOnly,
  twinkleRandomAccent,
  twinkleCustomAccent,
  flashWhite,
  flashRandom,
  flashCustom,
  waveWindowDoorRandom,
  waveDoorWindowRandom,
  waveAlternatingRandom,
  waveAlternatingCustom,
  waveKitchenWallRandom,
  waveRadiateRandom,
};

export const order = [
  "dark",
  "random",
  "randomDim",
  "custom",
  "customDim",
  "tinkleWhiteAccentOnly",
  "twinkleRandomAccent",
  "twinkleCustomAccent",
  "flashWhite",
  "flashRandom",
  "flashCustom",
  "waveWindowDoorRandom",
  "waveDoorWindowRandom",
  "waveAlternatingRandom",
  "waveAlternatingCustom",
  "waveKitchenWallRandom",
  "waveRadiateRandom",
];
