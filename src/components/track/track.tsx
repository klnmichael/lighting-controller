import styles from "./track.module.scss";
import { useRef } from "react";
import { Block as BlockType, useSiteState } from "@/states/use-site-state";
import Block from "@/components/block";

export type Props = {
  id: string;
  blocks: BlockType[];
};

const Track = ({ id, blocks }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

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
        addBlock(id, {
          time: [translate / width, (translate + barWidth) / width],
          color: [255, 255, 255],
          alpha: [1, 1],
        });
        placeholderRef.current.style.width = "0px";
        placeholderRef.current.style.transform = "none";
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
      onMouseLeave={() => {
        if (!placeholderRef.current) return;
        placeholderRef.current.style.width = "0px";
        placeholderRef.current.style.transform = "none";
      }}
    >
      <div ref={placeholderRef} className={styles["placeholder"]}></div>
      {blocks.map((block, index) => (
        <Block key={index} trackId={id} index={index} values={block} />
      ))}
    </div>
  );
};

export default Track;
