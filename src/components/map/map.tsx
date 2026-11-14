"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";
import type { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import {
  advanceLightingLoop,
  createLightingLoopState,
  getActiveLighting,
  queueLightingUpdate,
  type ActiveLighting,
} from "@/lib/lighting-loop";
import { LIGHT_POSITIONS, ROOM_OUTLINE } from "@/lib/room-layout";
import { createLights, type LightState } from "@/lib/lights";
import styles from "./map.module.scss";

export interface MapProps {
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
  onLightsChange: (lights: LightState[]) => void;
  onActiveLightingChange: (lighting: ActiveLighting) => void;
}

const Map = ({
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
  onLightsChange,
  onActiveLightingChange,
}: MapProps) => {
  const lighting = useRef(createLightingLoopState());

  const loopInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const lights = useRef(createLights());
  const lightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onLightsChangeRef = useRef(onLightsChange);
  const onActiveLightingChangeRef = useRef(onActiveLightingChange);

  useEffect(() => {
    onLightsChangeRef.current = onLightsChange;
  }, [onLightsChange]);

  useEffect(() => {
    onActiveLightingChangeRef.current = onActiveLightingChange;
  }, [onActiveLightingChange]);

  const updateLight = (
    ip: number,
    config: { color?: Color; dimming?: number },
  ) => {
    const light = lights.current[IPS.indexOf(ip)];
    if (config.color) light.color = config.color;
    if (config.dimming !== undefined) {
      light.brightness = 1 - config.dimming;
    }
    const element = lightRefs.current[IPS.indexOf(ip)];
    if (element) {
      element.style.backgroundColor = `rgb(${light.color.join(",")})`;
      element.style.opacity = `${light.brightness}`;
    }
  };

  const loop = () => {
    const queue = lighting.current.queue;
    const lightMap = advanceLightingLoop(lighting.current);
    if (!lightMap) return;
    if (queue !== lighting.current.queue) {
      onActiveLightingChangeRef.current(getActiveLighting(lighting.current));
    }
    for (const [ip, params] of Object.entries(lightMap)) {
      updateLight(parseInt(ip), params);
    }
    onLightsChangeRef.current(lights.current);
  };

  const startLoop = () => {
    if (!loopInterval.current) {
      lighting.current.currentBeat = -1;
      lighting.current.currentTick = -1;
      loop();
      loopInterval.current = setInterval(loop, 1000 / 60);
    }
  };

  const stopLoop = () => {
    if (loopInterval.current) {
      clearInterval(loopInterval.current);
      loopInterval.current = undefined;
    }
  };

  useEffect(() => () => stopLoop(), []);

  useEffect(() => {
    lighting.current.cueTimestamp = cueTimestamp;
  }, [cueTimestamp]);

  useEffect(() => {
    lighting.current.seedShift = seedShift;
  }, [seedShift]);

  useEffect(() => {
    lighting.current.bpm = bpm;
  }, [bpm]);

  useEffect(() => {
    queueLightingUpdate(lighting.current, {
      sequenceColorMode,
      sequenceColor,
      accent,
      accentColorMode,
      accentColor,
    });
  }, [sequenceColorMode, sequenceColor, accent, accentColorMode, accentColor]);

  useEffect(() => {
    if (sequence) {
      if (lighting.current.activeSequence) {
        queueLightingUpdate(lighting.current, { sequence });
      } else {
        lighting.current.activeSequence = sequence;
        lighting.current.runningSequence = sequence;
      }
      startLoop();
    } else {
      stopLoop();
      lighting.current.activeSequence = "";
      lighting.current.runningSequence = "";
      delete lighting.current.queue.sequence;
    }
    onActiveLightingChangeRef.current(getActiveLighting(lighting.current));
  }, [sequence]);

  useEffect(() => {
    lighting.current.sequenceDimming = sequenceDimming;
  }, [sequenceDimming]);

  useEffect(() => {
    lighting.current.accentDimming = accentDimming;
  }, [accentDimming]);

  return (
    <section className={styles.container} aria-label="2D lighting map">
      <div className={styles.layout}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 523 671"
          fill="none"
        >
          <polygon
            points={ROOM_OUTLINE.map(([x, y]) => `${x} ${y}`).join(" ")}
          />
        </svg>
        <div className={styles.plan}>
          <Image
            src="/map-plan.png"
            alt=""
            fill
            sizes="78svh"
            loading="eager"
          />
        </div>
        <ol className={styles.lights}>
          {IPS.map((ip, index) => (
            <li
              key={ip}
              data-index={index}
              style={{
                left: `${LIGHT_POSITIONS[index][0]}%`,
                top: `${LIGHT_POSITIONS[index][1]}%`,
              }}
            >
              <div />
              <div
                ref={(element) => {
                  lightRefs.current[index] = element;
                }}
                title={`#${index} ${ip}`}
                data-index={index}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Map;
