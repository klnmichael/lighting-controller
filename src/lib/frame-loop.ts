"use client";

type FrameCallback = (time: number) => void;

const callbacks = new Set<FrameCallback>();
let request: number | undefined;

const run = () => {
  request = requestAnimationFrame(run);
  const time = Date.now();
  for (const callback of callbacks) callback(time);
};

/**
 * Call `callback` with the wall-clock time on every display frame. All
 * subscribers share one requestAnimationFrame loop, which only runs while
 * someone is subscribed. Returns an unsubscribe function.
 */
export function onAnimationFrame(callback: FrameCallback): () => void {
  callbacks.add(callback);
  request ??= requestAnimationFrame(run);
  return () => {
    callbacks.delete(callback);
    if (!callbacks.size && request !== undefined) {
      cancelAnimationFrame(request);
      request = undefined;
    }
  };
}
