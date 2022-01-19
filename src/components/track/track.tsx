import styles from "./track.module.scss";
import { Block as BlockType, useSiteState } from "@/states/use-site-state";
import Block from "@/components/block";

export type Props = {
  deviceIndex: number;
  index: number;
  blocks: BlockType[];
};

const Track = ({ deviceIndex, index: trackIndex, blocks }: Props) => {
  const { updateColor } = useSiteState();

  return (
    <div
      className={styles["container"]}
      onClick={(e) => {
        const div = e.currentTarget as HTMLDivElement;
        console.log((e.clientX - div.offsetLeft) / div.clientWidth);
      }}
    >
      {blocks.map((block, index) => (
        <Block
          key={index}
          values={block}
          updateColor={(color) =>
            updateColor(deviceIndex, trackIndex, index, color)
          }
        />
      ))}
    </div>
  );
};

export default Track;
