"use client";

import Button from "../button";
import styles from "./settings.module.scss";

export interface SettingsProps {
  onClose?: () => void;
}

const Settings = ({ onClose }: SettingsProps) => {
  return (
    <section className={styles.container}>
      <Button className={styles.close} onPress={onClose}>
        CLOSE
      </Button>
    </section>
  );
};

export default Settings;
