import { ACTIVE_COLORS } from "./constants.ts";
import type { Color } from "../types/global.ts";

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

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
  private color: Color | null = null;
  private cancelled = false;

  update(touches: TouchPoint[], clicked = false): {
    preview: Color | null;
    selected: Color | null;
  } {
    if (clicked) {
      this.cancelled = true;
      this.contactId = null;
      this.color = null;
    }
    if (this.cancelled) {
      if (!clicked && !touches.length) this.cancelled = false;
      return { preview: null, selected: null };
    }
    if (!touches.length) {
      const selected = this.color;
      this.contactId = null;
      this.color = null;
      return { preview: null, selected };
    }
    this.contactId ??= touches[0].id;
    const touch = touches.find((point) => point.id === this.contactId);
    // Keep the first finger in control until all fingers are lifted.
    if (touch) {
      const columns = 5;
      const rows = Math.ceil(ACTIVE_COLORS.length / columns);
      const column = Math.min(
        columns - 1,
        Math.floor((touch.x * columns) / 1920),
      );
      const row = Math.min(rows - 1, Math.floor((touch.y * rows) / 1080));
      this.color =
        ACTIVE_COLORS[Math.min(ACTIVE_COLORS.length - 1, row * columns + column)];
    }
    return { preview: this.color, selected: null };
  }
}
