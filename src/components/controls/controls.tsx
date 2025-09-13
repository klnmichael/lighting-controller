"use client";

import { useRef, useState } from "react";
import { sequences, order } from "@/lib/sequences";
import styles from "./controls.module.scss";

export interface MapProps {
  bpm: number;
  activeSequence?: string;
  onCue: () => void;
  onPause: () => void;
  onBpmChange: (bpm: number) => void;
  onStartSequence: (sequence: string) => void;
  onUpdateSequence: (config: any) => void;
  onClose: () => void;
}

const Controls = ({
  bpm,
  activeSequence,
  onCue,
  onPause,
  onBpmChange,
  onStartSequence,
  onUpdateSequence,
  onClose,
}: MapProps) => {
  const [shuffle, setShuffle] = useState(false);

  const resetTapTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tapTimes = useRef<number[]>([]);

  const onBpmTap = () => {
    const currentTime = new Date().getTime();
    tapTimes.current.push(currentTime);
    if (tapTimes.current.length > 10) tapTimes.current.shift();
    if (tapTimes.current.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < tapTimes.current.length; i++) {
        totalInterval += tapTimes.current[i] - tapTimes.current[i - 1];
      }
      const averageInterval = totalInterval / (tapTimes.current.length - 1);
      const bpm = 60000 / averageInterval;
      onBpmChange(Math.round(bpm));
    }
    if (resetTapTimeout.current) clearTimeout(resetTapTimeout.current);
    resetTapTimeout.current = setTimeout(() => {
      tapTimes.current = [];
    }, 2000);
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.core}>
          <button onClick={() => onCue()}>Cue</button>
          <button
            className={styles.shuffle}
            data-active={shuffle}
            onClick={() => setShuffle(!shuffle)}
          >
            Shuffle
          </button>
          <button
            onClick={() => {
              setShuffle(false);
              onPause();
            }}
          >
            Pause
          </button>
        </div>
        <div className={styles.bpm}>
          <button
            className={styles.decrease}
            onClick={() => onBpmChange(bpm - 1)}
          >
            -
          </button>
          <input
            type="number"
            value={bpm}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onBpmChange(parseFloat(e.target.value))}
          />
          <button
            className={styles.increase}
            onClick={() => onBpmChange(bpm + 1)}
          >
            +
          </button>
          <button onClick={() => onBpmTap()}>Tap</button>
        </div>
        <input
          type="color"
          defaultValue="#ff00ff"
          onChange={(e) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
              e.target.value
            );
            if (result) {
              onUpdateSequence({
                color: [
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16),
                ],
              });
            }
          }}
        />
        <button onClick={onClose}>Close</button>
      </div>
      <ul className={styles.pad}>
        {order.map((name) => (
          <li key={name}>
            <button
              onClick={() => onStartSequence(name)}
              data-active={name === activeSequence}
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
