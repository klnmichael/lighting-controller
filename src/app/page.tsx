"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Color } from "@/types/global";
import { COLOR_MODES } from "@/lib/constants";
import Map from "@/components/map";
import RoomPreview from "@/components/room-preview";
import type { RoomSceneHandle } from "@/components/room-scene";
import { createLights, type LightState } from "@/lib/lights";
import { sequenceOrder } from "@/lib/sequences";
import Controls from "@/components/controls";
import Settings from "@/components/settings";
import { useControllerLightbar } from "@/lib/use-controller-lightbar";
import { JoystickColorSelection } from "@/lib/joystick-color";

const GAMEPAD_SEQUENCES = ["random", "dark", "full", "flash", ...sequenceOrder];

export default function Home() {
  const lights = useRef(createLights());
  const sceneRef = useRef<RoomSceneHandle>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const onOpenPreview = () => {
    if (previewOpen) return;
    previewTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPreviewOpen(true);
  };
  const onClosePreview = useCallback(() => {
    previewTrigger.current?.focus();
    setPreviewOpen(false);
  }, []);
  const onLightsChange = useCallback((nextLights: LightState[]) => {
    lights.current = nextLights;
    sceneRef.current?.invalidate();
  }, []);
  const [cueTimestamp, setCueTimestamp] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [sequence, setSequence] = useState("");
  const [sequenceColorMode, setSequenceColorMode] = useState(COLOR_MODES[0]);
  const [sequenceColor, setSequenceColor] = useState<Color>([255, 255, 255]);
  const [sequenceDimming, setSequenceDimming] = useState(1);
  const [accent, setAccent] = useState("");
  const [accentColorMode, setAccentColorMode] = useState(COLOR_MODES[0]);
  const [accentColor, setAccentColor] = useState<Color>([255, 255, 255]);
  const [accentDimming, setAccentDimming] = useState(1);

  const [hubUrl, setHubUrl] = useState(process.env.NEXT_PUBLIC_HUB_URL ?? "");
  const [gamepadName, setGamepadName] = useState("");
  const gamepadNameRef = useRef("");
  const previousButtons = useRef<boolean[]>([]);

  const fetchServerSettings = async () => {
    if (hubUrl) {
      const settings: any = await fetch(`${hubUrl}/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      setCueTimestamp(settings.cueTimestamp);
      setBpm(settings.bpm);
      setSequence(settings.sequence);
      setSequenceColorMode(settings.sequenceColorMode);
      setSequenceColor(settings.sequenceColor);
      setSequenceDimming(settings.sequenceDimming);
      setAccent(settings.accent);
      setAccentColorMode(settings.accentColorMode);
      setAccentColor(settings.accentColor);
      setAccentDimming(settings.accentDimming);
    }
  };

  const onToggle = () => {
    setSequence("");
    if (hubUrl)
      fetch(`${hubUrl}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
  };

  const onCue = (timestamp: number) => {
    setCueTimestamp(timestamp);
    if (hubUrl)
      fetch(`${hubUrl}/cue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timestamp }),
      });
  };

  const onBpm = (bpm: number) => {
    setBpm(bpm);
    if (hubUrl)
      fetch(`${hubUrl}/bpm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bpm }),
      });
  };

  const onSequence = (timestamp: number, sequence: string) => {
    if (!cueTimestamp) setCueTimestamp(timestamp);
    setSequence(sequence);
    if (hubUrl)
      fetch(`${hubUrl}/sequence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timestamp, sequence }),
      });
  };

  const onSequenceColorMode = (sequenceColorMode: string) => {
    setSequenceColorMode(sequenceColorMode);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequenceColorMode }),
      });
  };

  const onSequenceColor = (sequenceColor: Color) => {
    setSequenceColor(sequenceColor);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequenceColor }),
      });
  };

  const onSequenceDimming = (sequenceDimming: number) => {
    setSequenceDimming(sequenceDimming);
    if (hubUrl)
      fetch(`${hubUrl}/dimming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequenceDimming }),
      });
  };

  const onAccent = (accent: string) => {
    setAccent(accent);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accent }),
      });
  };

  const onAccentColorMode = (accentColorMode: string) => {
    setAccentColorMode(accentColorMode);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accentColorMode }),
      });
  };

  const onAccentColor = (accentColor: Color) => {
    setAccentColor(accentColor);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accentColor }),
      });
  };

  const lightbar = useControllerLightbar(
    lights,
    (name) => onSequence(Date.now(), name),
    onAccent,
  );

  const onAccentDimming = (accentDimming: number) => {
    setAccentDimming(accentDimming);
    if (hubUrl)
      fetch(`${hubUrl}/dimming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accentDimming }),
      });
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
    onBpm,
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
    onBpm,
    onSequenceDimming,
    onAccentDimming,
    sequence,
    bpm,
    sequenceDimming,
    accentDimming,
  };

  useEffect(() => {
    let frameId = 0;
    let leftStick = new JoystickColorSelection();
    let rightStick = new JoystickColorSelection();
    let controllerKey = "";
    const pollGamepad = () => {
      const gamepad = Array.from(navigator.getGamepads()).find(
        (candidate) => candidate?.connected && candidate.mapping === "standard",
      );
      const nextKey = gamepad ? `${gamepad.index}:${gamepad.id}` : "";
      if (nextKey !== controllerKey) {
        controllerKey = nextKey;
        leftStick = new JoystickColorSelection();
        rightStick = new JoystickColorSelection();
        previousButtons.current = [];
        gamepadActions.current.onJoystickPreview(null);
      }

      const nextName = gamepad?.id ?? "";
      if (nextName !== gamepadNameRef.current) {
        gamepadNameRef.current = nextName;
        setGamepadName(nextName);
      }

      if (!gamepad) {
        previousButtons.current = [];
      } else {
        const pressed = gamepad.buttons.map((button) => button.pressed);
        const wasPressed = previousButtons.current;
        const actions = gamepadActions.current;

        const justPressed = (index: number) =>
          pressed[index] && !wasPressed[index];

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

        const left = leftStick.update(
          gamepad.axes[0] ?? 0,
          gamepad.axes[1] ?? 0,
          Boolean(pressed[10] || pressed[17]),
        );
        const right = rightStick.update(
          gamepad.axes[2] ?? 0,
          gamepad.axes[3] ?? 0,
          Boolean(pressed[11]),
        );
        actions.onJoystickPreview(right.preview ?? left.preview);
        if (left.selected) {
          actions.onSequenceColorMode(COLOR_MODES[2]);
          actions.onSequenceColor(left.selected);
        }
        if (right.selected) {
          actions.onAccentColorMode(COLOR_MODES[2]);
          actions.onAccentColor(right.selected);
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
        if (justPressed(6)) {
          actions.onSequenceDimming(
            Math.max(0, actions.sequenceDimming - 0.05),
          );
        }
        if (justPressed(7)) {
          actions.onSequenceDimming(
            Math.min(1, actions.sequenceDimming + 0.05),
          );
        }
        if (justPressed(12)) actions.onBpm(actions.bpm + 1);
        if (justPressed(13)) actions.onBpm(Math.max(1, actions.bpm - 1));
        // if (justPressed(14)) {
        //   actions.onAccentDimming(Math.max(0, actions.accentDimming - 0.05));
        // }
        // if (justPressed(15)) {
        //   actions.onAccentDimming(Math.min(1, actions.accentDimming + 0.05));
        // }

        previousButtons.current = pressed;
      }

      frameId = requestAnimationFrame(pollGamepad);
    };

    frameId = requestAnimationFrame(pollGamepad);
    return () => {
      cancelAnimationFrame(frameId);
      gamepadActions.current.onJoystickPreview(null);
    };
  }, []);

  useEffect(() => {
    fetchServerSettings();
  }, []);

  return (
    <>
      <Map
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
        onLightsChange={onLightsChange}
      />
      <Controls
        hubUrl={hubUrl}
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
        onHubUrlChange={setHubUrl}
        onToggle={onToggle}
        onOpenPreview={onOpenPreview}
        onCue={onCue}
        onBpm={onBpm}
        onSequence={onSequence}
        onSequenceColorMode={onSequenceColorMode}
        onSequenceColor={onSequenceColor}
        onSequenceDimming={onSequenceDimming}
        onAccent={onAccent}
        onAccentColorMode={onAccentColorMode}
        onAccentColor={onAccentColor}
        onAccentDimming={onAccentDimming}
      />
      <Settings />
      {previewOpen && (
        <RoomPreview ref={sceneRef} lights={lights} onClose={onClosePreview} />
      )}
    </>
  );
}
