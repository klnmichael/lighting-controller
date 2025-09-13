"use client";

import { useEffect, useState } from "react";
import Map from "@/components/map";
import Controls from "@/components/controls";

export default function Home() {
  const [bpm, setBpm] = useState(125);
  const [sequence, setSequence] = useState("");
  const [controller, setController] = useState(false);

  const hubUrl = process.env.NEXT_PUBLIC_HUB_URL;

  const cue = () => {
    setSequence("");
    fetch(`${hubUrl}/cue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  };

  const pause = () => {
    setSequence("");
    fetch(`${hubUrl}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  };

  const updateBpm = (value: number) => {
    setBpm(value);
    fetch(`${hubUrl}/bpm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });
  };

  const startSequence = (name: string) => {
    setSequence(name);
    fetch(`${hubUrl}/sequence/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  };

  const updateSequence = (config: any) => {
    fetch(`${hubUrl}/sequence/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
  };

  useEffect(() => updateBpm(125), []);

  return (
    <>
      <Map
        bpm={bpm}
        activeSequence={sequence}
        onControllerClick={() => setController(true)}
      />
      {controller && (
        <Controls
          bpm={bpm}
          activeSequence={sequence}
          onCue={cue}
          onPause={pause}
          onBpmChange={updateBpm}
          onStartSequence={startSequence}
          onUpdateSequence={updateSequence}
          onClose={() => setController(false)}
        />
      )}
    </>
  );
}
