import { IPS } from "./constants.ts";
import type { Color } from "../types/global";

export interface LightState {
  color: Color;
  brightness: number;
}

export function createLights(): LightState[] {
  return IPS.map(() => ({ color: [255, 255, 255], brightness: 0 }));
}
