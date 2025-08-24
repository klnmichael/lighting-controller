import styles from "./top-bar.module.scss";
import { useRef, useCallback, useEffect } from "react";
import { useSiteState } from "@/states/use-site-state";
import { useRaf } from "@/hooks/use-raf";

export type Props = {
  onSettingsClick?: () => void;
};

const TopBar = ({ onSettingsClick }: Props) => {
  const refCurrent = useRef(null);
  const refInnerHtml = useRef("1/1");

  const { playing, beats, bars, bpm, setBeats, setBars, setBpm } =
    useSiteState();

  const parseInput = (value: string) => {
    if (!value) return 0;
    return parseFloat(value);
  };

  const renderInnerHtml = (innerHtml: string) => {
    if (!refCurrent.current) return;
    (refCurrent.current as HTMLDivElement).innerHTML = innerHtml;
  };

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
      renderInnerHtml(refInnerHtml.current);
    }, [])
  );

  useEffect(() => {
    if (!playing) renderInnerHtml("1/1");
  }, [playing]);

  return (
    <div className={styles["container"]}>
      <div ref={refCurrent} className={styles["current"]}>
        {refInnerHtml.current}
      </div>
      <div className={styles["inputs"]}>
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
      <div className={styles["settings"]}>
        <button onClick={onSettingsClick}>Settings</button>
      </div>
    </div>
  );
};

export default TopBar;
