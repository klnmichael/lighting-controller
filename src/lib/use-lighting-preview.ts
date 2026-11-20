"use client";

import { useEffect, useState } from "react";
import type { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import {
  advanceLightingEngine,
  createLightingEngine,
  getActiveLighting,
  queueLightingUpdate,
  resetLightingEngine,
  type ActiveLighting,
  type LightingLoopState,
} from "@/lib/lighting-loop";
import { createLights, type LightState } from "@/lib/lights";
import type { HubSnapshot } from "@/lib/hub-protocol";

export interface LightingPreviewOptions {
  cueTimestamp: number;
  seedShift: number;
  bpm: number;
  sequence?: string;
  sequenceColorMode: string;
  sequenceColor: Color;
  sequenceDimming: number;
  accent?: string;
  accentColorMode: string;
  accentColor: Color;
  accentDimming: number;
  hubSnapshot: HubSnapshot | null;
  clockOffset: number;
  onLightsChange: (lights: LightState[]) => void;
  onActiveLightingChange: (lighting: ActiveLighting) => void;
}

interface PreviewOutputs {
  onLightsChange: (lights: LightState[]) => void;
  onActiveLightingChange: (lighting: ActiveLighting) => void;
  /** Hub clock offset; only applied while mirroring a hub snapshot. */
  clockOffset: number;
  synced: boolean;
}

/**
 * The local lighting engine, run on every display frame. Kept outside React
 * so the frame loop reads plain fields instead of refs.
 */
class LightingPreview {
  private readonly engine = createLightingEngine();
  private readonly lights = createLights();
  private outputs: PreviewOutputs = {
    onLightsChange: () => {},
    onActiveLightingChange: () => {},
    clockOffset: 0,
    synced: false,
  };
  private request: number | undefined;

  connect(outputs: PreviewOutputs) {
    this.outputs = outputs;
  }

  /** Settings that apply from the next tick. */
  update(
    patch: Partial<
      Pick<LightingLoopState, "seedShift" | "bpm" | "sequenceDimming" | "accentDimming">
    >,
  ) {
    Object.assign(this.engine.state, patch);
  }

  /** Settings that apply from the next bar. */
  queue(update: Parameters<typeof queueLightingUpdate>[1]) {
    queueLightingUpdate(this.engine.state, update);
  }

  cue(cueTimestamp: number) {
    this.engine.state.cueTimestamp = cueTimestamp;
    // A cue runs the beat loop even when no sequence is playing.
    if (cueTimestamp) this.start();
  }

  setSequence(sequence: string | undefined) {
    const { state } = this.engine;
    if (sequence) {
      // Queue on the bar while the loop is already ticking, even when only a
      // cue (no sequence) started it.
      if (state.activeSequence || this.ticking) {
        queueLightingUpdate(state, { sequence });
      } else {
        state.activeSequence = sequence;
        state.runningSequence = sequence;
      }
      this.start();
    } else {
      if (!state.cueTimestamp) this.stop();
      state.activeSequence = "";
      state.runningSequence = "";
      delete state.queue.sequence;
    }
    this.notifyActiveLighting();
  }

  /** Adopt the hub's state wholesale. */
  mirror({ lighting }: HubSnapshot) {
    const state = { ...lighting, queue: { ...lighting.queue } };
    this.engine.state = state;
    resetLightingEngine(this.engine);
    if (state.activeSequence || state.cueTimestamp) this.start();
    else this.stop();
    this.notifyActiveLighting();
  }

  stop() {
    if (this.request === undefined) return;
    cancelAnimationFrame(this.request);
    this.request = undefined;
  }

  /** Whether the loop is running and has processed at least one tick. */
  private get ticking() {
    return this.request !== undefined && this.engine.lastTickIndex !== undefined;
  }

  private start() {
    if (this.request !== undefined) return;
    resetLightingEngine(this.engine);
    // Defer the first tick so a sequence set in the same render as a fresh
    // cue starts immediately instead of being queued for the next bar.
    this.request = requestAnimationFrame(this.frame);
  }

  private notifyActiveLighting() {
    this.outputs.onActiveLightingChange(getActiveLighting(this.engine.state));
  }

  private frame = () => {
    this.request = requestAnimationFrame(this.frame);
    const { engine, lights, outputs } = this;
    const time = Date.now() + (outputs.synced ? outputs.clockOffset : 0);
    const { queue, sequenceColor, accentColor } = engine.state;
    advanceLightingEngine(engine, time);
    // The engine replaces these objects (never mutates them) when they change.
    if (
      queue !== engine.state.queue ||
      sequenceColor !== engine.state.sequenceColor ||
      accentColor !== engine.state.accentColor
    ) {
      this.notifyActiveLighting();
    }

    let changed = false;
    for (let index = 0; index < IPS.length; index++) {
      const { color, brightness } = engine.map.sample(IPS[index], time);
      const light = lights[index];
      const r = Math.round(color[0]);
      const g = Math.round(color[1]);
      const b = Math.round(color[2]);
      if (
        light.brightness === brightness &&
        light.color[0] === r &&
        light.color[1] === g &&
        light.color[2] === b
      ) {
        continue;
      }
      changed = true;
      light.color = [r, g, b];
      light.brightness = brightness;
    }
    if (changed) outputs.onLightsChange(lights);
  };
}

/** Runs the local lighting engine every display frame to preview light state. */
export function useLightingPreview({
  cueTimestamp,
  seedShift,
  bpm,
  sequence,
  sequenceColorMode,
  sequenceColor,
  sequenceDimming,
  accent,
  accentColorMode,
  accentColor,
  accentDimming,
  hubSnapshot,
  clockOffset,
  onLightsChange,
  onActiveLightingChange,
}: LightingPreviewOptions) {
  const [preview] = useState(() => new LightingPreview());

  // Declared first so the effects below always call the latest callbacks.
  useEffect(() => {
    preview.connect({
      onLightsChange,
      onActiveLightingChange,
      clockOffset,
      synced: Boolean(hubSnapshot),
    });
  });

  useEffect(() => () => preview.stop(), [preview]);

  useEffect(() => preview.cue(cueTimestamp), [preview, cueTimestamp]);

  useEffect(
    () => preview.update({ seedShift, bpm, sequenceDimming, accentDimming }),
    [preview, seedShift, bpm, sequenceDimming, accentDimming],
  );

  useEffect(
    () =>
      preview.queue({
        sequenceColorMode,
        sequenceColor,
        accent,
        accentColorMode,
        accentColor,
      }),
    [preview, sequenceColorMode, sequenceColor, accent, accentColorMode, accentColor],
  );

  useEffect(() => preview.setSequence(sequence), [preview, sequence]);

  useEffect(() => {
    if (hubSnapshot) preview.mirror(hubSnapshot);
  }, [preview, hubSnapshot]);
}
