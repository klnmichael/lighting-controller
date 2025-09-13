"use client";

import sequences, { order } from "@/lib/sequences";
import styles from "./controls.module.scss";
import LiveBpmTracker from "../../../bpm-detector/bpm-detector";

export interface MapProps {
  bpm?: number;
  activeSequence?: string;
  onBpmChange: (bpm: number) => void;
  startSequence: (sequence: string) => void;
  updateSequence: (config: any) => void;
  pauseSequences: () => void;
}

const Controls = ({
  bpm,
  activeSequence,
  onBpmChange,
  startSequence,
  updateSequence,
  pauseSequences,
}: MapProps) => {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <LiveBpmTracker/>
        <button onClick={() => pauseSequences()}>Pause</button>
        <div className={styles.bpm}>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(parseFloat(e.target.value))}
          />
          <button>Tap</button>
        </div>
        <input
          type="color"
          defaultValue="#ff00ff"
          onChange={(e) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
              e.target.value
            );
            if (result) {
              updateSequence({
                color: [
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16),
                ],
              });
            }
          }}
        />
      </div>
      <ul className={styles.pad}>
        {order.map((name) => (
          <li key={name}>
            <button
              onClick={() => startSequence(name)}
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
