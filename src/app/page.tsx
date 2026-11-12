"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Color } from "@/types/global";
import { COLOR_MODES } from "@/lib/constants";
import Map from "@/components/map";
import RoomPreview from "@/components/room-preview";
import type { RoomSceneHandle } from "@/components/room-scene";
import { createLights, type LightState } from "@/lib/lights";
import Controls from "@/components/controls";
import Settings from "@/components/settings";

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
  const [seed, setSeed] = useState(0);
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

  useEffect(() => {
    fetchServerSettings();
  }, []);

  return (
    <>
      <Map
        onLightsChange={onLightsChange}
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
