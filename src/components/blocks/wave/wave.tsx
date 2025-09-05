"use client";

import { useRef, useEffect } from "react";
import randomColor from "randomcolor";
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
    color?: [number, number, number];
    dimming?: number;
  }) => void;
}

const Wave = ({ active, bpm, onRun, updateLight }: WaveProps) => {
  const activeLoop = useRef(active);
  const bpmLoop = useRef(125);
  const hashLoop = useRef("");

  const direction = useRef("alternate");
  const colorPattern = useRef("individual-random-color");
  const customColor = useRef<[number, number, number]>([255, 0, 255]);

  useEffect(() => {
    activeLoop.current = active;
  }, [active]);

  useEffect(() => {
    bpmLoop.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!active) return;
    const hash = (Math.random() + 1).toString(36).substring(7);
    hashLoop.current = hash;
    const wave = (iteration: number) => {
      let delay = 0;
      const rows: () => number[][] = () => {
        switch (direction.current) {
          case "door-window":
            return [...ROWS].reverse();
          case "alternate":
            return iteration % 2 ? [...ROWS] : [...ROWS].reverse();
          case "window-door":
          default:
            return [...ROWS];
        }
      };
      let color = customColor.current;
      if (colorPattern.current === "beat-random-color") {
        color = randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as [number, number, number];
        setTimeout(() => {
          if (!activeLoop.current || hash !== hashLoop.current) return;
          color = randomColor({
            luminosity: "bright",
            format: "rgbArray",
          }) as unknown as [number, number, number];
        }, (1000 * 60) / bpmLoop.current);
      }
      rows().forEach((row) => {
        setTimeout(() => {
          if (!activeLoop.current || hash !== hashLoop.current) return;
          if (colorPattern.current === "row-random-color") {
            color = randomColor({
              luminosity: "bright",
              format: "rgbArray",
            }) as unknown as [number, number, number];
          }
          row.forEach((index) => {
            if (colorPattern.current === "individual-random-color") {
              const individualColor = randomColor({
                luminosity: "bright",
                format: "rgbArray",
              }) as unknown as [number, number, number];
              updateLight({
                index,
                color: individualColor,
                dimming: 100,
              });
              setTimeout(() => {
                if (!activeLoop.current || hash !== hashLoop.current) return;
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
                if (!activeLoop.current || hash !== hashLoop.current) return;
                updateLight({
                  index,
                  color,
                  dimming: 0,
                });
              }, (1000 * 60) / bpmLoop.current / ((ROWS.length - 1) / 4));
            }
          });
        }, delay);
        delay += (1000 * 60) / bpmLoop.current / (ROWS.length - 1);
      });
      setTimeout(() => {
        if (!activeLoop.current || hash !== hashLoop.current) return;
        wave(iteration + 1);
      }, ((1000 * 60) / bpmLoop.current) * 2);
    };
    wave(Math.round(Math.random()));
  }, [active, updateLight]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Digit1":
          onRun(true);
          colorPattern.current = "individual-random-color";
          break;
        case "Digit2":
          onRun(true);
          colorPattern.current = "custom-color";
          break;
        case "Digit3":
          onRun(true);
          colorPattern.current = "beat-random-color";
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
          defaultValue="alternate"
          onChange={(e) => {
            direction.current = e.target.value;
          }}
        >
          <option value="alternate">alternate</option>
          <option value="window-door">window-door</option>
          <option value="door-window">door-window</option>
        </select>
      </div>
      <div>
        <select
          defaultValue="individual-random-color"
          onChange={(e) => {
            colorPattern.current = e.target.value;
          }}
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
              customColor.current = [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
              ];
            }
          }}
        />
      </div>
    </Block>
  );
};

export default Wave;
