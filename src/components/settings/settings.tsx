import styles from "./settings.module.scss";

export type Props = {
  open?: boolean;
  onCloseClick?: () => void;
};

const Settings = ({ open, onCloseClick }: Props) => {
  return (
    <div className={styles["container"]} data-open={open}>
      <button className={styles["close"]} onClick={onCloseClick}>
        Close
      </button>
      <div className={styles["body"]}>
        <div className={styles["row"]}>
          <span>Bar mode:</span>
          <select>
            <option value="draw">Draw</option>
            <option value="place">Place</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
