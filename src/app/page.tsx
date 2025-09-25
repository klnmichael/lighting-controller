"use client";

import { useState } from "react";
import type { Color } from "@/types/global";
import Map from "@/components/map";
import Controls from "@/components/controls";

export default function Home() {
  const [shuffle, setShuffle] = useState(false);
  const [cueTimestamp, setCueTimestamp] = useState(0);
  const [bpm, setBpm] = useState(125);
  const [dimming, setDimming] = useState(100);
  const [customColor, setCustomColor] = useState<Color>([255, 0, 255]);
  const [colorShuffle, setColorShuffle] = useState(false);
  const [sequence, setSequence] = useState("");

  const hubUrl = process.env.NEXT_PUBLIC_HUB_URL;

  const onSequence = (timestamp: number, name: string) => {
    if (!cueTimestamp) setCueTimestamp(timestamp);
    setSequence(name);
    if (hubUrl)
      fetch(`${hubUrl}/sequence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timestamp, name }),
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

  const onShuffle = (value: boolean) => {
    setShuffle(value);
  };

  const onPause = () => {
    setSequence("");
    if (hubUrl)
      fetch(`${hubUrl}/pause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
  };

  const onBpm = (value: number) => {
    setBpm(value);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bpm: value }),
      });
  };

  const onDimming = (value: number) => {
    setDimming(value);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dimming: value }),
      });
  };

  const onColor = (value: Color) => {
    setCustomColor(value);
    if (hubUrl)
      fetch(`${hubUrl}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ color: value }),
      });
  };

  const onColorShuffle = (value: boolean) => {
    setColorShuffle(value);
  };

  return (
    <>
      <Map
        sequence={sequence}
        cueTimestamp={cueTimestamp}
        shuffle={shuffle}
        bpm={bpm}
        dimming={dimming}
        customColor={customColor}
        colorShuffle={colorShuffle}
      />
      <Controls
        sequence={sequence}
        shuffle={shuffle}
        bpm={bpm}
        dimming={dimming}
        customColor={customColor}
        colorShuffle={colorShuffle}
        onSequence={onSequence}
        onCue={onCue}
        onPause={onPause}
        onShuffle={onShuffle}
        onBpm={onBpm}
        onDimming={onDimming}
        onColor={onColor}
        onColorShuffle={onColorShuffle}
      />
    </>
  );
}
