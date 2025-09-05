"use client";

import { ReactNode } from "react";
import styles from "./block.module.scss";

export interface BlockProps {
  title: string;
  active: boolean;
  onRun: (state: boolean) => void;
  children: ReactNode;
}

const Block = ({ title, active, onRun, children }: BlockProps) => {
  // const [currentSettings, setCurrentSettings] = useState({});

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <button onClick={() => onRun(!active)}>
          {active ? "Pause" : "Run"}
        </button>
      </div>
      <div className={styles.settings}>{children}</div>
    </div>
  );
};

export default Block;
