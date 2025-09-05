"use client";

import { useRef, useEffect } from "react";
import randomColor from "randomcolor";
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
    color?: [number, number, number];
    dimming?: number;
  }) => void;
}

const Sparkle = ({ active, bpm, onRun, updateLight }: SparkleProps) => {
  const activeLoop = useRef(active);
  const bpmLoop = useRef(125);
  const hashLoop = useRef("");

  const speed = useRef(2);
  const accents = useRef(4);
  const accentColor = useRef<[number, number, number]>([255, 255, 255]);
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
    const sparkle = () => {
      const accentIndex: number[] = [];
      if (accents.current) {
        for (let i = 0; i < accents.current; ++i) {
          accentIndex.push(Math.floor(Math.random() * IPS.length));
        }
      }
      let color = customColor.current;
      if (colorPattern.current === "beat-random-color") {
        color = randomColor({
          luminosity: "bright",
          format: "rgbArray",
        }) as unknown as [number, number, number];
      }
      IPS.forEach((_, index) => {
        if (colorPattern.current === "individual-random-color") {
          color = randomColor({
            luminosity: "bright",
            format: "rgbArray",
          }) as unknown as [number, number, number];
        }
        updateLight({
          index,
          color: accentIndex.includes(index) ? accentColor.current : color,
          dimming: accentIndex.includes(index)
            ? 100
            : Math.round(Math.random() * 50) + 50,
        });
        setTimeout(() => {
          if (!activeLoop.current || hash !== hashLoop.current) return;
          if (!accentIndex.includes(index)) {
            updateLight({
              index,
              dimming: accentIndex.includes(index)
                ? 100
                : Math.round(Math.random() * 100),
            });
          }
        }, (1000 * 60) / bpmLoop.current / speed.current);
      });
      setTimeout(() => {
        if (!activeLoop.current || hash !== hashLoop.current) return;
        sparkle();
      }, (((1000 * 60) / bpmLoop.current) * 2) / speed.current);
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
          defaultValue={2}
          min={1}
          style={{ width: "3.5rem" }}
          onChange={(e) => {
            speed.current = parseFloat(e.target.value);
          }}
        />{" "}
        x speed
      </div>
      <div>
        <input
          type="number"
          defaultValue={4}
          min={0}
          style={{ width: "3.5rem" }}
          onChange={(e) => {
            accents.current = parseFloat(e.target.value);
          }}
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
              accentColor.current = [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
              ];
            }
          }}
        />
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

export default Sparkle;
