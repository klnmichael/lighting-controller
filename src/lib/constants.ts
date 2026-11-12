import type { Color } from "../types/global.ts";

// 130
// 216

export const IPS: number[] = [
  130, 214, 185, 168, 199, 180, 238, 197, 252, 194, 232, 92, 102, 237, 195, 196,
  101, 240, 79, 161, 84, 164, 142,
];

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
  [9, 9, 10, 15, 17, 16, 13],
  [1, 2, 5, 11, 19, 18, 8],
  [0, 3, 4, 6, 7, 12, 22, 21, 20, 0],
];

export const OUTLINE: number[] = [
  0, 1, 2, 3, 4, 7, 12, 15, 17, 19, 22, 21, 20, 18, 16, 13, 8,
];

export const COUCH: number[] = [0, 1, 8, 9];

export const KITCHEN: number[] = [2, 3, 4, 5, 6, 7, 10, 11, 12];

export const DANCE: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const COLOR_MODES = ["random", "timeline", "custom"];

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
