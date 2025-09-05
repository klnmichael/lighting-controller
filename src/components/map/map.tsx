"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { IPS } from "@/lib/constants";
import Wave from "../blocks/wave";
import Flash from "../blocks/flash";
import Sparkle from "../blocks/sparkle";
import styles from "./map.module.scss";

const Map = () => {
  const lightRefs = useRef<(HTMLElement | null)[]>([]);

  const [activeBlock, setActiveBlock] = useState("");
  const activeBlockRef = useRef("");

  const [bpm, setBpm] = useState(125);

  const updateLight = async ({
    index,
    color,
    dimming,
  }: {
    index: number;
    color?: [number, number, number];
    dimming?: number;
  }) => {
    const lightRef = lightRefs.current[index];
    if (lightRef) {
      if (color) {
        lightRef.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      }
      if (dimming || dimming === 0) {
        lightRef.style.opacity = `${Math.max(dimming / 100, 0.2)}`;
      }
    }
    // fetch("/api/wiz", {
    //   method: "POST",
    //   body: JSON.stringify({ ip: IPS[index], color, dimming }),
    // });
  };

  useEffect(() => {
    activeBlockRef.current = activeBlock;
  }, [activeBlock]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Escape":
          setActiveBlock("");
          break;
      }
    };
    document.addEventListener("keydown", onDocumentKeydown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeydown);
    };
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.bpm}>
        <input
          type="number"
          defaultValue={125}
          onChange={(e) => {
            setBpm(parseFloat(e.target.value));
          }}
        />
      </div>
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
          {[...Array(22)].map((_, index) => (
            <li key={index}>
              <div></div>
              <div
                ref={(ref) => {
                  lightRefs.current[index] = ref;
                }}
                title={`${IPS[index]}`}
              ></div>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.blocks}>
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
      </div>
    </section>
  );
};

export default Map;
