"use client";

import { useEffect, type Ref, type RefObject } from "react";
import RoomScene, { type RoomSceneHandle } from "@/components/room-scene";
import type { LightState } from "@/lib/lights";
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
      className={styles.preview}
      role="dialog"
      aria-label="3D lighting preview"
    >
      <button
        type="button"
        className={styles.preview__close}
        onClick={onClose}
        autoFocus
      >
        CLOSE
      </button>
      <RoomScene ref={ref} lights={lights} />
    </section>
  );
}
