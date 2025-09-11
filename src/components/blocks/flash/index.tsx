"use client";

import { useRef, useState, useEffect } from "react";
import randomColor from "randomcolor";
import { Color } from "@/types/global";
import { IPS } from "@/lib/constants";
import Block from "../block";

export interface FlashProps {
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

const Flash = ({ active, bpm, onRun, updateLight }: FlashProps) => {
  const activeRef = useRef(active);
  const bpmRef = useRef(125);
  const hashRef = useRef("");

  const speedRef = useRef(2);
  const colorPatternRef = useRef("individual-random-color");
  const customColorRef = useRef<Color>([255, 255, 255]);

  const [speed, setSpeed] = useState(speedRef.current);
  const [colorPattern, setColorPattern] = useState(colorPatternRef.current);
  const [customColor, setCustomColor] = useState<Color>(customColorRef.current);

  useEffect(() => {
    activeRef.current = active;
    bpmRef.current = bpm;
    speedRef.current = speed;
    colorPatternRef.current = colorPattern;
    customColorRef.current = customColor;
  }, [active, bpm, speed, colorPattern, customColor]);

  useEffect(() => {
    if (!active) return;
    const hash = (Math.random() + 1).toString(36).substring(7);
    hashRef.current = hash;
    const flash = () => {
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
          color,
          dimming: 100,
        });
        setTimeout(() => {
          if (!activeRef.current || hash !== hashRef.current) return;
          updateLight({
            index,
            dimming: 0,
          });
        }, (1000 * 60) / bpmRef.current / speedRef.current);
      });
      setTimeout(() => {
        if (!activeRef.current || hash !== hashRef.current) return;
        flash();
      }, (((1000 * 60) / bpmRef.current) * 2) / speedRef.current);
    };
    flash();
  }, [active, updateLight]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Digit4":
          onRun(true);
          setColorPattern("individual-random-color");
          break;
        case "Digit5":
          onRun(true);
          setColorPattern("custom-color");
          break;
      }
    };
    document.addEventListener("keydown", onDocumentKeydown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeydown);
    };
  }, [onRun]);

  return (
    <Block title="Flash" active={active} onRun={onRun}>
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
          defaultValue="#ffffff"
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

export default Flash;
