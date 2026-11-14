import { accents } from "./accents.ts";
import { COLOR_MODES } from "./constants.ts";
import { sequences } from "./sequences/index.ts";
import type { LightingLoopState } from "./lighting-loop.ts";
import type { Color } from "../types/global.ts";

export type HubCommand =
  | { type: "toggle" }
  | { type: "cue"; seedShift: number }
  | { type: "bpm"; bpm: number }
  | { type: "sequence"; sequence: string }
  | { type: "sequenceColorMode"; value: string }
  | { type: "sequenceColor"; value: Color }
  | { type: "sequenceDimming"; value: number }
  | { type: "accent"; value: string }
  | { type: "accentColorMode"; value: string }
  | { type: "accentColor"; value: Color }
  | { type: "accentDimming"; value: number };

export interface HubSnapshot {
  type: "state";
  lighting: LightingLoopState;
}

const isColor = (value: unknown): value is Color =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255);

export function isHubCommand(value: unknown): value is HubCommand {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const command = value as Record<string, unknown>;
  switch (command.type) {
    case "toggle":
      return true;
    case "cue":
      return Number.isInteger(command.seedShift) &&
        typeof command.seedShift === "number" &&
        command.seedShift >= 0 && command.seedShift <= 999;
    case "bpm":
      return typeof command.bpm === "number" &&
        Number.isFinite(command.bpm) && command.bpm >= 1 && command.bpm <= 400;
    case "sequence":
      return typeof command.sequence === "string" &&
        (command.sequence === "" || command.sequence === "random" ||
          Object.hasOwn(sequences, command.sequence));
    case "accent":
      return typeof command.value === "string" &&
        (command.value === "" || command.value === "random" ||
          Object.hasOwn(accents, command.value));
    case "sequenceColorMode":
    case "accentColorMode":
      return typeof command.value === "string" && COLOR_MODES.includes(command.value);
    case "sequenceColor":
    case "accentColor":
      return isColor(command.value);
    case "sequenceDimming":
    case "accentDimming":
      return typeof command.value === "number" &&
        Number.isFinite(command.value) && command.value >= 0 && command.value <= 1;
    default:
      return false;
  }
}
