import styles from "./top-bar.module.scss";
import { useRef, useCallback } from "react";
import { useSiteState } from "@/states/use-site-state";
import { useRaf } from "@/hooks/use-raf";

const TopBar = () => {
  const refCurrent = useRef(null);
  const refInnerHtml = useRef("0/0");

  const { beats, bars, bpm, setBeats, setBars, setBpm } = useSiteState();

  useRaf(
    useCallback(({ bar, beat }) => {
      const innerHTML = `${bar}/${beat}`;
      if (innerHTML !== refInnerHtml.current) {
        refInnerHtml.current = innerHTML;
        return true;
      }
      return false;
    }, []),
    useCallback(() => {
      if (!refCurrent.current) return;
      (refCurrent.current as HTMLDivElement).innerHTML = refInnerHtml.current;
    }, [])
  );

  const parseInput = (value: string) => {
    if (!value) return 0;
    return parseFloat(value);
  };

  return (
    <div className={styles["container"]}>
      <div ref={refCurrent} className={styles["current"]}>
        0/0
      </div>
      <div className={styles["input"]}>
        <label>
          <span>Beats</span>
          <input
            type="number"
            value={beats}
            onChange={(e) => setBeats(parseInput(e.target.value))}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      </div>
      <div className={styles["input"]}>
        <label>
          <span>Bars</span>
          <input
            type="number"
            value={bars}
            onChange={(e) => setBars(parseInput(e.target.value))}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      </div>
      <div className={styles["input"]}>
        <label>
          <span>BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInput(e.target.value))}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      </div>
    </div>
  );
};

export default TopBar;
