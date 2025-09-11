export type Color = [number, number, number];

export interface WizLight {
  state?: boolean;
  color?: Color;
  r?: number;
  g?: number;
  b?: number;
  w?: number;
  temp?: number;
  dimming?: number;
  speed?: number;
  fade?: number;
  "fade-in"?: number;
  "fade-out"?: number;
}
