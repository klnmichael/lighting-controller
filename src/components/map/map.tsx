"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";
import type { Color } from "@/types/global";
import {
  ACCENT_COLORS,
  ACTIVE_COLORS,
  COLOR_MODES,
  IPS,
} from "@/lib/constants";
import { sequenceOrder, sequences } from "@/lib/sequences";
import { accentOrder, accents } from "@/lib/accents";
import { LIGHT_POSITIONS, ROOM_OUTLINE } from "@/lib/room-layout";
import { createLights, type LightState } from "@/lib/lights";
import styles from "./map.module.scss";

export interface MapProps {
  onLightsChange: (lights: LightState[]) => void;
  cueTimestamp: number;
  bpm: number;
  sequence?: string;
  sequenceColorMode: string;
  sequenceColor: Color;
  sequenceDimming: number;
  accent?: string;
  accentColorMode: string;
  accentColor: Color;
  accentDimming: number;
}

const Map = ({
  onLightsChange,
  cueTimestamp,
  bpm,
  sequence,
  sequenceColorMode,
  sequenceColor,
  sequenceDimming,
  accent,
  accentColorMode,
  accentColor,
  accentDimming,
}: MapProps) => {
  const seedLoopRef = useRef(0);
  const cueTimestampRef = useRef(cueTimestamp);
  const bpmRef = useRef(bpm);

  const activeSequence = useRef("");
  const runningSequence = useRef("");
  const sequenceColorModeRef = useRef(sequenceColorMode);
  const sequenceColorRef = useRef(sequenceColor);
  const sequenceDimmingRef = useRef(sequenceDimming);

  const activeAccent = useRef("");
  const runningAccent = useRef("");
  const accentColorModeRef = useRef(accentColorMode);
  const accentColorRef = useRef(accentColor);
  const accentDimmingRef = useRef(accentDimming);

  const queueRef = useRef<{
    sequence?: string;
    sequenceColorMode?: string;
    sequenceColor?: Color;
    accent?: string;
    accentColorMode?: string;
    accentColor?: Color;
  }>({});

  const currentBeat = useRef(-1);
  const currentTick = useRef(-1);

  const loopInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const lights = useRef(createLights());
  const lightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onLightsChangeRef = useRef(onLightsChange);

  useEffect(() => {
    onLightsChangeRef.current = onLightsChange;
  }, [onLightsChange]);

  const mulberry32 = (seed: number) => {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const getSeededItem = (array: any[], seed: number) => {
    const rng = mulberry32(seed);
    const index = Math.floor(rng() * array.length);
    return array[index];
  };

  const updateLight = (
    ip: number,
    config: { color?: Color; dimming?: number },
  ) => {
    const light = lights.current[IPS.indexOf(ip)];
    if (config.color) light.color = config.color;
    if (config.dimming !== undefined) {
      light.brightness = (1 - config.dimming) * sequenceDimmingRef.current;
    }
    const element = lightRefs.current[IPS.indexOf(ip)];
    if (element) {
      element.style.backgroundColor = `rgb(${light.color.join(",")})`;
      element.style.opacity = `${light.brightness}`;
    }
  };

  const loop = () => {
    seedLoopRef.current += 1;
    const seed = seedLoopRef.current;
    const time = Date.now();
    const beat =
      ((time - cueTimestampRef.current) / (60000 / bpmRef.current)) % 16;
    const beatFloor = Math.floor(beat);
    const tick = (beat - beatFloor) * 4;
    const tickFloor = Math.floor(tick);
    if (currentBeat.current === beatFloor && currentTick.current === tickFloor)
      return;
    currentBeat.current = beatFloor;
    currentTick.current = tickFloor;

    // console.log(`${currentBeat.current + 1}/${currentTick.current + 1}`);

    if (!(currentBeat.current % 4) && currentTick.current === 0) {
      if (queueRef.current.sequence) {
        activeSequence.current = queueRef.current.sequence;
        runningSequence.current = queueRef.current.sequence;
      }
      if (queueRef.current.sequenceColorMode)
        sequenceColorModeRef.current = queueRef.current.sequenceColorMode;
      if (queueRef.current.sequenceColor)
        sequenceColorRef.current = queueRef.current.sequenceColor;
      if (queueRef.current.accent || queueRef.current.accent === "") {
        activeAccent.current = queueRef.current.accent;
        runningAccent.current = queueRef.current.accent;
      }
      if (queueRef.current.accentColorMode)
        accentColorModeRef.current = queueRef.current.accentColorMode;
      if (queueRef.current.accentColor)
        accentColorRef.current = queueRef.current.accentColor;
      queueRef.current = {};
    }

    if (!(currentBeat.current % 4) && currentTick.current === 0) {
      if (activeSequence.current === "random") {
        const availableSequences = sequenceOrder.filter(
          (sequence) => sequence !== runningSequence.current,
        );
        runningSequence.current = getSeededItem(availableSequences, seed);
      }
      if (activeAccent.current === "random")
        runningAccent.current = getSeededItem(accentOrder, seed);
    }

    if (!(currentBeat.current % 2) && currentTick.current === 0) {
      if (sequenceColorModeRef.current === COLOR_MODES[0]) {
        sequenceColorRef.current = getSeededItem(ACTIVE_COLORS, seed);
      }
      if (accentColorModeRef.current === COLOR_MODES[0]) {
        accentColorRef.current = getSeededItem(ACCENT_COLORS, seed * 3);
      }
    }

    const lightMap: Record<number, { color?: Color; dimming?: number }> = {};

    const sequenceTimeline =
      sequences[runningSequence.current]?.timeline({
        beat: currentBeat.current,
        tick: currentTick.current,
      }) || [];
    const sequenceTimelineBeats = sequenceTimeline.length / 4;
    const sequenceTimelineData =
      sequenceTimeline[
        (currentBeat.current % sequenceTimelineBeats) * 4 + currentTick.current
      ];
    if (sequenceTimelineData) {
      if (
        sequenceColorModeRef.current === COLOR_MODES[1] &&
        !(currentTick.current % 2)
      ) {
        sequenceColorRef.current = getSeededItem(ACTIVE_COLORS, seed);
      }
      sequenceTimelineData.forEach((data: any) => {
        [...(data.ips || IPS)].forEach((ip) => {
          lightMap[ip] = {};
          lightMap[ip].dimming = data.dimming;
          lightMap[ip].color = sequenceColorRef.current;
          if (data.randomDimming) {
            lightMap[ip].dimming =
              Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
              data.randomDimming[0];
          }
        });
      });
    }

    const accentTimeline =
      accents[runningAccent.current]?.timeline({
        beat: currentBeat.current,
        tick: currentTick.current,
      }) || [];
    const accentTimelineBeats = accentTimeline.length / 4;
    const accentTimelineData =
      accentTimeline[
        (currentBeat.current % accentTimelineBeats) * 4 + currentTick.current
      ];
    if (accentTimelineData) {
      accentTimelineData.forEach((data: any) => {
        data.ips.forEach((ip: number) => {
          if (!lightMap[ip]) lightMap[ip] = {};
          lightMap[ip].dimming = data.dimming;
          lightMap[ip].color = accentColorRef.current;
        });
      });
    }

    for (const [ip, params] of Object.entries(lightMap)) {
      updateLight(parseInt(ip), params);
    }
    onLightsChangeRef.current(lights.current);
  };

  const startLoop = () => {
    if (!loopInterval.current) {
      currentBeat.current = -1;
      currentTick.current = -1;
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
    cueTimestampRef.current = cueTimestamp;
  }, [cueTimestamp]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (sequenceColorMode)
      queueRef.current.sequenceColorMode = sequenceColorMode;
    if (sequenceColor) queueRef.current.sequenceColor = sequenceColor;
    if (accent || accent === "") queueRef.current.accent = accent;
    if (accentColorMode) queueRef.current.accentColorMode = accentColorMode;
    if (accentColor) queueRef.current.accentColor = accentColor;
  }, [sequenceColorMode, sequenceColor, accent, accentColorMode, accentColor]);

  useEffect(() => {
    if (sequence) {
      if (activeSequence.current) {
        queueRef.current.sequence = sequence;
      } else {
        activeSequence.current = sequence;
        runningSequence.current = sequence;
      }
      startLoop();
    } else {
      stopLoop();
      activeSequence.current = "";
      runningSequence.current = "";
    }
  }, [sequence]);

  useEffect(() => {
    sequenceDimmingRef.current = sequenceDimming;
  }, [sequenceDimming]);

  useEffect(() => {
    accentDimmingRef.current = accentDimming;
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
