"use client";

import { type ButtonHTMLAttributes, useRef } from "react";
import { createRealtimeBpmAnalyzer } from "realtime-bpm-analyzer";
import type { Color } from "@/types/global";
import { sequences, sequenceOrder } from "@/lib/sequences";
import { accents, accentOrder } from "@/lib/accents";
import {
  ACCENT_COLORS,
  ACTIVE_COLORS,
  COLOR_MODES,
  SEQUENCE_COLORS,
} from "@/lib/constants";
import { TOUCHPAD_SEQUENCES } from "@/lib/dualsense-touchpad";
import Count from "../count";
import styles from "./controls.module.scss";
import packageJson from "../../../package.json";
import type { useControllerLightbar } from "@/lib/use-controller-lightbar";

const PressButton = ({
  onPress,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { onPress: () => void }) => {
  return (
    <button
      type="button"
      {...props}
      // onMouseDown={() => {
      //   if (!props.disabled) onPress();
      // }}
      // onTouchStart={() => {
      //   if (!props.disabled) onPress();
      // }}
      onPointerDown={() => {
        if (!props.disabled) onPress();
      }}
    />
  );
};

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

const Slider = ({ value, onChange }: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const brightness = value;

  const updateValue = (clientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const nextBrightness =
      Math.round(((rect.bottom - clientY) / rect.height) * 100) / 100;
    onChange(Math.min(1, Math.max(0, nextBrightness)));
  };

  return (
    <div
      ref={sliderRef}
      className={styles.slider}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        updateValue(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          updateValue(e.clientY);
        }
      }}
    >
      <div
        className={styles.slider__progress}
        style={{ transform: `scaleY(${brightness})` }}
      ></div>
      <div className={styles.slider__value}>
        {Math.round(brightness * 100)}%
      </div>
    </div>
  );
};

export interface MapProps {
  hubUrl: string;
  cueTimestamp: number;
  bpm: number;
  sequence?: string;
  sequenceColorMode?: string;
  sequenceColor?: Color;
  sequenceDimming: number;
  accent?: string;
  accentColorMode?: string;
  accentColor?: Color;
  accentDimming: number;
  gamepadName: string;
  lightbar: ReturnType<typeof useControllerLightbar>;
  onHubUrlChange: (hubUrl: string) => void;
  onToggle: () => void;
  onOpenPreview: () => void;
  onCue: (timestamp: number) => void;
  onBpm: (bpm: number) => void;
  onBpmTap: () => void;
  onSequence: (timestamp: number, sequence: string) => void;
  onSequenceColorMode: (mode: string) => void;
  onSequenceColor: (color: Color) => void;
  onSequenceDimming: (dimming: number) => void;
  onAccent: (accent: string) => void;
  onAccentColorMode: (mode: string) => void;
  onAccentColor: (color: Color) => void;
  onAccentDimming: (dimming: number) => void;
}

