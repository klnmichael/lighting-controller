import styles from "./seeker.module.scss";
import { useRef, useCallback, useEffect } from "react";
import { useSiteState } from "@/states/use-site-state";
import { useRaf } from "@/hooks/use-raf";

const Seeker = () => {
  const refSeeker = useRef(null);
  const refProgress = useRef(0);

  const { playing } = useSiteState();

  const renderTransform = (progress: number) => {
    if (!refSeeker.current) return;
    (
      refSeeker.current as HTMLDivElement
    ).style.transform = `translateX(${progress}%)`;
  };

  useRaf(
    useCallback(({ progress }) => {
      const updatedProgress = progress * 100;
      if (updatedProgress !== refProgress.current) {
        refProgress.current = updatedProgress;
        return true;
      }
      return false;
    }, []),
    useCallback(() => {
      renderTransform(refProgress.current);
    }, [])
  );

  useEffect(() => {
    if (!playing) renderTransform(0);
  }, [playing]);

  return <div ref={refSeeker} className={styles["container"]}></div>;
};
export default Seeker;
