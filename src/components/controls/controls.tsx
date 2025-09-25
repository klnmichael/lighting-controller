"use client";

import { useRef, useState } from "react";
import type { Color } from "@/types/global";
import { sequences, order } from "@/lib/sequences";
import styles from "./controls.module.scss";

export interface MapProps {
  sequence?: string;
  shuffle: boolean;
  bpm: number;
  dimming: number;
  customColor: Color;
  colorShuffle: boolean;
  onSequence: (timestamp: number, sequence: string) => void;
  onCue: (timestamp: number) => void;
  onPause: () => void;
  onShuffle: (value: boolean) => void;
  onBpm: (bpm: number) => void;
  onDimming: (bpm: number) => void;
  onColor: (config: any) => void;
  onColorShuffle: (value: boolean) => void;
}

const Controls = ({
  sequence,
  shuffle,
  bpm,
  dimming,
  customColor,
  colorShuffle,
  onSequence,
  onCue,
  onPause,
  onShuffle,
  onBpm,
  onDimming,
  onColor,
  onColorShuffle,
}: MapProps) => {
  const resetTapTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tapTimes = useRef<number[]>([]);

  const onBpmTap = () => {
    const currentTime = Date.now();
    tapTimes.current.push(currentTime);
    if (tapTimes.current.length > 16) tapTimes.current.shift();
    if (tapTimes.current.length > 2) {
      let totalInterval = 0;
      for (let i = 1; i < tapTimes.current.length; i++) {
        totalInterval += tapTimes.current[i] - tapTimes.current[i - 1];
      }
      const averageInterval = totalInterval / (tapTimes.current.length - 1);
      const bpm = 60000 / averageInterval;
      onBpm(Math.round(bpm));
    }
    if (resetTapTimeout.current) clearTimeout(resetTapTimeout.current);
    resetTapTimeout.current = setTimeout(() => {
      tapTimes.current = [];
    }, 3000);
  };

  const rgbToHex = (rgb: Color) => {
    let hexR = rgb[0].toString(16);
    let hexG = rgb[1].toString(16);
    let hexB = rgb[2].toString(16);
    if (hexR.length === 1) hexR = "0" + hexR;
    if (hexG.length === 1) hexG = "0" + hexG;
    if (hexB.length === 1) hexB = "0" + hexB;
    return "#" + hexR + hexG + hexB;
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.group}>
          <button onClick={() => onCue(Date.now())}>Cue</button>
          <button
            onClick={() => {
              onShuffle(false);
              onPause();
            }}
          >
            Pause
          </button>
          <button
            className={styles.shuffle}
            data-active={shuffle}
            onClick={() => onShuffle(!shuffle)}
          >
            Shuffle
          </button>
        </div>
        <div className={styles.group}>
          <button className={styles.decrease} onClick={() => onBpm(bpm - 1)}>
            -
          </button>
          <input
            type="number"
            value={bpm}
            min={1}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onBpm(parseFloat(e.target.value) || 1)}
          />
          <button className={styles.increase} onClick={() => onBpm(bpm + 1)}>
            +
          </button>
          <button onClick={() => onBpmTap()}>Tap</button>
        </div>
        <div className={styles.group}>
          <input
            type="number"
            value={dimming}
            min={0}
            max={100}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onDimming(parseFloat(e.target.value))}
          />
          <input
            type="color"
            value={rgbToHex(customColor)}
            onChange={(e) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                e.target.value
              );
              if (result) {
                onColor([
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16),
                ]);
              }
            }}
          />
          <button
            className={styles.colorShuffle}
            data-active={colorShuffle}
            onClick={() => onColorShuffle(!colorShuffle)}
          >
            Color Shuffle
          </button>
        </div>
      </div>
      <ul className={styles.pad}>
        {order.map((name) => (
          <li key={name}>
            <button
              onClick={() => onSequence(Date.now(), name)}
              data-active={name === sequence}
            >
              {sequences[name].label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Controls;
