"use client";

import { ButtonHTMLAttributes } from "react";
import styles from "./button.module.scss";

export interface ButtonProps {}

const Button = ({
  onPress,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { onPress?: () => void }) => {
  return (
    <button
      type="button"
      {...props}
      className={`${styles.container}${props.className ? ` ${props.className}` : ""}`}
      onPointerDown={() => {
        if (onPress && !props.disabled) onPress();
      }}
    />
  );
};

export default Button;
