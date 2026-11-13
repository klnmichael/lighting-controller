import { IPS } from "./constants.ts";
import type { Color } from "../types/global";

export interface LightState {
  color: Color;
  brightness: number;
}

export function createLights(): LightState[] {
  return IPS.map(() => ({ color: [255, 255, 255], brightness: 0 }));
}

export function majorityLightColor(lights: readonly LightState[]): Color {
  const colors = new Map<string, { color: Color; count: number }>();
  let majority: Color = [0, 0, 0];
  let highestCount = 0;
  for (const light of lights) {
    if (light.brightness <= 0 || light.color.every((channel) => channel === 0)) {
      continue;
    }
    const key = light.color.join(",");
    const entry = colors.get(key) ?? { color: light.color, count: 0 };
    entry.count++;
    colors.set(key, entry);
  }
  for (const { color, count } of colors.values()) {
    if (count > highestCount) {
      majority = color;
      highestCount = count;
    }
  }
  return [...majority];
}
