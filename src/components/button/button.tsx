"use client";

import { ButtonHTMLAttributes } from "react";
import styles from "./button.module.scss";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onPress?: () => void;
};

const Button = ({ onPress, ...props }: ButtonProps) => {
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
