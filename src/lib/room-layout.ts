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

// Percentages from the original map, in IPS order (not a regularized grid).
export const LIGHT_POSITIONS: readonly (readonly [number, number])[] = [
  [11.4, 8.9], [31.6, 8.9], [50.1, 8.9], [67, 8.9], [85.6, 8.9],
  [62, 16.2], [74, 16.2], [85.6, 16.2],
  [11.4, 28.8], [31.6, 28.8], [50.1, 28.8], [67, 28.8], [85.6, 28.8],
  [19.2, 49.4], [39.4, 49.4], [57.9, 49.4],
  [19.2, 63.8], [57.9, 63.8],
  [19.2, 78], [57.9, 78],
  [19.2, 92.5], [39.4, 92.5], [57.9, 92.5],
];

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
