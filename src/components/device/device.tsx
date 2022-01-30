import styles from "./device.module.scss";
import { useCallback, useRef, useEffect } from "react";
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

  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic>();
  const connectedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const colorRef = useRef("");

  const { tracks, removeDevice } = useSiteState();

  const rgbToHex = (r: any, g: any, b: any) => {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const readColor = () => {
    if (!refBulb.current) return;
    let rgba = window
      .getComputedStyle(refBulb.current)
      .getPropertyValue("background-color");
    rgba = rgba.replace("rgb(", "").replace("rgba(", "").replace(")", "");
    let c = rgba.split(", ").map((i) => parseInt(i, 10));
    return rgbToHex(c[0], c[1], c[2]);
  };

  const updateLight = (color: string) => {
    if (connectedRef.current && color !== colorRef.current) {
      const hex = `56${color}00f0aa`;
      let array = new Uint8Array(
        (hex.match(/[\da-f]{2}/gi) || []).map((h) => {
          return parseInt(h, 16);
        })
      );
      colorRef.current = color;
      characteristicRef.current?.writeValueWithoutResponse(array.buffer);
    }
  };

  const start = () => {
    intervalRef.current = setInterval(() => {
      const color = readColor();
      updateLight(color);
    }, 1000 / 28);
  };

  useEffect(() => {
    device.bluetoothDevice.gatt
      ?.connect()
      .then((server) => server.getPrimaryService(0xffe5))
      .then((service) => service.getCharacteristic(0xffe9))
      .then((characteristic) => {
        characteristicRef.current = characteristic;
        connectedRef.current = true;
        start();
      });

    return () => {
      clearInterval;
    };
  }, []);

  useRaf(
    useCallback(
      ({ progress }) => {
        const rgba = [0, 0, 0, 0];
        [...device.tracks].reverse().forEach((trackId) => {
          tracks[trackId]?.forEach((block) => {
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
      [device, tracks]
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
        <div
          ref={refBulb}
          className={styles["bulb"]}
          onClick={() => {
            removeDevice(deviceIndex);
          }}
        ></div>
      </div>
      <div className={styles["tracks"]}>
        {device.tracks.map((trackId, index) => {
          const blocks = tracks[trackId];
          return <Track key={index} id={trackId} blocks={blocks} />;
        })}
      </div>
    </div>
  );
};

export default Device;
