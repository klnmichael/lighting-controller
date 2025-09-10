import { flashWhite, flashRandomColor, flashCustomColor } from "./flash.ts";

const sequences: {
  [name: string]: any;
} = {
  flashWhite,
  flashRandomColor,
  flashCustomColor,
};

export default sequences;

export const order = ["flashWhite", "flashRandomColor", "flashCustomColor"];
