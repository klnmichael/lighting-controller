"use client";

import { useRef, useEffect } from "react";
import randomColor from "randomcolor";
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
    color?: [number, number, number];
    dimming?: number;
  }) => void;
}

const Flash = ({ active, bpm, onRun, updateLight }: FlashProps) => {
  const activeLoop = useRef(active);
  const bpmLoop = useRef(125);
  const hashLoop = useRef("");

  const speed = useRef(2);
  const colorPattern = useRef("individual-random-color");
  const customColor = useRef<[number, number, number]>([255, 255, 255]);

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
    const flash = () => {
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
          color,
          dimming: 100,
        });
        setTimeout(() => {
          if (!activeLoop.current || hash !== hashLoop.current) return;
          updateLight({
            index,
            dimming: 0,
          });
        }, (1000 * 60) / bpmLoop.current / speed.current);
      });
      setTimeout(() => {
        if (!activeLoop.current || hash !== hashLoop.current) return;
        flash();
      }, (((1000 * 60) / bpmLoop.current) * 2) / speed.current);
    };
    flash();
  }, [active, updateLight]);

  useEffect(() => {
    const onDocumentKeydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Digit4":
          onRun(true);
          colorPattern.current = "individual-random-color";
          break;
        case "Digit5":
          onRun(true);
          colorPattern.current = "custom-color";
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
          defaultValue="#ffffff"
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

export default Flash;
