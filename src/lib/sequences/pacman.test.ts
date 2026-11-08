import assert from "node:assert/strict";
import test from "node:test";
import { IPS, OUTLINE } from "../constants.ts";
import { sequenceOrder, sequences } from "./index.ts";

type Frame = { ips?: number[]; dimming: number }[];

const timeline: Frame[] = sequences.pacmanChase.timeline();

test("Pacman Chase is selectable and loops every four beats", () => {
  assert.equal(sequences.pacmanChase.title, "Pacman Chase");
  assert.equal(sequenceOrder.filter((name) => name === "pacmanChase").length, 1);
  assert.equal(timeline.length, 16);
  assert.deepEqual(sequences.pacmanChase.timeline(), timeline);
});

test("every frame clears all lights and only illuminates OUTLINE IPs", () => {
  for (const frame of timeline) {
    assert.deepEqual(frame[0], { dimming: 1 });
    assert.equal(frame.length, OUTLINE.length + 1);
    assert.deepEqual(frame.slice(1).map((update) => update.ips), OUTLINE.map(
      (index) => [IPS[index]],
    ));
    for (const update of frame) {
      assert.ok(Number.isFinite(update.dimming));
      assert.ok(update.dimming >= 0 && update.dimming <= 1);
    }
  }
});

test("two trails stay lit with dark gaps while the trailing chaser blinks", () => {
  timeline.forEach((frame, tick) => {
    const lit = frame.slice(1).map((update) => update.dimming < 1);
    const trailCount = lit.filter(
      (isLit, position) =>
        isLit && !lit[(position + OUTLINE.length - 1) % OUTLINE.length],
    ).length;
    assert.equal(trailCount, tick % 4 < 2 ? 3 : 2, `tick ${tick}`);
  });
});

test("trails move clockwise at fixed spacing and fade across the wraparound", () => {
  timeline.forEach((frame, tick) => {
    const brightness = Array<number>(OUTLINE.length).fill(0);
    for (let trail = 0; trail < 3; trail++) {
      if (trail === 2 && tick % 4 >= 2) continue;
      const head = (
        tick * OUTLINE.length / 16 - trail * 4 + OUTLINE.length
      ) % OUTLINE.length;
      const position = Math.floor(head);
      const fraction = head - position;
      brightness[position] = 1 - fraction / 2;
      brightness[(position + OUTLINE.length - 1) % OUTLINE.length] =
        (1 - fraction) / 2;
      brightness[(position + 1) % OUTLINE.length] = fraction;
    }
    frame.slice(1).forEach((update, position) => {
      assert.equal(update.dimming, 1 - brightness[position], `tick ${tick}, light ${position}`);
    });
  });
});

test("existing circle sequences retain their original dimming", () => {
  for (const [name, count, direction] of [
    ["circle1", 1, 1],
    ["circle1Reverse", 1, -1],
    ["circle2", 2, 1],
    ["circle2Reverse", 2, -1],
  ] as const) {
    const frames: Frame[] = sequences[name].timeline();
    assert.equal(frames.length, 16);
    frames.forEach((frame, tick) => {
      assert.deepEqual(frame[0], { dimming: 1 });
      OUTLINE.forEach((index, position) => {
        const dimming = Math.min(...Array.from({ length: count }, (_, streak) => {
          const head = (tick / 16 + streak / count) * OUTLINE.length;
          const distance = (head - direction * position + OUTLINE.length) % OUTLINE.length;
          return Math.min(1, distance / 4, OUTLINE.length - distance);
        }));
        assert.deepEqual(frame[position + 1], { ips: [IPS[index]], dimming });
      });
    });
  }
});
