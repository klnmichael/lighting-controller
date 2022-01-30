import styles from "./block.module.scss";
import { ChangeEvent, useRef, useEffect } from "react";
import { Block as BlockType, useSiteState } from "@/states/use-site-state";

export type Props = {
  trackId: string;
  index: number;
  values: BlockType;
};

const Block = ({ trackId, index, values }: Props) => {
  const containerRef = useRef(null);

  const timeStart = useRef<number | null>(null);
  const timeEnd = useRef<number | null>(null);
  const alphaStart = useRef<number | null>(null);
  const alphaEnd = useRef<number | null>(null);

  const { bars, beats, removeBlock, updateColor, updateTime, updateAlpha } =
    useSiteState();

  const checkBar = (
    x: number
  ): {
    width: number;
    barWidth: number;
    translate: number;
    progress: number;
  } => {
    if (!containerRef.current)
      return {
        width: 0,
        barWidth: 0,
        translate: 0,
        progress: 0,
      };
    const div = (containerRef.current as HTMLDivElement)
      .parentNode as HTMLDivElement;
    if (!div)
      return {
        width: 0,
        barWidth: 0,
        translate: 0,
        progress: 0,
      };
    const width = div.clientWidth;
    const offset = (x - div.offsetLeft) / width;
    const barWidth = width / (bars * beats);
    const translate = Math.floor((width * offset) / barWidth) * barWidth;
    const progress = translate / width;
    return { width, barWidth, translate, progress };
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const color = (e.target as HTMLInputElement).value;
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    updateColor(trackId, index, [r, g, b]);
  };

  const onWindowMouseMove = (e: MouseEvent) => {
    if (timeStart.current !== null) {
      const { progress } = checkBar(e.pageX);
      if (progress >= 0 && progress < values.time[1])
        updateTime(trackId, index, [progress, values.time[1]]);
    }
    if (timeEnd.current !== null) {
      const { width, barWidth, progress } = checkBar(e.pageX);
      const progressBuffer = progress + barWidth / width;
      if (progressBuffer <= 1 && progressBuffer > values.time[0])
        updateTime(trackId, index, [values.time[0], progressBuffer]);
    }
    if (alphaStart.current !== null) {
      let alpha = (alphaStart.current - e.pageY) / 70 + 0.5;
      if (alpha < 0) alpha = 0;
      if (alpha > 1) alpha = 1;
      updateAlpha(trackId, index, [alpha, values.alpha[1]]);
    }
    if (alphaEnd.current !== null) {
      let alpha = (alphaEnd.current - e.pageY) / 70 + 0.5;
      if (alpha < 0) alpha = 0;
      if (alpha > 1) alpha = 1;
      updateAlpha(trackId, index, [values.alpha[0], alpha]);
    }
  };

  const onWindowMouseUp = () => {
    timeStart.current = null;
    timeEnd.current = null;
    alphaStart.current = null;
    alphaEnd.current = null;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, []);

  const color = `${values.color[0]}, ${values.color[1]}, ${values.color[2]}`;

  return (
    <div
      ref={containerRef}
      className={styles["container"]}
      style={{
        width: `calc(${(values.time[1] - values.time[0]) * 100}% - 0.2rem)`,
        left: `calc(${values.time[0] * 100}% + 0.1rem)`,
        background: `linear-gradient(90deg, rgba(${color}, ${values.alpha[0]}) 0%, rgba(${color}, ${values.alpha[1]}) 100%)`,
      }}
    >
      <input
        type="color"
        className={styles["color"]}
        onChange={onInputChange}
      />
      <div className={styles["controls"]}>
        <div
          className={styles["time--0"]}
          onMouseDown={(e) => {
            timeStart.current = e.pageX;
          }}
        ></div>
        <div
          className={styles["alpha--0"]}
          onMouseDown={(e) => {
            alphaStart.current = e.pageY;
          }}
        ></div>
        <div
          className={styles["alpha--1"]}
          onMouseDown={(e) => {
            alphaEnd.current = e.pageY;
          }}
        ></div>
        <div
          className={styles["time--1"]}
          onMouseDown={(e) => {
            timeEnd.current = e.pageX;
          }}
        ></div>
        <button
          className={styles["remove"]}
          onClick={() => {
            removeBlock(trackId, index);
          }}
        >
          -
        </button>
      </div>
    </div>
  );
};

export default Block;
