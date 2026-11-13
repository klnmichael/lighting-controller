import assert from "node:assert/strict";
import test from "node:test";
import { accentOrder } from "./accents.ts";
import {
  DualSenseTouchpadSelection,
  TOUCHPAD_SEQUENCES,
} from "./dualsense-touchpad.ts";

test("selects each mapped sequence and accent after touch release", () => {
  const selection = new DualSenseTouchpadSelection();
  for (const [index, name] of TOUCHPAD_SEQUENCES.entries()) {
    const x = ((index + 0.5) * 1920) / TOUCHPAD_SEQUENCES.length;
    assert.deepEqual(selection.update([{ id: 1, x, y: 0 }]), {
      selected: null,
    });
    assert.deepEqual(selection.update([]), {
      selected: { type: "sequence", name },
    });
  }
  for (const [index, name] of accentOrder.entries()) {
    const x = ((index + 0.5) * 1920) / accentOrder.length;
    assert.deepEqual(selection.update([{ id: 2, x, y: 1080 }]), {
      selected: null,
    });
    assert.deepEqual(selection.update([]), {
      selected: { type: "accent", name },
    });
  }
});

test("a touchpad click cancels the pending selection", () => {
  const selection = new DualSenseTouchpadSelection();
  selection.update([{ id: 1, x: 100, y: 100 }]);
  assert.deepEqual(
    selection.update([{ id: 1, x: 100, y: 100 }], true),
    { selected: null },
  );
  assert.deepEqual(selection.update([]), { selected: null });
  assert.deepEqual(selection.update([{ id: 1, x: 100, y: 100 }]), {
    selected: null,
  });
  assert.deepEqual(selection.update([]), {
    selected: { type: "sequence", name: TOUCHPAD_SEQUENCES[0] },
  });
});
