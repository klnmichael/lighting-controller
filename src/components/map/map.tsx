"use client";

import Image from "next/image";
import { useRef, useState, useEffect, act } from "react";
import type { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
// import Wave from "../blocks/wave";
// import Flash from "../blocks/flash";
// import Sparkle from "../blocks/sparkle";
import styles from "./map.module.scss";
import { sequences } from "@/lib/sequences";

export interface MapProps {
  bpm?: number;
  activeSequence?: any;
  onControllerClick?: () => void;
}

const Map = ({ bpm, activeSequence, onControllerClick }: MapProps) => {
  const lightRefs = useRef<(HTMLElement | null)[]>([]);

  // const updateLights = (index, config) => {
  //   const lightRef = lightRefs.current[index];
  //   if (lightRef) {
  //     if (config.color) {
  //       lightRef.style.backgroundColor = `rgb(${config.color[0]}, ${config.color[1]}, ${config.color[2]})`;
  //     }
  //     if (config.dimming || config.dimming === 0) {
  //       lightRef.style.opacity = `${Math.max(config.dimming / 100, 0.2)}`;
  //     }
  //   }
  // };

  // useEffect(() => {
  //   const loop = () => {
  //     sequences[activeSequence].loop(updateLights, bpm);
  //     setTimeout(() => {
  //       loop();
  //     }, (1000 * 60) / bpm);
  //   };
  //   if (activeSequence) loop();
  // }, [activeSequence]);

  // const updateLight = async ({
  //   index,
  //   color,
  //   dimming,
  // }: {
  //   index: number;
  //   color?: Color;
  //   dimming?: number;
  // }) => {
  //   const lightRef = lightRefs.current[index];
  //   if (lightRef) {
  //     if (color) {
  //       lightRef.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  //     }
  //     if (dimming || dimming === 0) {
  //       lightRef.style.opacity = `${Math.max(dimming / 100, 0.2)}`;
  //     }
  //   }
  //   fetch("http://192.168.50.150:3000", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ ip: IPS[index], color, dimming }),
  //   });
  // };

  // useEffect(() => {
  //   const onDocumentKeydown = (e: KeyboardEvent) => {
  //     switch (e.code) {
  //       case "Escape":
  //         setActiveBlock("");
  //         break;
  //     }
  //   };
  //   document.addEventListener("keydown", onDocumentKeydown);
  //   return () => {
  //     document.removeEventListener("keydown", onDocumentKeydown);
  //   };
  // }, []);

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
      <button className={styles.close} onClick={onControllerClick}>
        Controller
      </button>
      {/* <div className={styles.blocks}>
        <Wave
          active={activeBlock === "wave"}
          bpm={bpm}
          updateLight={updateLight}
          onRun={(state) => setActiveBlock(state ? "wave" : "")}
        />
        <Flash
          active={activeBlock === "flash"}
          bpm={bpm}
          updateLight={updateLight}
          onRun={(state) => setActiveBlock(state ? "flash" : "")}
        />
        <Sparkle
          active={activeBlock === "sparkle"}
          bpm={bpm}
          updateLight={updateLight}
          onRun={(state) => setActiveBlock(state ? "sparkle" : "")}
        />
      </div> */}
    </section>
  );
};

export default Map;
