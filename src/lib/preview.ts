import { IPS } from "./constants.ts";
import type { Color } from "../types/global";

export interface PreviewLight {
  color: Color;
  brightness: number;
}

export type PreviewMessage =
  | { type: "preview:request" }
  | { type: "preview:disconnected" }
  | { type: "preview:state"; lights: PreviewLight[] };

export function createPreviewLights(): PreviewLight[] {
  return IPS.map(() => ({ color: [255, 255, 255], brightness: 0 }));
}

function isPreviewLight(value: unknown): value is PreviewLight {
  return (
    typeof value === "object" &&
    value !== null &&
    "color" in value &&
    Array.isArray(value.color) &&
    value.color.length === 3 &&
    Array.from(value.color).every(
      (channel: unknown) =>
        typeof channel === "number" &&
        Number.isFinite(channel) &&
        channel >= 0 &&
        channel <= 255,
    ) &&
    "brightness" in value &&
    typeof value.brightness === "number" &&
    Number.isFinite(value.brightness) &&
    value.brightness >= 0 &&
    value.brightness <= 1
  );
}

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  if (value.type === "preview:request" || value.type === "preview:disconnected") {
    return true;
  }
  return (
    value.type === "preview:state" &&
    "lights" in value &&
    Array.isArray(value.lights) &&
    value.lights.length === IPS.length &&
    Array.from(value.lights).every(isPreviewLight)
  );
}
