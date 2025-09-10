"use client";

import { useState } from "react";
import Map from "@/components/map";
import Controls from "@/components/controls";

export default function Home() {
  const [bpm, setBpm] = useState(125);
  const [sequence, setSequence] = useState("");

  const updateBpm = (value: number) => {
    setBpm(value);
    fetch("http://192.168.50.150:3000/bpm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });
  };

  const startSequence = (name: string) => {
    setSequence(name);
    fetch("http://192.168.50.150:3000/sequence/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  };

  const updateSequence = (config: any) => {
    fetch("http://192.168.50.150:3000/sequence/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
  };

  const pauseSequences = () => {
    setSequence("");
    fetch("http://192.168.50.150:3000/sequence/pause", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  };

  return (
    <>
      <Map bpm={bpm} activeSequence={sequence} />
      <Controls
        bpm={bpm}
        activeSequence={sequence}
        onBpmChange={updateBpm}
        startSequence={startSequence}
        updateSequence={updateSequence}
        pauseSequences={pauseSequences}
      />
    </>
  );
}
