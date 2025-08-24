import styles from "./track.module.scss";
import { useRef } from "react";
import { useSiteState } from "@/states/use-site-state";
import Block from "@/components/block";

export type Props = {
  trackId: string;
  blockIds: string[];
};

const Track = ({ trackId, blockIds }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  const startX = useRef(0);

  const { bars, beats, addBlock } = useSiteState();

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
    const div = containerRef.current as HTMLDivElement;
    const width = div.clientWidth;
    const offset = (x - div.offsetLeft) / width;
    const barWidth = width / (bars * beats);
    const translate = Math.floor((width * offset) / barWidth) * barWidth;
    const progress = translate / width;
    return { width, barWidth, translate, progress };
  };

  return (
    <div
      ref={containerRef}
      className={styles["container"]}
      onClick={(e) => {
        if (!placeholderRef.current || e.target !== containerRef.current)
          return;
        const { width, barWidth, translate } = checkBar(e.clientX);
        addBlock(trackId, {
          time: [translate / width, (translate + barWidth) / width],
          color: [255, 255, 255],
          alpha: [1, 1],
        });
        placeholderRef.current.style.width = "0px";
        placeholderRef.current.style.transform = "none";
      }}
      onMouseDown={(e) => {
        startX.current = e.clientX;
        // const { width, barWidth, translate } = checkBar(startX.current);
        // addBlock(trackId, {
        //   time: [translate / width, (translate + barWidth) / width],
        //   color: [255, 255, 255],
        //   alpha: [1, 1],
        // });
      }}
      onMouseMove={(e) => {
        if (!placeholderRef.current) return;
        if (e.target === containerRef.current) {
          const { barWidth, translate } = checkBar(e.clientX);
          placeholderRef.current.style.width = `${barWidth}px`;
          placeholderRef.current.style.transform = `translateX(${translate}px)`;
        } else {
          placeholderRef.current.style.width = "0px";
          placeholderRef.current.style.transform = "none";
        }
      }}
      onMouseUp={(e) => {
        // if (startX.current) {
        //   const startData = checkBar(startX.current);
        //   const currentData = checkBar(e.clientX);
        //   addBlock(trackId, {
        //     time: [
        //       startData.translate / startData.width,
        //       currentData.translate / currentData.width,
        //     ],
        //     color: [255, 255, 255],
        //     alpha: [1, 1],
        //   });
        //   startX.current = 0;
        // }
      }}
      onMouseLeave={() => {
        if (!placeholderRef.current) return;
        placeholderRef.current.style.width = "0px";
        placeholderRef.current.style.transform = "none";
      }}
    >
      <div ref={placeholderRef} className={styles["placeholder"]}></div>
      {blockIds.map((blockId, index) => (
        <Block key={index} trackId={trackId} blockId={blockId} />
      ))}
    </div>
  );
};

export default Track;
