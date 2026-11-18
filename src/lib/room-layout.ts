import { LIGHTS } from "./constants.ts";

export const BLUEPRINT_WIDTH = 523;
export const BLUEPRINT_DEPTH = 671;
export const BLUEPRINT_SCALE = 0.01;
export const CEILING_HEIGHT = 1.35;

export const ROOM_OUTLINE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, 290],
  [45, 290],
  [45, 671],
  [348, 671],
  [348, 290],
  [523, 290],
  [523, 0],
];

// Percentages from the original map, in LIGHTS order.
export const LIGHT_POSITIONS: readonly (readonly [number, number])[] =
  LIGHTS.map((light) => light.position);

export function blueprintToWorld(x: number, y: number): [number, number] {
  return [
    (x - BLUEPRINT_WIDTH / 2) * BLUEPRINT_SCALE,
    (y - BLUEPRINT_DEPTH / 2) * BLUEPRINT_SCALE,
  ];
}

export function isWallOccludingRoom(
  start: readonly [number, number],
  end: readonly [number, number],
  camera: { x: number; z: number },
): boolean {
  // The clockwise outline puts the room on the right of each directed wall.
  const inwardX = end[1] - start[1];
  const inwardZ = start[0] - end[0];
  return inwardX * (camera.x - start[0]) + inwardZ * (camera.z - start[1]) < 0;
}

export function lightPosition(index: number): [number, number, number] {
  const position = LIGHT_POSITIONS[index];
  if (!position) throw new RangeError(`Unknown light index: ${index}`);
  const [x, z] = blueprintToWorld(
    (position[0] / 100) * BLUEPRINT_WIDTH,
    (position[1] / 100) * BLUEPRINT_DEPTH,
  );
  return [x, CEILING_HEIGHT, z];
}
