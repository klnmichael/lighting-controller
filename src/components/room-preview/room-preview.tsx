"use client";

import { useEffect, type Ref, type RefObject } from "react";
import type { LightState } from "@/lib/lights";
import Button from "@/components/button";
import RoomScene, { type RoomSceneHandle } from "@/components/room-scene";
import styles from "./room-preview.module.scss";

export default function RoomPreview({
  ref,
  lights,
  onClose,
}: {
  ref?: Ref<RoomSceneHandle>;
  lights: RefObject<LightState[]>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <section
      className={styles.container}
      role="dialog"
      aria-label="3D lighting preview"
    >
      <Button className={styles.close} autoFocus onPress={onClose}>
        CLOSE
      </Button>
      <RoomScene ref={ref} lights={lights} />
    </section>
  );
}