const Controls = ({
  hubUrl,
  cueTimestamp,
  bpm,
  sequence,
  sequenceColorMode,
  sequenceColor,
  sequenceDimming,
  accent,
  accentColorMode,
  accentColor,
  accentDimming,
  gamepadName,
  lightbar,
  onHubUrlChange,
  onToggle,
  onOpenPreview,
  onCue,
  onBpm,
  onBpmTap,
  onSequence,
  onSequenceColorMode,
  onSequenceColor,
  onSequenceDimming,
  onAccent,
  onAccentColorMode,
  onAccentColor,
  onAccentDimming,
}: MapProps) => {
  const touchpadDialogRef = useRef<HTMLDialogElement>(null);

  const onBpmListen = async () => {
    const audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioSource = audioContext.createMediaStreamSource(stream);

    const analyzer = await createRealtimeBpmAnalyzer(audioContext);

    audioSource.connect(analyzer.node);

    analyzer.on("bpm", (data) => {
      if (data.bpm && data.bpm.length > 0) {
        const topCandidate = data.bpm[0];
        onBpm(topCandidate.tempo);
      }
    });
  };

  // const rgbToHex = (rgb: Color) => {
  //   let hexR = rgb[0].toString(16);
  //   let hexG = rgb[1].toString(16);
  //   let hexB = rgb[2].toString(16);
  //   if (hexR.length === 1) hexR = "0" + hexR;
  //   if (hexG.length === 1) hexG = "0" + hexG;
  //   if (hexB.length === 1) hexB = "0" + hexB;
  //   return "#" + hexR + hexG + hexB;
  // };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.group}>
          <PressButton onPress={onToggle}>I/O</PressButton>
          <PressButton onPress={() => onCue(Date.now())}>CUE</PressButton>
        </div>
        <div className={styles.temp}>
          <label className={styles.hubUrl}>
            v.{packageJson.version}
            <input
              type="url"
              value={hubUrl}
              placeholder="192.168.0.0:3000"
              onChange={(e) => onHubUrlChange(e.target.value)}
            />
          </label>
          <details className={styles.gamepad}>
            <summary>PS5 Controls</summary>
            <div>
              {gamepadName && <span>{gamepadName}</span>}
              <p>
                Cross: toggle output · Circle: cue · Square: random · Triangle:
                full
              </p>
              <p>L1/R1: effects · L2/R2: sequence brightness</p>
              <p>D-pad up/down: BPM · left: tap tempo</p>
              <p>
                Left stick: sequence color · Right stick: accent color. Colors
                run clockwise from up. Tilt to preview; center to apply. L3/R3:
                random sequence/accent colors.
              </p>
              <p>
                Touchpad (with sync): top row selects{" "}
                {TOUCHPAD_SEQUENCES.map((name) => sequences[name].title).join(
                  ", ",
                )}
                ; bottom row selects{" "}
                {accentOrder.map((name) => accents[name].title).join(", ")}.
                Touch and lift to select.
              </p>
              <p>
                Touchpad click: clear the active accent; cancels touch
                selection.
              </p>
              <button
                type="button"
                onClick={() => touchpadDialogRef.current?.showModal()}
              >
                Show touchpad map
              </button>
              <dialog
                ref={touchpadDialogRef}
                className={styles.touchpadDialog}
                aria-labelledby="touchpad-map-title"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    touchpadDialogRef.current?.close();
                  }
                }}
              >
                <div className={styles.touchpadDialog__header}>
                  <h2 id="touchpad-map-title">Touchpad map</h2>
                  <form method="dialog">
                    <button type="submit" autoFocus>
                      Close
                    </button>
                  </form>
                </div>
                <p>Touch and lift to select. Light bar sync is required.</p>
                <div className={styles.touchpadMap}>
                  <svg viewBox="0 0 600 250" aria-hidden="true">
                    <path
                      d="M12 12 Q300 2 588 12 L580 216 Q578 238 555 242 Q300 250 45 242 Q22 238 20 216 Z"
                      fill="#e2e4e8"
                      stroke="#858a94"
                      strokeWidth="3"
                    />
                    <rect
                      x="24"
                      y="24"
                      width="552"
                      height="200"
                      rx="12"
                      fill="#20242c"
                      stroke="#777e8a"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className={styles.touchpadMap__zones}>
                    <div
                      className={styles.touchpadMap__row}
                      aria-label="Sequences"
                    >
                      {TOUCHPAD_SEQUENCES.map((name) => (
                        <span key={name}>{sequences[name].title}</span>
                      ))}
                    </div>
                    <div
                      className={styles.touchpadMap__row}
                      aria-label="Accents"
                    >
                      {accentOrder.map((name) => (
                        <span key={name}>{accents[name].title}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p>Click the touchpad to clear the active accent.</p>
              </dialog>
              <p>
                Sync the DualSense light bar to the most common illuminated
                color. Requires Chrome/Edge on HTTPS or localhost and device
                permission.
              </p>
              <button
                type="button"
                disabled={
                  !lightbar.supported || lightbar.busy || lightbar.connected
                }
                onClick={lightbar.connect}
              >
                {lightbar.connected
                  ? "Light bar synced"
                  : lightbar.busy
                    ? "Connecting light bar..."
                    : "Sync light bar"}
              </button>
              {lightbar.error && <p role="alert">{lightbar.error}</p>}
            </div>
          </details>
        </div>
        <div className={styles.group}>
          <Count cueTimestamp={cueTimestamp} bpm={bpm} sequence={sequence} />
          <PressButton
            className={styles.decrease}
            onPress={() => onBpm(bpm - 1)}
          >
            -
          </PressButton>
          <input
            type="number"
            value={bpm}
            min={1}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onBpm(parseFloat(e.target.value) || 1)}
          />
          <PressButton
            className={styles.increase}
            onPress={() => onBpm(bpm + 1)}
          >
            +
          </PressButton>
          <PressButton onPress={onBpmTap}>TAP</PressButton>
          <PressButton className={styles.listen} onPress={onBpmListen}>
            LISTEN
          </PressButton>
          <button type="button" onClick={onOpenPreview}>
            3D
          </button>
        </div>
      </div>
      <div className={styles.pad}>
        <div className={styles.column}>
          <div className={styles.column__primary}>
            <PressButton
              onPress={() => onSequence(Date.now(), "random")}
              data-active={"random" === sequence}
            >
              Random
            </PressButton>
            <PressButton
              onPress={() => onSequence(Date.now(), "dark")}
              data-active={"dark" === sequence}
            >
              Dark
            </PressButton>
            <PressButton
              onPress={() => onSequence(Date.now(), "full")}
              data-active={"full" === sequence}
            >
              Full
            </PressButton>
            <PressButton
              onPress={() => onSequence(Date.now(), "flash")}
              data-active={"flash" === sequence}
            >
              Flash
            </PressButton>
            {sequenceOrder.map((name) => (
              <PressButton
                key={name}
                onPress={() => onSequence(Date.now(), name)}
                data-active={name === sequence}
              >
                {sequences[name].title}
              </PressButton>
            ))}
          </div>
          <div className={styles.column__secondary}>
            <PressButton
              title={COLOR_MODES[0]}
              style={{
                background: `linear-gradient(90deg,${ACTIVE_COLORS.map((color) => `rgb(${color.join(",")})`).join(",")})`,
              }}
              data-active={sequenceColorMode === COLOR_MODES[0]}
              onPress={() => onSequenceColorMode(COLOR_MODES[0])}
            />
            <PressButton
              title={COLOR_MODES[1]}
              style={{
                background: `linear-gradient(90deg,${ACTIVE_COLORS.map((color) => `rgb(${color.join(",")})`).join(",")})`,
              }}
              data-active={sequenceColorMode === COLOR_MODES[1]}
              onPress={() => onSequenceColorMode(COLOR_MODES[1])}
            />
            {SEQUENCE_COLORS.map((color, index) => (
              <PressButton
                key={index}
                title={`${color[0]}, ${color[1]}, ${color[2]}`}
                style={{
                  background: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                }}
                data-active={
                  sequenceColor &&
                  color[0] === sequenceColor[0] &&
                  color[1] === sequenceColor[1] &&
                  color[2] === sequenceColor[2] &&
                  sequenceColorMode === COLOR_MODES[2]
                }
                onPress={() => {
                  onSequenceColorMode(COLOR_MODES[2]);
                  onSequenceColor(color);
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.column}>
          <Slider value={sequenceDimming} onChange={onSequenceDimming} />
        </div>
        <div className={styles.column}>
          <div className={styles.column__primary}>
            <PressButton
              onPress={() => onAccent("random" === accent ? "" : "random")}
              data-active={"random" === accent}
            >
              Random
            </PressButton>
            {accentOrder.map((name) => (
              <PressButton
                key={name}
                onPress={() => onAccent(name === accent ? "" : name)}
                data-active={name === accent}
              >
                {accents[name].title}
              </PressButton>
            ))}
          </div>
          <div className={styles.column__secondary}>
            <PressButton
              title={COLOR_MODES[0]}
              style={{
                background: `linear-gradient(90deg,${ACTIVE_COLORS.map((color) => `rgb(${color.join(",")})`).join(",")})`,
              }}
              data-active={accentColorMode === COLOR_MODES[0]}
              onPress={() => onAccentColorMode(COLOR_MODES[0])}
            />
            {ACCENT_COLORS.map((color, index) => (
              <PressButton
                key={index}
                title={`${color[0]}, ${color[1]}, ${color[2]}`}
                style={{
                  background: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                }}
                data-active={
                  accentColor &&
                  color[0] === accentColor[0] &&
                  color[1] === accentColor[1] &&
                  color[2] === accentColor[2] &&
                  accentColorMode === COLOR_MODES[2]
                }
                onPress={() => {
                  onAccentColorMode(COLOR_MODES[2]);
                  onAccentColor(color);
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.column}>
          <Slider value={accentDimming} onChange={onAccentDimming} />
        </div>
      </div>
    </section>
  );
};

export default Controls;
