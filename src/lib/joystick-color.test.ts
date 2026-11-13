import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVE_COLORS } from "./constants.ts";
import { JoystickColorSelection } from "./joystick-color.ts";

test("maps each clockwise sector and keeps previewing until centered", () => {
  const stick = new JoystickColorSelection();
  for (let index = 0; index < ACTIVE_COLORS.length; index++) {
    for (const offset of [-0.49, 0, 0.49]) {
      const angle = (index + offset) * 2 * Math.PI / ACTIVE_COLORS.length;
      const x = Math.sin(angle) * 0.9;
      const y = -Math.cos(angle) * 0.9;
      const expected = { preview: ACTIVE_COLORS[index], selected: null };
      assert.deepEqual(stick.update(x, y), expected);
      assert.deepEqual(stick.update(x, y), expected);
    }
  }
  assert.deepEqual(stick.update(0, 0), {
    preview: null, selected: ACTIVE_COLORS.at(-1),
  });
  assert.deepEqual(stick.update(0, 0), { preview: null, selected: null });
});

test("ignores radial drift, while diagonal motion outside the dead zone selects", () => {
  const stick = new JoystickColorSelection();
  assert.deepEqual(stick.update(0.15, 0), { preview: null, selected: null });
  assert.deepEqual(stick.update(0.1, -0.1), { preview: null, selected: null });
  assert.notEqual(stick.update(0.12, -0.12).preview, null);
  assert.notEqual(stick.update(0, 0).selected, null);
});

test("click cancels until released and centered without affecting the other stick", () => {
  const left = new JoystickColorSelection();
  const right = new JoystickColorSelection();
  const empty = { preview: null, selected: null };
  left.update(0, -1);
  right.update(0, 1);
  assert.deepEqual(left.update(0, -1, true), empty);
  assert.deepEqual(left.update(0, 0, true), empty);
  assert.deepEqual(left.update(1, 0, false), empty);
  assert.deepEqual(right.update(0, 0), {
    preview: null, selected: ACTIVE_COLORS[5],
  });
  assert.deepEqual(left.update(0, 0), empty);
  assert.deepEqual(left.update(0, -1), {
    preview: ACTIVE_COLORS[0], selected: null,
  });
  assert.deepEqual(left.update(0, 0), {
    preview: null, selected: ACTIVE_COLORS[0],
  });
});
