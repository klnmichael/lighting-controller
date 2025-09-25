"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";
import randomColor from "randomcolor";
import type { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import styles from "./map.module.scss";
import { sequences } from "@/lib/sequences";

export interface MapProps {
  sequence: string;
  cueTimestamp: number;
  shuffle: boolean;
  bpm: number;
  dimming: number;
  customColor: Color;
  colorShuffle: boolean;
}

const Map = ({
  sequence,
  cueTimestamp,
  shuffle,
  bpm,
  dimming,
  customColor,
  colorShuffle,
}: MapProps) => {
  const activeSequence = useRef("");
  const queuedSequence = useRef("");

  const cueTimestampRef = useRef(cueTimestamp);
  const shuffleRef = useRef(shuffle);
  const bpmRef = useRef(bpm);
  const dimmingRef = useRef(dimming);
  const customColorRef = useRef<Color>(customColor);
  const colorShuffleRef = useRef(colorShuffle);

  const currentBeat = useRef(-1);
  const currentTick = useRef(-1);

  const loopInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );

  const lightRefs = useRef<(HTMLElement | null)[]>([]);

  const updateLight = (ip: number, config: any) => {
    const lightRef = lightRefs.current[IPS.indexOf(ip)];
    if (lightRef) {
      if (config.color) {
        lightRef.style.backgroundColor = `rgb(${config.color[0]}, ${config.color[1]}, ${config.color[2]})`;
      }
      if (config.dimming || config.dimming === 0) {
        lightRef.style.opacity = `${Math.max(config.dimming / 100, 0.2)}`;
      }
    }
  };

  const loop = () => {
    const time = Date.now();
    const beat =
      ((time - cueTimestampRef.current) / (60000 / bpmRef.current)) % 8;
    const beatFloor = Math.floor(beat);
    const tick = (beat - beatFloor) * 4;
    const tickFloor = Math.floor(tick);
    if (currentBeat.current === beatFloor && currentTick.current === tickFloor)
      return;
    currentBeat.current = beatFloor;
    currentTick.current = tickFloor;
    // console.log(`${currentBeat.current + 1}/${currentTick.current + 1}`);
    if (!(currentBeat.current % 2) && currentTick.current === 0) {
      if (queuedSequence.current) {
        activeSequence.current = queuedSequence.current;
        queuedSequence.current = "";
      }
      customColorRef.current = randomColor({
        luminosity: "bright",
        format: "rgbArray",
      }) as unknown as Color;
    }
    const timeline =
      sequences[activeSequence.current]?.timeline({
        beat: currentBeat.current,
        tick: currentTick.current,
      }) || [];
    const timelineBeats = timeline.length / 4;
    const barData =
      timeline[(currentBeat.current % timelineBeats) * 4 + currentTick.current];
    if (barData) {
      barData.forEach((data: any) => {
        if (!data) return;
        [...(data.ips || IPS)].forEach((ip) => {
          const params: any = {
            dimming:
              data.dimming || data.dimming === 0
                ? data.dimming * dimmingRef.current
                : dimmingRef.current,
          };
          if (data.color) params.color = data.color;
          if (data.randomColor) {
            params.color = randomColor({
              luminosity: "bright",
              format: "rgbArray",
            }) as unknown as Color;
          }
          if (data.customColor) params.color = customColorRef.current;
          if (data.randomDimming) {
            params.dimming = Math.round(
              (Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
                data.randomDimming[0]) *
                dimmingRef.current
            );
          }
          updateLight(ip, params);
        });
      });
    }
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

  useEffect(() => {
    cueTimestampRef.current = cueTimestamp;
    shuffleRef.current = shuffle;
    bpmRef.current = bpm;
    dimmingRef.current = dimming;
    customColorRef.current = customColor;
    colorShuffleRef.current = colorShuffle;
  }, [cueTimestamp, shuffle, bpm, dimming, customColor, colorShuffle]);

  useEffect(() => {
    if (sequence) {
      if (activeSequence.current && sequence !== activeSequence.current) {
        queuedSequence.current = sequence;
      } else {
        activeSequence.current = sequence;
        startLoop();
      }
    } else {
      stopLoop();
      activeSequence.current = "";
      queuedSequence.current = "";
    }
  }, [sequence]);

  // useEffect(() => {
  //   if (sequence) {
  //     if (sequence === "dark") {
  //       stopLoop();
  //       activeSequence.current = sequence;
  //       startLoop();
  //     } else {
  //       if (activeSequence.current) {
  //         if (activeSequence.current === "dark") {
  //           stopLoop();
  //           activeSequence.current = sequence;
  //           startLoop();
  //         } else {
  //           queuedSequence.current = sequence;
  //         }
  //       } else {
  //         activeSequence.current = sequence;
  //         startLoop();
  //       }
  //     }
  //   } else {
  //     stopLoop();
  //     activeSequence.current = "";
  //     queuedSequence.current = "";
  //   }
  //   if (!loopTimeout) startLoop();
  // }, [sequence]);

  return (
    <section className={styles.container}>
      <div className={styles.layout}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 523 671"
          fill="none"
        >
          <polygon points="0 0 0 290 45 290 45 671 348 671 348 290 523 290 523 0 0 0" />
        </svg>
        <div className={styles.plan}>
          <Image src="/map-plan.png" alt="" fill sizes="1" />
        </div>
        <ol className={styles.lights}>
          {IPS.map((_, index) => (
            <li key={index}>
              <div></div>
              <div
                ref={(ref) => {
                  lightRefs.current[index] = ref;
                }}
                title={`#${index} ${IPS[index]}`}
              ></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Map;
