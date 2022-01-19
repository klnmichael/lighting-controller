import styles from "./device.module.scss";
import { useCallback, useRef } from "react";
import { Device, useSiteState } from "@/states/use-site-state";
import { useRaf } from "@/hooks/use-raf";
import Track from "@/components/track";

export type Props = {
  index: number;
  device: Device;
};

const Device = ({ index: deviceIndex, device }: Props) => {
  const refBulb = useRef(null);
  const refBackgroundColor = useRef("rgb(0, 0, 0)");

  useRaf(
    useCallback(
      ({ progress }) => {
        const rgba = [0, 0, 0, 0];
        [...device.tracks].reverse().forEach((blocks) => {
          blocks.forEach((block) => {
            if (progress >= block.time[0] && progress < block.time[1]) {
              const alpha =
                block.alpha[0] +
                (block.alpha[1] - block.alpha[0]) *
                  ((progress - block.time[0]) /
                    (block.time[1] - block.time[0]));
              // alpha
              rgba[3] = 1 - (1 - alpha) * (1 - rgba[3]);
              // red
              rgba[0] = Math.round(
                (block.color[0] * alpha) / rgba[3] +
                  (rgba[0] * rgba[3] * (1 - alpha)) / rgba[3]
              );
              // green
              rgba[1] = Math.round(
                (block.color[1] * alpha) / rgba[3] +
                  (rgba[1] * rgba[3] * (1 - alpha)) / rgba[3]
              );
              // blue
              rgba[2] = Math.round(
                (block.color[2] * alpha) / rgba[3] +
                  (rgba[2] * rgba[3] * (1 - alpha)) / rgba[3]
              );
            }
          });
        });
        const backgroundColor = `rgb(${rgba[0] * rgba[3]}, ${
          rgba[1] * rgba[3]
        }, ${rgba[2] * rgba[3]})`;
        if (backgroundColor !== refBackgroundColor.current) {
          refBackgroundColor.current = backgroundColor;
          return true;
        }
        return false;
      },
      [device]
    ),
    useCallback(() => {
      if (!refBulb.current) return;
      (refBulb.current as HTMLDivElement).style.backgroundColor =
        refBackgroundColor.current;
    }, [])
  );

  return (
    <div className={styles["container"]}>
      <div className={styles["light"]}>
        <div ref={refBulb} className={styles["bulb"]}></div>
      </div>
      <div className={styles["tracks"]}>
        {device.tracks.map((blocks, index) => (
          <Track
            key={index}
            deviceIndex={deviceIndex}
            index={index}
            blocks={blocks}
          />
        ))}
      </div>
    </div>
  );
};

export default Device;
