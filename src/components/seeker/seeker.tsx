import styles from "./seeker.module.scss";
import { useRef, useCallback, useEffect } from "react";
import { useRaf } from "@/hooks/use-raf";

const Seeker = () => {
  const refSeeker = useRef(null);
  const refTransform = useRef("translateX(0%)");

  useRaf(
    useCallback(({ progress }) => {
      const transform = `translateX(${progress * 100}%)`;
      if (transform !== refTransform.current) {
        refTransform.current = transform;
        return true;
      }
      return false;
    }, []),
    useCallback(() => {
      if (!refSeeker.current) return;
      (refSeeker.current as HTMLDivElement).style.transform =
        refTransform.current;
    }, [])
  );

  return <div ref={refSeeker} className={styles["container"]}></div>;
};
export default Seeker;
