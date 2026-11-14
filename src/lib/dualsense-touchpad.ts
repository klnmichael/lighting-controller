import { accentOrder } from "./accents.ts";

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export const TOUCHPAD_SEQUENCES = [
  "pulsate",
  "circle1",
  "circle2",
  "waveAlternating",
  "waveKitchenWall",
  "waveRadiateOut",
] as const;

export type TouchpadAction =
  | { type: "sequence"; name: (typeof TOUCHPAD_SEQUENCES)[number] }
  | { type: "accent"; name: string };

export function dualSenseTouches(
  reportId: number,
  data: DataView,
): TouchPoint[] | null {
  // WebHID excludes the report ID. Bluetooth adds one input header byte.
  const offset = reportId === 0x01 ? 0 : reportId === 0x31 ? 1 : -1;
  if (offset === -1 || (reportId === 0x01 && data.byteLength === 9)) {
    return null;
  }
  if (data.byteLength < (reportId === 0x01 ? 63 : 77)) {
    throw new Error("Incomplete DualSense touchpad input report.");
  }
  const touches: TouchPoint[] = [];
  for (let slot = 0; slot < 2; slot++) {
    const start = offset + 32 + slot * 4;
    const contact = data.getUint8(start);
    if (contact & 0x80) continue;
    const xy = data.getUint8(start + 2);
    touches.push({
      id: contact & 0x7f,
      x: data.getUint8(start + 1) | ((xy & 0x0f) << 8),
      y: (xy >> 4) | (data.getUint8(start + 3) << 4),
    });
  }
  return touches;
}

export class DualSenseTouchpadSelection {
  private contactId: number | null = null;
  private action: TouchpadAction | null = null;
  private cancelled = false;

  update(
    touches: TouchPoint[],
    clicked = false,
  ): {
    selected: TouchpadAction | null;
  } {
    if (clicked) {
      this.cancelled = true;
      this.contactId = null;
      this.action = null;
    }
    if (this.cancelled) {
      if (!clicked && !touches.length) this.cancelled = false;
      return { selected: null };
    }
    if (!touches.length) {
      const selected = this.action;
      this.contactId = null;
      this.action = null;
      return { selected };
    }
    this.contactId ??= touches[0].id;
    const touch = touches.find((point) => point.id === this.contactId);
    if (touch) {
      if (touch.y < 540) {
        const column = Math.min(
          TOUCHPAD_SEQUENCES.length - 1,
          Math.floor((touch.x * TOUCHPAD_SEQUENCES.length) / 1920),
        );
        this.action = {
          type: "sequence",
          name: TOUCHPAD_SEQUENCES[column],
        };
      } else {
        const column = Math.min(
          accentOrder.length - 1,
          Math.floor((touch.x * accentOrder.length) / 1920),
        );
        this.action = { type: "accent", name: accentOrder[column] };
      }
    }
    return { selected: null };
  }
}
