"use client";

import Image from "next/image";
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

const getColorWheelGradient = (colors: Color[]) => {
  const segmentSize = 360 / colors.length;
  const stops = colors.flatMap((color, index) => {
    const colorValue = `rgb(${color.join(",")})`;
    return [
      `${colorValue} ${index * segmentSize}deg`,
      `${colorValue} ${(index + 1) * segmentSize}deg`,
    ];
  });
  return `conic-gradient(from ${-segmentSize / 2}deg, ${stops.join(", ")})`;
};

const CONTROLLER_MAP_LABELS = [
  {
    text: "L1 Prev",
    title: "L1: previous sequence",
    left: "27.7%",
    top: "5.7%",
  },
  {
    text: "L2 Color",
    title: "Hold L2: use the joysticks to select sequence and accent colors",
    left: "20%",
    top: "5%",
  },
  {
    text: "BPM+",
    title: "D-pad up: increase BPM",
    left: "19%",
    top: "21.2%",
  },
  { text: "Tap", title: "D-pad left: tap tempo", left: "14.8%", top: "28.5%" },
  {
    text: "BPM-",
    title: "D-pad down: decrease BPM",
    left: "19%",
    top: "36.7%",
  },
  { text: "I/O", title: "Cross: toggle output", left: "80.5%", top: "39.8%" },
  {
    text: "Random",
    title: "Square: random sequence and accent",
    left: "72.8%",
    top: "28.5%",
  },
  { text: "Cue", title: "Circle: cue", left: "87.4%", top: "28.5%" },
  {
    text: "Dark",
    title: "Triangle: select the Dark sequence",
    left: "79.9%",
    top: "18.1%",
  },
  { text: "R1 Next", title: "R1: next sequence", left: "73.7%", top: "5.7%" },
  {
    text: "R2 Bright",
    title: "Hold R2: left stick adjusts sequence brightness; right stick adjusts accent brightness",
    left: "80%",
    top: "5%",
  },
  {
    text: "Seq / L3 rand",
    title: "Left stick: sequence color; L3: random sequence color",
    left: "21%",
    top: "49.1%",
  },
  {
    text: "Accent / R3 rand",
    title: "Right stick: accent color; R3: random accent color",
    left: "80%",
    top: "49.1%",
  },
] as const;

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
  const controllerDialogRef = useRef<HTMLDialogElement>(null);

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
            <summary>{gamepadName ? gamepadName : "PS5 Controller"}</summary>
            <div>
              <p>
                Cross: toggle output · Circle: cue · Square: random sequence and
                accent · Triangle: dark
              </p>
              <p>
                L1/R1: previous/next sequence · Hold L2: joystick color picker
                · Hold R2: joystick brightness adjustment
              </p>
              <p>D-pad up/down: BPM up/down · left: tap tempo</p>
              <p>
                While holding L2, left stick selects sequence color and right
                stick selects accent color. Colors run clockwise from up; tilt
                to preview and center to apply. While holding R2, move the left
                stick up/down for sequence brightness and the right stick
                up/down for accent brightness. L3/R3: random sequence/accent
                colors.
              </p>
              <p>
                Touchpad (with sync): top row selects{" "}
                {TOUCHPAD_SEQUENCES.map((name) => sequences[name].title).join(
                  ", ",
                )}
                ; bottom row selects{" "}
                {accentOrder.map((name) => accents[name].title).join(", ")}.
                Touch and lift to select; click to clear the active accent.
              </p>
              <button
                type="button"
                onClick={() => controllerDialogRef.current?.showModal()}
              >
                Show controller map
              </button>
              <dialog
                ref={controllerDialogRef}
                className={styles.controllerDialog}
                aria-labelledby="controller-map-title"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    controllerDialogRef.current?.close();
                  }
                }}
              >
                <div className={styles.controllerDialog__header}>
                  <h2 id="controller-map-title">PS5 controller map</h2>
                  <form method="dialog">
                    <button type="submit" autoFocus>
                      Close
                    </button>
                  </form>
                </div>
                <div className={styles.controllerMap}>
                  <Image
                    src="/ps5-controller.png"
                    alt="Front view of a PS5 DualSense controller"
                    fill
                    sizes="(max-width: 72rem) 100vw, 70rem"
                  />
                  <span
                    className={styles.controllerMap__colorWheel}
                    role="img"
                    aria-label="Sequence colors, clockwise from white at the top"
                    title="Sequence colors: clockwise from white at the top"
                    style={{
                      left: "34.2%",
                      top: "49.1%",
                      background: getColorWheelGradient(SEQUENCE_COLORS),
                    }}
                  />
                  <span
                    className={styles.controllerMap__colorWheel}
                    role="img"
                    aria-label="Accent colors, clockwise from white at the top"
                    title="Accent colors: clockwise from white at the top"
                    style={{
                      left: "65.6%",
                      top: "49.1%",
                      background: getColorWheelGradient(ACCENT_COLORS),
                    }}
                  />
                  {CONTROLLER_MAP_LABELS.map((label) => (
                    <span
                      key={label.title}
                      className={styles.controllerMap__label}
                      title={label.title}
                      style={{ left: label.left, top: label.top }}
                    >
                      {label.text}
                    </span>
                  ))}
                  <div
                    className={styles.controllerMap__touchpad}
                    role="group"
                    aria-label="Touchpad zones"
                  >
                    <div
                      className={styles.controllerMap__touchpadRow}
                      role="group"
                      aria-label="Top row: sequences"
                    >
                      {TOUCHPAD_SEQUENCES.map((name) => {
                        const title = sequences[name].title;
                        return (
                          <span key={name} title={`Select ${title}`}>
                            {title.replace(/^Wave /, "")}
                          </span>
                        );
                      })}
                    </div>
                    <div
                      className={styles.controllerMap__touchpadRow}
                      role="group"
                      aria-label="Bottom row: accents"
                    >
                      {accentOrder.map((name) => (
                        <span
                          key={name}
                          title={`Select ${accents[name].title}`}
                        >
                          {accents[name].title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p>
                  Touch and lift on the touchpad to select a sequence or accent.
                  Click the touchpad to clear the active accent.
                </p>
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
