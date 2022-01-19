import styles from "./grid.module.scss";
import { useRef, useEffect, useCallback } from "react";
import { useSiteState } from "@/states/use-site-state";

const Grid = () => {
  const refCanvas = useRef(null);

  const { beats, bars } = useSiteState();

  const drawGrid = useCallback(() => {
    if (!refCanvas.current) return;
    const canvas = refCanvas.current as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const barWidth = width / bars;
    const beatWidth = barWidth / beats;

    canvas.width = width;
    canvas.height = height;
    context.lineWidth = 1;
    context.strokeStyle = "#fff";

    for (let i = 0; i < bars; ++i) {
      const barOffset = barWidth * i;
      context.globalAlpha = 0.125;
      context.beginPath();
      context.moveTo(barOffset, 0);
      context.lineTo(barOffset, height);
      context.stroke();
      context.globalAlpha = 0.05;
      for (let ii = 1; ii < beats; ++ii) {
        context.beginPath();
        context.moveTo(barOffset + beatWidth * ii, 0);
        context.lineTo(barOffset + beatWidth * ii, height);
        context.stroke();
      }
    }
  }, [beats, bars]);

  useEffect(() => {
    drawGrid();
  }, [beats, bars, drawGrid]);

  useEffect(() => {
    window.addEventListener("resize", drawGrid);

    return () => {
      window.removeEventListener("resize", drawGrid);
    };
  }, [drawGrid]);

  return (
    <div className={styles["container"]}>
      <canvas ref={refCanvas}></canvas>
    </div>
  );
};

export default Grid;
