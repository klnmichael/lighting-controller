"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Color } from "@/types/global";
import {
  ACCENT_COLORS,
  COLOR_MODES,
  HUB_URL_STORAGE_KEY,
  SEQUENCE_COLORS,
} from "@/lib/constants";
import Map from "@/components/map";
import RoomPreview from "@/components/room-preview";
import type { RoomSceneHandle } from "@/components/room-scene";
import { createLights, type LightState } from "@/lib/lights";
import { sequenceOrder } from "@/lib/sequences";
import Controls from "@/components/controls";
import Settings from "@/components/settings";
import { useControllerLightbar } from "@/lib/use-controller-lightbar";
import { JoystickColorSelection } from "@/lib/joystick-color";
import { TapTempo } from "@/lib/tap-tempo";
import { useHub } from "@/lib/use-hub";
import { useApinator } from "@/lib/use-apinator";
import type { HubSnapshot } from "@/lib/hub-protocol";
import {
  createLightingLoopState,
  getActiveLighting,
} from "@/lib/lighting-loop";

const GAMEPAD_SEQUENCES = ["random", "dark", "full", "flash", ...sequenceOrder];

export default function Home() {
  const lights = useRef(createLights());
  const sceneRef = useRef<RoomSceneHandle>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const on3D = () => {
    if (previewOpen) return;
    previewTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPreviewOpen(true);
  };

  const onClose = useCallback(() => {
    previewTrigger.current?.focus();
    setPreviewOpen(false);
  }, []);

  const onLightsChange = useCallback((nextLights: LightState[]) => {
    lights.current = nextLights;
    sceneRef.current?.invalidate();
  }, []);

  const [settings, setSettings] = useState(false);

  const [cueTimestamp, setCueTimestamp] = useState(0);
  const [seedShift, setSeedShift] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [sequence, setSequence] = useState("");
  const [sequenceColorMode, setSequenceColorMode] = useState(COLOR_MODES[0]);
  const [sequenceColor, setSequenceColor] = useState<Color>([255, 255, 255]);
  const [sequenceDimming, setSequenceDimming] = useState(1);
  const [accent, setAccent] = useState("");
  const [accentColorMode, setAccentColorMode] = useState(COLOR_MODES[0]);
  const [accentColor, setAccentColor] = useState<Color>([255, 255, 255]);
  const [accentDimming, setAccentDimming] = useState(1);
  const [activeLighting, setActiveLighting] = useState(() =>
    getActiveLighting(createLightingLoopState()),
  );

  const [hubUrl, setHubUrl] = useState("");
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [remotePassword, setRemotePassword] = useState("");
  const [hubSnapshot, setHubSnapshot] = useState<HubSnapshot | null>(null);
  const [gamepadName, setGamepadName] = useState("");
  const gamepadNameRef = useRef("");
  const previousButtons = useRef<boolean[]>([]);
  const tapTempo = useRef(new TapTempo());

  const onHubUrlChange = (url: string) => {
    setHubUrl(url);
    setHubSnapshot(null);
    window.localStorage.setItem(HUB_URL_STORAGE_KEY, url);
  };

  const onHubSnapshot = useCallback((snapshot: HubSnapshot) => {
    const state = snapshot.lighting;
    setHubSnapshot(snapshot);
    setCueTimestamp(state.cueTimestamp);
    setSeedShift(state.seedShift);
    setBpm(state.bpm);
    setSequence(state.queue.sequence ?? state.activeSequence);
    setSequenceColorMode(state.queue.sequenceColorMode ?? state.sequenceColorMode);
    setSequenceColor(state.queue.sequenceColor ?? state.sequenceColor);
    setSequenceDimming(state.sequenceDimming);
    setAccent(state.queue.accent ?? state.activeAccent);
    setAccentColorMode(state.queue.accentColorMode ?? state.accentColorMode);
    setAccentColor(state.queue.accentColor ?? state.accentColor);
    setAccentDimming(state.accentDimming);
  }, []);
  const localHub = useHub(remoteEnabled ? "" : hubUrl, onHubSnapshot);
  const remoteHub = useApinator(remoteEnabled, remotePassword, onHubSnapshot);
  const hub = remoteEnabled ? remoteHub : localHub;
  const hubConfigured = remoteEnabled || Boolean(hubUrl);

  const onToggle = () => {
    if (hubConfigured && !hub.send({ type: "toggle" })) return;
    setSequence("");
    setCueTimestamp(0);
  };

  const onCue = (timestamp: number) => {
    const seedShift = Math.round(Math.random() * 999);
    if (hubConfigured && !hub.send({ type: "cue", seedShift })) return;
    setCueTimestamp(timestamp);
    setSeedShift(seedShift);
  };

  const onBpm = (bpm: number) => {
    if (hubConfigured && !hub.send({ type: "bpm", bpm })) return;
    setBpm(bpm);
  };

  const onBpmTap = () => {
    const tappedBpm = tapTempo.current.tap();
    if (tappedBpm !== null) onBpm(tappedBpm);
  };

  const onSequence = (timestamp: number, sequence: string) => {
    if (hubConfigured && !hub.send({ type: "sequence", sequence })) return;
    if (!cueTimestamp) setCueTimestamp(timestamp);
    setSequence(sequence);
  };

  const onSequenceColorMode = (sequenceColorMode: string) => {
    if (hubConfigured && !hub.send({ type: "sequenceColorMode", value: sequenceColorMode })) return;
    setSequenceColorMode(sequenceColorMode);
  };

  const onSequenceColor = (sequenceColor: Color) => {
    if (hubConfigured && !hub.send({ type: "sequenceColor", value: sequenceColor })) return;
    setSequenceColor(sequenceColor);
  };

  const onSequenceDimming = (sequenceDimming: number) => {
    if (hubConfigured && !hub.send({ type: "sequenceDimming", value: sequenceDimming })) return;
    setSequenceDimming(sequenceDimming);
  };

  const onAccent = (accent: string) => {
    if (hubConfigured && !hub.send({ type: "accent", value: accent })) return;
    setAccent(accent);
  };

  const onAccentColorMode = (accentColorMode: string) => {
    if (hubConfigured && !hub.send({ type: "accentColorMode", value: accentColorMode })) return;
    setAccentColorMode(accentColorMode);
  };

  const onAccentColor = (accentColor: Color) => {
    if (hubConfigured && !hub.send({ type: "accentColor", value: accentColor })) return;
    setAccentColor(accentColor);
  };

  const lightbar = useControllerLightbar(
    lights,
    (name) => onSequence(Date.now(), name),
    onAccent,
  );

  const onAccentDimming = (accentDimming: number) => {
    if (hubConfigured && !hub.send({ type: "accentDimming", value: accentDimming })) return;
    setAccentDimming(accentDimming);
  };

  const gamepadActions = useRef({
    onToggle,
    onCue,
    onSequence,
    onSequenceColorMode,
    onSequenceColor,
    onAccentColorMode,
    onAccentColor,
    onAccent,
    onJoystickPreview: lightbar.onJoystickPreview,
    onLightbarSuppressed: lightbar.onLightbarSuppressed,
    onBpm,
    onBpmTap,
    onSequenceDimming,
    onAccentDimming,
    sequence,
    bpm,
    sequenceDimming,
    accentDimming,
  });
  gamepadActions.current = {
    onToggle,
    onCue,
    onSequence,
    onSequenceColorMode,
    onSequenceColor,
    onAccentColorMode,
    onAccentColor,
    onAccent,
    onJoystickPreview: lightbar.onJoystickPreview,
    onLightbarSuppressed: lightbar.onLightbarSuppressed,
    onBpm,
    onBpmTap,
    onSequenceDimming,
    onAccentDimming,
    sequence,
    bpm,
    sequenceDimming,
    accentDimming,
  };

  useEffect(() => {
    let frameId = 0;
    let leftStick = new JoystickColorSelection(SEQUENCE_COLORS);
    let rightStick = new JoystickColorSelection(ACCENT_COLORS);
    let controllerKey = "";
    let colorPickerEnabled = false;
    let lightbarSuppressed = false;
    let previousFrameTimestamp = 0;
    let brightnessUpdateElapsed = 0;
    const pollGamepad = (timestamp: number) => {
      const deltaSeconds =
        previousFrameTimestamp === 0
          ? 0
          : Math.min((timestamp - previousFrameTimestamp) / 1000, 0.05);
      previousFrameTimestamp = timestamp;
      const gamepad = Array.from(navigator.getGamepads()).find(
        (candidate) => candidate?.connected && candidate.mapping === "standard",
      );
      const nextKey = gamepad ? `${gamepad.index}:${gamepad.id}` : "";
      if (nextKey !== controllerKey) {
        controllerKey = nextKey;
        leftStick = new JoystickColorSelection(SEQUENCE_COLORS);
        rightStick = new JoystickColorSelection(ACCENT_COLORS);
        colorPickerEnabled = false;
        lightbarSuppressed = false;
        previousButtons.current = [];
        gamepadActions.current.onJoystickPreview(null);
        gamepadActions.current.onLightbarSuppressed(false);
      }

      const nextName = gamepad?.id ?? "";
      if (nextName !== gamepadNameRef.current) {
        gamepadNameRef.current = nextName;
        setGamepadName(nextName);
      }

      if (!gamepad) {
        previousButtons.current = [];
        if (lightbarSuppressed) {
          lightbarSuppressed = false;
          gamepadActions.current.onLightbarSuppressed(false);
        }
      } else {
        const pressed = gamepad.buttons.map((button) => button.pressed);
        const wasPressed = previousButtons.current;
        const actions = gamepadActions.current;

        const justPressed = (index: number) =>
          pressed[index] && !wasPressed[index];

        const colorPickerActive = Boolean(pressed[6]);
        const brightnessActive = Boolean(pressed[7] && !pressed[6]);
        const suppressLightbar = Boolean(pressed[6] || pressed[7]);
        if (suppressLightbar !== lightbarSuppressed) {
          lightbarSuppressed = suppressLightbar;
          actions.onLightbarSuppressed(suppressLightbar);
        }
        if (colorPickerActive !== colorPickerEnabled) {
          colorPickerEnabled = colorPickerActive;
          leftStick = new JoystickColorSelection(SEQUENCE_COLORS);
          rightStick = new JoystickColorSelection(ACCENT_COLORS);
          if (!colorPickerActive) actions.onJoystickPreview(null);
        }

        if (justPressed(0)) actions.onToggle();
        if (justPressed(1)) actions.onCue(Date.now());
        if (justPressed(2)) {
          actions.onSequence(Date.now(), "random");
          actions.onAccent("random");
        }
        if (justPressed(3)) actions.onSequence(Date.now(), "dark");
        if (justPressed(17)) actions.onAccent("");
        if (justPressed(10)) actions.onSequenceColorMode(COLOR_MODES[0]);
        if (justPressed(11)) actions.onAccentColorMode(COLOR_MODES[0]);

        const leftX = gamepad.axes[0] ?? 0;
        const leftY = gamepad.axes[1] ?? 0;
        const rightX = gamepad.axes[2] ?? 0;
        const rightY = gamepad.axes[3] ?? 0;
        if (colorPickerActive) {
          const left = leftStick.update(
            leftX,
            leftY,
            Boolean(pressed[10] || pressed[17]),
          );
          const right = rightStick.update(rightX, rightY, Boolean(pressed[11]));
          actions.onJoystickPreview(right.preview ?? left.preview);
          if (left.selected) {
            actions.onSequenceColorMode(COLOR_MODES[2]);
            actions.onSequenceColor(left.selected);
          }
          if (right.selected) {
            actions.onAccentColorMode(COLOR_MODES[2]);
            actions.onAccentColor(right.selected);
          }
        }

        const isAdjustingBrightness =
          brightnessActive &&
          (Math.abs(leftY) > 0.15 || Math.abs(rightY) > 0.15);
        if (isAdjustingBrightness) {
          brightnessUpdateElapsed += deltaSeconds;
        } else {
          brightnessUpdateElapsed = 0;
        }
        if (isAdjustingBrightness && brightnessUpdateElapsed >= 0.08) {
          const brightnessDelta = (axis: number) =>
            Math.abs(axis) > 0.15 ? -axis * brightnessUpdateElapsed * 0.6 : 0;
          const sequenceDelta = brightnessDelta(leftY);
          const accentDelta = brightnessDelta(rightY);
          brightnessUpdateElapsed = 0;
          if (sequenceDelta !== 0) {
            const nextDimming = Math.min(
              1,
              Math.max(0, actions.sequenceDimming + sequenceDelta),
            );
            if (nextDimming !== actions.sequenceDimming) {
              actions.onSequenceDimming(nextDimming);
            }
          }
          if (accentDelta !== 0) {
            const nextDimming = Math.min(
              1,
              Math.max(0, actions.accentDimming + accentDelta),
            );
            if (nextDimming !== actions.accentDimming) {
              actions.onAccentDimming(nextDimming);
            }
          }
        }

        const changeSequence = (direction: number) => {
          const currentIndex = GAMEPAD_SEQUENCES.indexOf(actions.sequence);
          const nextIndex =
            currentIndex === -1
              ? direction > 0
                ? 0
                : GAMEPAD_SEQUENCES.length - 1
              : (currentIndex + direction + GAMEPAD_SEQUENCES.length) %
                GAMEPAD_SEQUENCES.length;
          actions.onSequence(Date.now(), GAMEPAD_SEQUENCES[nextIndex]);
        };
        if (justPressed(4)) changeSequence(-1);
        if (justPressed(5)) changeSequence(1);
        if (justPressed(12)) actions.onBpm(actions.bpm + 1);
        if (justPressed(13)) actions.onBpm(Math.max(1, actions.bpm - 1));
        if (justPressed(14)) actions.onBpmTap();
        if (justPressed(15)) {
        }

        previousButtons.current = pressed;
      }

      frameId = requestAnimationFrame(pollGamepad);
    };

    frameId = requestAnimationFrame(pollGamepad);
    return () => {
      cancelAnimationFrame(frameId);
      gamepadActions.current.onJoystickPreview(null);
      gamepadActions.current.onLightbarSuppressed(false);
    };
  }, []);

  useEffect(() => {
    const storedHubUrl = window.localStorage.getItem(HUB_URL_STORAGE_KEY);
    if (storedHubUrl) setHubUrl(storedHubUrl);
  }, []);

  return (
    <>
      <Map
        cueTimestamp={cueTimestamp}
        seedShift={seedShift}
        bpm={bpm}
        sequence={sequence}
        sequenceColorMode={sequenceColorMode}
        sequenceColor={sequenceColor}
        sequenceDimming={sequenceDimming}
        accent={accent}
        accentColorMode={accentColorMode}
        accentColor={accentColor}
        accentDimming={accentDimming}
        hubSnapshot={hubConfigured ? hubSnapshot : null}
        clockOffset={hub.clockOffset}
        onLightsChange={onLightsChange}
        onActiveLightingChange={setActiveLighting}
      />
      <Controls
        activeLighting={activeLighting}
        hubUrl={hubUrl}
        remoteEnabled={remoteEnabled}
        remotePassword={remotePassword}
        hubStatus={hub.status}
        hubConnectionState={hub.connectionState}
        cueTimestamp={cueTimestamp}
        bpm={bpm}
        sequence={sequence}
        sequenceColorMode={sequenceColorMode}
        sequenceColor={sequenceColor}
        sequenceDimming={sequenceDimming}
        accent={accent}
        accentColorMode={accentColorMode}
        accentColor={accentColor}
        accentDimming={accentDimming}
        gamepadName={gamepadName}
        lightbar={lightbar}
        onHubUrlChange={onHubUrlChange}
        onRemoteEnabledChange={(enabled) => {
          setHubSnapshot(null);
          setRemoteEnabled(enabled);
        }}
        onRemotePasswordChange={(password) => {
          setHubSnapshot(null);
          setRemotePassword(password);
        }}
        onToggle={onToggle}
        onCue={onCue}
        onBpm={onBpm}
        onBpmTap={onBpmTap}
        on3D={on3D}
        onSettings={() => setSettings(true)}
        onSequence={onSequence}
        onSequenceColorMode={onSequenceColorMode}
        onSequenceColor={onSequenceColor}
        onSequenceDimming={onSequenceDimming}
        onAccent={onAccent}
        onAccentColorMode={onAccentColorMode}
        onAccentColor={onAccentColor}
        onAccentDimming={onAccentDimming}
      />
      {previewOpen && (
        <RoomPreview ref={sceneRef} lights={lights} onClose={onClose} />
      )}
      {settings && <Settings onClose={() => setSettings(false)} />}
    </>
  );
}
