"use client";

import { useEffect, useRef } from "react";
import type { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import {
  advanceLightingEngine,
  createLightingEngine,
  getActiveLighting,
  queueLightingUpdate,
  resetLightingEngine,
  type ActiveLighting,
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
  const engine = useRef(createLightingEngine());
  const frameRequest = useRef<number | undefined>(undefined);

  const lights = useRef(createLights());
  const onLightsChangeRef = useRef(onLightsChange);
  const onActiveLightingChangeRef = useRef(onActiveLightingChange);
  const clockOffsetRef = useRef(clockOffset);
  clockOffsetRef.current = clockOffset;
  const hubSnapshotRef = useRef(hubSnapshot);
  hubSnapshotRef.current = hubSnapshot;

  useEffect(() => {
    onLightsChangeRef.current = onLightsChange;
  }, [onLightsChange]);

  useEffect(() => {
    onActiveLightingChangeRef.current = onActiveLightingChange;
  }, [onActiveLightingChange]);

  const frame = () => {
    frameRequest.current = requestAnimationFrame(frame);
    const time =
      Date.now() + (hubSnapshotRef.current ? clockOffsetRef.current : 0);
    const { queue, sequenceColor, accentColor } = engine.current.state;
    advanceLightingEngine(engine.current, time);
    if (
      queue !== engine.current.state.queue ||
      sequenceColor !== engine.current.state.sequenceColor ||
      accentColor !== engine.current.state.accentColor
    ) {
      onActiveLightingChangeRef.current(
        getActiveLighting(engine.current.state),
      );
    }

    let changed = false;
    IPS.forEach((ip, index) => {
      const { color, brightness } = engine.current.map.sample(ip, time);
      const light = lights.current[index];
      const rounded = color.map(Math.round) as Color;
      if (
        light.brightness === brightness &&
        light.color.every((channel, i) => channel === rounded[i])
      ) {
        return;
      }
      changed = true;
      light.color = rounded;
      light.brightness = brightness;
    });
    if (changed) onLightsChangeRef.current(lights.current);
  };

  const startLoop = () => {
    if (frameRequest.current !== undefined) return;
    resetLightingEngine(engine.current);
    frame();
  };

  const stopLoop = () => {
    if (frameRequest.current !== undefined) {
      cancelAnimationFrame(frameRequest.current);
      frameRequest.current = undefined;
    }
  };

  useEffect(() => () => stopLoop(), []);

  useEffect(() => {
    engine.current.state.cueTimestamp = cueTimestamp;
  }, [cueTimestamp]);

  useEffect(() => {
    engine.current.state.seedShift = seedShift;
  }, [seedShift]);

  useEffect(() => {
    engine.current.state.bpm = bpm;
  }, [bpm]);

  useEffect(() => {
    queueLightingUpdate(engine.current.state, {
      sequenceColorMode,
      sequenceColor,
      accent,
      accentColorMode,
      accentColor,
    });
  }, [sequenceColorMode, sequenceColor, accent, accentColorMode, accentColor]);

  useEffect(() => {
    if (sequence) {
      if (engine.current.state.activeSequence) {
        queueLightingUpdate(engine.current.state, { sequence });
      } else {
        engine.current.state.activeSequence = sequence;
        engine.current.state.runningSequence = sequence;
      }
      startLoop();
    } else {
      stopLoop();
      engine.current.state.activeSequence = "";
      engine.current.state.runningSequence = "";
      delete engine.current.state.queue.sequence;
    }
    onActiveLightingChangeRef.current(getActiveLighting(engine.current.state));
  }, [sequence]);

  useEffect(() => {
    engine.current.state.sequenceDimming = sequenceDimming;
  }, [sequenceDimming]);

  useEffect(() => {
    engine.current.state.accentDimming = accentDimming;
  }, [accentDimming]);

  useEffect(() => {
    if (!hubSnapshot) return;
    engine.current.state = {
      ...hubSnapshot.lighting,
      queue: { ...hubSnapshot.lighting.queue },
    };
    resetLightingEngine(engine.current);
    if (engine.current.state.activeSequence) startLoop();
    else stopLoop();
    onActiveLightingChangeRef.current(getActiveLighting(engine.current.state));
  }, [hubSnapshot]);
}
