import type { Color } from "../types/global.ts";

export class JoystickColorSelection {
  private color: Color | null = null;
  private cancelled = false;

  constructor(private colors: Color[]) {}

  update(
    x: number,
    y: number,
    clicked = false,
  ): {
    preview: Color | null;
    selected: Color | null;
  } {
    const centered = Math.hypot(x, y) <= 0.15;
    if (clicked) {
      this.cancelled = true;
      this.color = null;
    }
    if (this.cancelled) {
      if (!clicked && centered) this.cancelled = false;
      return { preview: null, selected: null };
    }
    if (centered) {
      const selected = this.color;
      this.color = null;
      return { preview: null, selected };
    }
    // Array order runs clockwise, with the first color centered at twelve o'clock.
    const angle = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);
    const index =
      Math.round((angle * this.colors.length) / (2 * Math.PI)) %
      this.colors.length;
    this.color = this.colors[index];
    return { preview: this.color, selected: null };
  }
}
