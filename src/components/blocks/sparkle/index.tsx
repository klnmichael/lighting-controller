"use client";

import { useRef, useState, useEffect } from "react";
import randomColor from "randomcolor";
import { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import Block from "../block";

export interface SparkleProps {
  active: boolean;
  bpm: number;
  onRun: (state: boolean) => void;
  updateLight: ({
    index,
    color,
    dimming,
  }: {
    index: number;
    color?: Color;
    dimming?: number;
  }) => void;
}

const Sparkle = ({ active, bpm, onRun, updateLight }: SparkleProps) => {
  const activeRef = useRef(active);
  const bpmRef = useRef(125);
  const hashRef = useRef("");

  const speedRef = useRef(2);
  const accentsRef = useRef(4);
  const accentColorRef = useRef<Color>([255, 255, 255]);
  const colorPatternRef = useRef("beat-random-color");
  const customColorRef = useRef<Color>([255, 0, 255]);

  const [speed, setSpeed] = useState(speedRef.current);
  const [accents, setAccents] = useState(accentsRef.current);
  const [accentColor, setAccentColor] = useState<Color>(accentColorRef.current);
  const [colorPattern, setColorPattern] = useState(colorPatternRef.current);
  const [customColor, setCustomColor] = useState<Color>(customColorRef.current);

  useEffect(() => {
    activeRef.current = active;
    bpmRef.current = bpm;
    speedRef.current = speed;
    accentsRef.current = accents;
    accentColorRef.current = accentColor;
    colorPatternRef.current = colorPattern;
    customColorRef.current = customColor;
  }, [active, bpm, speed, accents, accentColor, colorPattern, customColor]);

  useEffect(() => {
    if (!active) return;
    const hash = (Math.random() + 1).toString(36).substring(7);
    hashRef.current = hash;
    const sparkle = () => {
      const accentIndex: number[] = [];
      if (accentsRef.current) {
        for (let i = 0; i < accentsRef.current; ++i) {
          accentIndex.push(Math.floor(Math.random() * IPS.length));
        }
      }
      let color = customColorRef.current;
      if (colorPatternRef.current === "beat-random-color") {
        color = randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color;
      }
      IPS.forEach((_, index) => {
        if (colorPatternRef.current === "individual-random-color") {
          color = randomColor({
            luminosity: "bright",
            format: "rgbArray",
          }) as unknown as Color;
        }
        updateLight({
          index,
          color: accentIndex.includes(index) ? accentColorRef.current : color,
          dimming: accentIndex.includes(index)
            ? 100
            : Math.round(Math.random() * 25) + 75,
        });
        setTimeout(() => {
          if (!activeRef.current || hash !== hashRef.current) return;
          if (!accentIndex.includes(index)) {
            updateLight({
              index,
              dimming: accentIndex.includes(index)
                ? 100
                : Math.round(Math.random() * 75) + 25,
            });
          }
        }, (1000 * 60) / bpmRef.current / speedRef.current);
      });
      setTimeout(() => {
        if (!activeRef.current || hash !== hashRef.current) return;
        sparkle();
      }, (((1000 * 60) / bpmRef.current) * 2) / speedRef.current);
    };
    sparkle();
  }, [active, updateLight]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Digit6":
          onRun(true);
          break;
      }
    };
    document.addEventListener("keydown", onDocumentKeydown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeydown);
    };
  }, [onRun]);

  return (
    <Block title="Sparkle" active={active} onRun={onRun}>
      <div>
        <input
          type="number"
          value={speed}
          min={0}
          style={{ width: "3.5rem" }}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />{" "}
        x speed
      </div>
      <div>
        <input
          type="number"
          value={accents}
          min={0}
          style={{ width: "3.5rem" }}
          onChange={(e) => setAccents(parseFloat(e.target.value))}
        />{" "}
        accents
      </div>
      <div>
        <input
          type="color"
          defaultValue="#ffffff"
          onChange={(e) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
              e.target.value
            );
            if (result) {
              setAccentColor([
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
              ]);
            }
          }}
        />
      </div>
      <div>
        <select
          value={colorPattern}
          onChange={(e) => setColorPattern(e.target.value)}
        >
          <option value="individual-random-color">
            individual-random-color
          </option>
          <option value="beat-random-color">beat-random-color</option>
          <option value="custom-color">custom-color</option>
        </select>
      </div>
      <div>
        <input
          type="color"
          defaultValue="#ff00ff"
          onChange={(e) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
              e.target.value
            );
            if (result) {
              setCustomColor([
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
              ]);
            }
          }}
        />
      </div>
    </Block>
  );
};

export default Sparkle;
