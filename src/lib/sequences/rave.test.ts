import assert from "node:assert/strict";
import test from "node:test";
import { COUCH, DANCE, IPS, KITCHEN, OUTLINE, RADIAL, ROWS_X } from "../constants.ts";
import { sequenceOrder, sequences } from "./index.ts";

type Frame = { ips?: number[]; dimming: number }[];

const patterns = {
  laserBounce: "Laser Bounce",
  radialRipple: "Radial Ripple",
  zoneCrossfade: "Zone Crossfade",
  orbitCollision: "Orbit Collision",
};

const brightness = (frame: Frame) => {
  const lights = new Map<number, number>();
  for (const update of frame) {
    for (const ip of update.ips ?? IPS) lights.set(ip, 1 - update.dimming);
  }
  return lights;
};

const close = (actual: number | undefined, expected: number) => {
  assert.ok(actual !== undefined && Math.abs(actual - expected) < 1e-12);
};

test("all four rave patterns are selectable, deterministic four-beat loops", () => {
  for (const [name, title] of Object.entries(patterns)) {
    assert.equal(sequences[name].title, title);
    assert.equal(sequenceOrder.filter((entry) => entry === name).length, 1);
    const frames: Frame[] = sequences[name].timeline();
    assert.equal(frames.length, 16);
    assert.deepEqual(sequences[name].timeline({ beat: 7, tick: 3 }), frames);
    assert.ok(new Set(frames.map((frame) => JSON.stringify(frame))).size > 4);
    for (const frame of frames) {
      assert.deepEqual(frame[0], { dimming: 1 });
      for (const update of frame) {
        assert.ok(Number.isFinite(update.dimming));
        assert.ok(update.dimming >= 0 && update.dimming <= 1);
        assert.ok(!("color" in update));
        if (update.ips) {
          assert.ok(update.ips.length > 0);
          assert.equal(new Set(update.ips).size, update.ips.length);
          assert.ok(update.ips.every((ip) => IPS.includes(ip)));
        }
      }
    }
  }
});

test("Laser Bounce crossfades neighboring columns and retraces its path", () => {
  const frames: Frame[] = sequences.laserBounce.timeline();
  frames.forEach((frame, tick) => {
    const lights = brightness(frame);
    const head = (1 - Math.abs(tick / 8 - 1)) * 3;
    ROWS_X.forEach((row, position) => {
      for (const index of row) {
        close(lights.get(IPS[index]), Math.max(0, 1 - Math.abs(position - head)));
      }
    });
    assert.deepEqual(frame, frames[(16 - tick) % 16]);
  });
  close(brightness(frames[0]).get(IPS[ROWS_X[0][0]]), 1);
  close(brightness(frames[8]).get(IPS[ROWS_X[3][0]]), 1);
});

test("Radial Ripple peaks on successive rings one beat apart", () => {
  const frames: Frame[] = sequences.radialRipple.timeline();
  RADIAL.forEach((ring, position) => {
    for (const index of ring) {
      close(brightness(frames[position * 4]).get(IPS[index]), 1);
      close(brightness(frames[(position * 4 + 8) % 16]).get(IPS[index]), 0);
    }
  });
});

test("Zone Crossfade cycles couch, kitchen, dance with complementary brightness", () => {
  const frames: Frame[] = sequences.zoneCrossfade.timeline();
  const zones = [COUCH, KITCHEN, DANCE];
  frames.forEach((frame, tick) => {
    const lights = brightness(frame);
    const head = tick * 3 / 16;
    const current = Math.floor(head);
    const blend = head - current;
    zones.forEach((zone, position) => {
      const expected = position === current ? 1 - blend
        : position === (current + 1) % 3 ? blend : 0;
      for (const index of zone) close(lights.get(IPS[index]), expected);
    });
  });
  close(brightness(frames[15]).get(IPS[COUCH[0]]), 13 / 16);
});

test("Orbit Collision mirrors two counter-rotating trails with dark interior", () => {
  const frames: Frame[] = sequences.orbitCollision.timeline();
  const clockwise: Frame[] = sequences.circle1.timeline();
  const counterclockwise: Frame[] = sequences.circle1Reverse.timeline();
  frames.forEach((frame, tick) => {
    const lights = brightness(frame);
    const forward = brightness(clockwise[tick]);
    const reverse = brightness(counterclockwise[tick]);
    IPS.forEach((ip, index) => {
      close(lights.get(ip), Math.max(forward.get(ip)!, reverse.get(ip)!));
      if (!OUTLINE.includes(index)) close(lights.get(ip), 0);
    });
    OUTLINE.forEach((index, position) => {
      close(lights.get(IPS[index]), lights.get(IPS[OUTLINE[(OUTLINE.length - position) % OUTLINE.length]])!);
    });
  });
  for (const [tick, expectedTrails] of [[0, 1], [4, 2], [8, 1], [14, 2]]) {
    const lights = brightness(frames[tick]);
    const lit = OUTLINE.map((index) => lights.get(IPS[index])! > 0);
    const trails = lit.filter((on, position) =>
      on && !lit[(position + OUTLINE.length - 1) % OUTLINE.length],
    ).length;
    assert.equal(trails, expectedTrails, `tick ${tick}`);
  }
});
