"use client";

import { useEffect, useRef } from "react";
import { COLOR_MODES, IPS, LIGHTS } from "@/lib/constants";
import {
  advanceLightingEngine,
  createLightingEngine,
} from "@/lib/lighting-loop";
import styles from "./pattern-preview.module.scss";

export interface PatternPreviewProps {
  kind: "sequence" | "accent";
  /** Sequence or accent key. */
  pattern: string;
  bpm: number;
  cueTimestamp: number;
}

// Unlit dots stay faintly visible so the room layout always reads.
const OFF_ALPHA = 0.12;

/**
 * Miniature room map that runs a sequence or accent on its own lighting
 * engine, in time
 * with the show's BPM and cue, with one dot per light at its map position.
 */
const PatternPreview = ({
  kind,
  pattern,
  bpm,
  cueTimestamp,
}: PatternPreviewProps) => {
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const engine = useRef<ReturnType<typeof createLightingEngine>>(undefined);
  engine.current ??= createLightingEngine();

  const { state } = engine.current;
  state.bpm = bpm;
  state.cueTimestamp = cueTimestamp;

  useEffect(() => {
    const { state } = engine.current!;
    if (kind === "sequence") {
      state.activeSequence = pattern;
      state.runningSequence = pattern;
    } else {
      state.activeAccent = pattern;
      state.runningAccent = pattern;
    }
    state.sequenceColorMode = COLOR_MODES[2];
    state.sequenceColor = [255, 255, 255];
    state.accentColorMode = COLOR_MODES[2];
    state.accentColor = [255, 255, 255];
    engine.current!.lastTickIndex = undefined;
  }, [kind, pattern]);

  useEffect(() => {
    const alphas = IPS.map(() => -1);
    let request = 0;
    const frame = () => {
      request = requestAnimationFrame(frame);
      const current = engine.current!;
      const time = Date.now();
      advanceLightingEngine(current, time);
      IPS.forEach((ip, index) => {
        const { brightness } = current.map.sample(ip, time);
        const alpha =
          Math.round((OFF_ALPHA + (1 - OFF_ALPHA) * brightness) * 100) / 100;
        if (alpha === alphas[index]) return;
        alphas[index] = alpha;
        dotRefs.current[index]?.style.setProperty("--alpha", `${alpha}`);
      });
    };
    frame();
    return () => cancelAnimationFrame(request);
  }, []);

  return (
    <span className={styles.container} aria-hidden="true">
      <span className={styles.room}>
        {LIGHTS.map((light, index) => (
          <span
            key={light.id}
            ref={(element) => {
              dotRefs.current[index] = element;
            }}
            className={styles.dot}
            style={{
              left: `${light.position[0]}%`,
              top: `${light.position[1]}%`,
            }}
          />
        ))}
      </span>
    </span>
  );
};

export default PatternPreview;
