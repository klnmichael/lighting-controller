"use client";

import { useRef, useState, useEffect } from "react";
import randomColor from "randomcolor";
import { Color } from "@/types/global";
import { ROWS } from "@/lib/constants";
import Block from "../block";

export interface WaveProps {
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

const Wave = ({ active, bpm, onRun, updateLight }: WaveProps) => {
  const activeRef = useRef(active);
  const bpmRef = useRef(125);
  const hashRef = useRef("");

  const directionRef = useRef("alternate");
  const colorPatternRef = useRef("individual-random-color");
  const customColorRef = useRef<Color>([255, 0, 255]);

  const [direction, setDirection] = useState(directionRef.current);
  const [colorPattern, setColorPattern] = useState(colorPatternRef.current);
  const [customColor, setCustomColor] = useState<Color>(customColorRef.current);

  useEffect(() => {
    activeRef.current = active;
    bpmRef.current = bpm;
    directionRef.current = direction;
    colorPatternRef.current = colorPattern;
    customColorRef.current = customColor;
  }, [active, bpm, direction, colorPattern, customColor]);

  useEffect(() => {
    if (!active) return;
    const hash = (Math.random() + 1).toString(36).substring(7);
    hashRef.current = hash;
    const wave = (iteration: number) => {
      let delay = 0;
      const rows: () => number[][] = () => {
        switch (directionRef.current) {
          case "door-window":
            return [...ROWS].reverse();
          case "alternate":
            return iteration % 2 ? [...ROWS] : [...ROWS].reverse();
          case "window-door":
          default:
            return [...ROWS];
        }
      };
      let color = customColorRef.current;
      if (colorPatternRef.current === "beat-random-color") {
        color = randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as Color;
        setTimeout(() => {
          if (!activeRef.current || hash !== hashRef.current) return;
          color = randomColor({
            luminosity: "bright",
            format: "rgbArray",
          }) as unknown as Color;
        }, (1000 * 60) / bpmRef.current);
      }
      rows().forEach((row) => {
        setTimeout(() => {
          if (!activeRef.current || hash !== hashRef.current) return;
          if (colorPatternRef.current === "row-random-color") {
            color = randomColor({
              luminosity: "bright",
              format: "rgbArray",
            }) as unknown as Color;
          }
          row.forEach((index) => {
            if (colorPatternRef.current === "individual-random-color") {
              const individualColor = randomColor({
                luminosity: "bright",
                format: "rgbArray",
              }) as unknown as Color;
              updateLight({
                index,
                color: individualColor,
                dimming: 100,
              });
              setTimeout(() => {
                if (!activeRef.current || hash !== hashRef.current) return;
                updateLight({
                  index,
                  color: individualColor,
                  dimming: 0,
                });
              }, 250);
            } else {
              updateLight({
                index,
                color,
                dimming: 100,
              });
              setTimeout(() => {
                if (!activeRef.current || hash !== hashRef.current) return;
                updateLight({
                  index,
                  color,
                  dimming: 0,
                });
              }, (1000 * 60) / bpmRef.current / ((ROWS.length - 1) / 4));
            }
          });
        }, delay);
        delay += (1000 * 60) / bpmRef.current / (ROWS.length - 1);
      });
      setTimeout(() => {
        if (!activeRef.current || hash !== hashRef.current) return;
        wave(iteration + 1);
      }, ((1000 * 60) / bpmRef.current) * 2);
    };
    wave(Math.round(Math.random()));
  }, [active, updateLight]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Digit1":
          onRun(true);
          setColorPattern("individual-random-color");
          break;
        case "Digit2":
          onRun(true);
          setColorPattern("beat-random-color");
          break;
        case "Digit3":
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
    <Block title="Wave" active={active} onRun={onRun}>
      <div>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="alternate">alternate</option>
          <option value="window-door">window-door</option>
          <option value="door-window">door-window</option>
        </select>
      </div>
      <div>
        <select
          value={colorPattern}
          onChange={(e) => setColorPattern(e.target.value)}
        >
          <option value="individual-random-color">
            individual-random-color
          </option>
          <option value="row-random-color">row-random-color</option>
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

export default Wave;
