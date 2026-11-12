"use client";

import { useRef, useEffect } from "react";
import styles from "./count.module.scss";

export interface MapProps {
  cueTimestamp: number;
  bpm: number;
  sequence?: string;
}

const Count = ({ cueTimestamp, bpm, sequence }: MapProps) => {
  const outputRef = useRef<HTMLDivElement>(null);

  const cueTimestampRef = useRef(cueTimestamp);
  const bpmRef = useRef(bpm);

  const activeSequence = useRef("");

  const currentBeat = useRef(-1);
  const currentTick = useRef(-1);

  const loopInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const loop = () => {
    const time = Date.now();
    const beat =
      ((time - cueTimestampRef.current) / (60000 / bpmRef.current)) % 16;
    const beatFloor = Math.floor(beat);
    const tick = (beat - beatFloor) * 4;
    const tickFloor = Math.floor(tick);
    if (currentBeat.current === beatFloor && currentTick.current === tickFloor)
      return;
    currentBeat.current = beatFloor;
    currentTick.current = tickFloor;

    if (outputRef.current)
      outputRef.current.innerHTML = `<span>${currentBeat.current + 1}</span>/<span>${currentTick.current + 1}</span>`;
  };

  const startLoop = () => {
    if (!loopInterval.current) {
      currentBeat.current = -1;
      currentTick.current = -1;
      loop();
      loopInterval.current = setInterval(loop, 1000 / 60);
    }
  };

  const stopLoop = () => {
    if (loopInterval.current) {
      clearInterval(loopInterval.current);
      loopInterval.current = undefined;
    }
  };

  useEffect(() => {
    cueTimestampRef.current = cueTimestamp;
  }, [cueTimestamp]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (sequence) {
      if (!activeSequence.current) {
        startLoop();
      }
    } else {
      stopLoop();
    }
  }, [sequence]);

  return (
    <section className={styles.container}>
      <div ref={outputRef} className={styles.output}>
        <span>1</span>/<span>1</span>
      </div>
    </section>
  );
};

export default Count;
