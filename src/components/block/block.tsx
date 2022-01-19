import styles from "./block.module.scss";
import { ChangeEvent, useRef } from "react";
import { Block as BlockType, useSiteState } from "@/states/use-site-state";

export type Props = {
  values: BlockType;
  updateColor: (color: number[]) => void;
};

const Block = ({ values, updateColor }: Props) => {
  const refAlpha0 = useRef<HTMLDivElement>(null);
  const refAlpha1 = useRef<HTMLDivElement>(null);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const color = (e.target as HTMLInputElement).value;
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    updateColor([r, g, b]);
  };

  const color = `${values.color[0]}, ${values.color[1]}, ${values.color[2]}`;

  return (
    <div
      className={styles["container"]}
      style={{
        width: `calc(${(values.time[1] - values.time[0]) * 100}% - 0.6rem)`,
        left: `calc(${values.time[0] * 100}% + 0.3rem)`,
        background: `linear-gradient(90deg, rgba(${color}, ${values.alpha[0]}) 0%, rgba(${color}, ${values.alpha[1]}) 100%)`,
      }}
    >
      <input
        type="color"
        className={styles["color"]}
        onChange={onInputChange}
      />
      <div ref={refAlpha0} className={styles["alpha--0"]}></div>
      <div ref={refAlpha1} className={styles["alpha--1"]}></div>
    </div>
  );
};

export default Block;
