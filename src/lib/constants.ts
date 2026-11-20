import type { Color } from "../types/global.ts";
import type { OutputRate } from "./light-output.ts";

export type LightBrand = "wiz" | "govee";

export interface LightFixture {
  /**
   * Stable ID used by timelines and the light map. WiZ lights use the last
   * octet of their IP; any unused number works for other brands.
   */
  id: number;
  brand: LightBrand;
  /** LAN address. Govee lights may omit it and be found by `device`. */
  ip?: string;
  /** Govee device ID (as reported by a LAN scan or shown in the Govee app). */
  device?: string;
  /** Model or SKU, e.g. "H6008". */
  model?: string;
  name?: string;
  /** Floor plan position in percent of its width and height. */
  position: readonly [number, number];
}

export interface LightBrandProfile {
  /** Milliseconds from sending an update to the light visibly changing. */
  latency: number;
  rate: OutputRate;
}

export const LIGHT_BRANDS: Record<LightBrand, LightBrandProfile> = {
  // Updates on the 16th-note grid; WiZ drops packets when flooded.
  wiz: { latency: 120, rate: { perBeat: 4 } },
  // No native fades over LAN, so render them: whole frames per tick, up to
  // ~33 fps (the ~30 ms per-device command spacing Govee handles reliably).
  govee: { latency: 80, rate: { maxFps: 33 } },
};

/**
 * Every light, in map order. Group constants below (ROWS_Y, RADIAL, ...)
 * index into this list.
 *
 * Govee example (enable "LAN Control" for the device in the Govee app):
 *   { id: 1001, brand: "govee", device: "AA:BB:CC:DD:EE:FF:00:11",
 *     ip: "192.168.50.60", model: "H6008", position: [40, 40] },
 */
export const LIGHTS: readonly LightFixture[] = [
  { id: 130, brand: "wiz", ip: "192.168.1.130", position: [11.4, 8.9] },
  { id: 214, brand: "wiz", ip: "192.168.1.214", position: [31.6, 8.9] },
  { id: 185, brand: "wiz", ip: "192.168.1.185", position: [50.1, 8.9] },
  { id: 168, brand: "wiz", ip: "192.168.1.168", position: [67, 8.9] },
  { id: 199, brand: "wiz", ip: "192.168.1.199", position: [85.6, 8.9] },
  { id: 180, brand: "wiz", ip: "192.168.1.180", position: [62, 16.2] },
  { id: 238, brand: "wiz", ip: "192.168.1.238", position: [74, 16.2] },
  { id: 197, brand: "wiz", ip: "192.168.1.197", position: [85.6, 16.2] },
  { id: 252, brand: "wiz", ip: "192.168.1.252", position: [11.4, 28.8] },
  { id: 194, brand: "wiz", ip: "192.168.1.194", position: [31.6, 28.8] },
  { id: 232, brand: "wiz", ip: "192.168.1.232", position: [50.1, 28.8] },
  { id: 92, brand: "wiz", ip: "192.168.1.92", position: [67, 28.8] },
  { id: 102, brand: "wiz", ip: "192.168.1.102", position: [85.6, 28.8] },
  { id: 237, brand: "wiz", ip: "192.168.1.237", position: [19.2, 49.4] },
  { id: 195, brand: "wiz", ip: "192.168.1.195", position: [39.4, 49.4] },
  { id: 196, brand: "wiz", ip: "192.168.1.196", position: [57.9, 49.4] },
  { id: 101, brand: "wiz", ip: "192.168.1.101", position: [19.2, 63.8] },
  { id: 240, brand: "wiz", ip: "192.168.1.240", position: [57.9, 63.8] },
  { id: 79, brand: "wiz", ip: "192.168.1.79", position: [19.2, 78] },
  { id: 161, brand: "wiz", ip: "192.168.1.161", position: [57.9, 78] },
  { id: 84, brand: "wiz", ip: "192.168.1.84", position: [19.2, 92.5] },
  { id: 164, brand: "wiz", ip: "192.168.1.164", position: [39.4, 92.5] },
  { id: 142, brand: "wiz", ip: "192.168.1.142", position: [57.9, 92.5] },
];

/** Light IDs in map order (timelines address lights by these). */
export const IPS: number[] = LIGHTS.map((light) => light.id);

/** Map indices into LIGHTS (as used by the groups below) to light IDs. */
export const lightIds = (indices: readonly number[]): number[] =>
  indices.map((index) => IPS[index]);

export const ROWS_Y: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7],
  [8, 9, 10, 11, 12],
  [13, 14, 15],
  [16, 17],
  [18, 19],
  [20, 21, 22],
];

export const ROWS_X: number[][] = [
  [0, 8, 13, 16, 18, 20],
  [1, 2, 9, 10, 14, 21],
  [3, 5, 6, 11, 15, 17, 19, 22],
  [4, 7, 12],
];

export const RADIAL: number[][] = [
  [14],
  [9, 10, 15, 17, 16, 13],
  [1, 2, 5, 11, 19, 18, 8],
  [0, 3, 4, 6, 7, 12, 22, 21, 20],
];

export const OUTLINE: number[] = [
  0, 1, 2, 3, 4, 7, 12, 15, 17, 19, 22, 21, 20, 18, 16, 13, 8,
];

export const COUCH: number[] = [0, 1, 8, 9];

export const KITCHEN: number[] = [2, 3, 4, 5, 6, 7, 10, 11, 12];

export const DANCE: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const COLOR_MODES = ["shuffle", "set", "custom"];

export const HUB_URL_STORAGE_KEY = "hubUrl";

export const RAVE_COLORS: Color[] = [
  [255, 0, 0],
  [255, 64, 0],
  [255, 0, 128],
  [255, 0, 255],
  [128, 0, 255],
  [0, 0, 255],
  [0, 255, 255],
  [64, 255, 0],
  [128, 255, 0],
  [255, 255, 0],
];

export const ACTIVE_COLORS: Color[] = RAVE_COLORS;

export const SEQUENCE_COLORS: Color[] = [[255, 255, 255], ...ACTIVE_COLORS];

export const ACCENT_COLORS: Color[] = [[255, 255, 255], ...ACTIVE_COLORS];
