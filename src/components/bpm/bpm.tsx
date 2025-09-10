"use client";

// import { analyze } from "web-audio-beat-detector";
import styles from "./bpm.module.scss";

export interface BpmProps {
  value?: number;
  onChange?: (value: number) => void;
}

const Bpm = ({ value, onChange }: BpmProps) => {
  return (
    <div className={styles.container}>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          if (onChange) onChange(parseFloat(e.target.value));
        }}
      />
      <button
        onClick={async () => {
          console.log("analyze");
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          console.log(stream);
        }}
      >
        analyze
      </button>
    </div>
  );
};

export default Bpm;
