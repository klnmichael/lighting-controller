"use client";

import { useRef } from "react";
import styles from "./slider.module.scss";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

const Slider = ({ value, onChange }: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const brightness = value;

  const updateValue = (clientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const nextBrightness =
      Math.round(((rect.bottom - clientY) / rect.height) * 100) / 100;
    onChange(Math.min(1, Math.max(0, nextBrightness)));
  };

  return (
    <div
      ref={sliderRef}
      className={styles.container}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        updateValue(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          updateValue(e.clientY);
        }
      }}
    >
      <div
        className={styles.progress}
        style={{ transform: `scaleY(${brightness})` }}
      ></div>
      <div className={styles.value}>{Math.round(brightness * 100)}%</div>
    </div>
  );
};

export default Slider;
