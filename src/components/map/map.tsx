"use client";

import Image from "next/image";
import {
  useRef,
  useEffect,
  useImperativeHandle,
  useState,
  type Ref,
} from "react";
import type { Color } from "@/types/global";
import {
  ACCENT_COLORS,
  ACTIVE_COLORS,
  COLOR_MODES,
  IPS,
} from "@/lib/constants";
import { sequenceOrder, sequences } from "@/lib/sequences";
import { accentOrder, accents } from "@/lib/accents";
import { LIGHT_POSITIONS, ROOM_OUTLINE } from "@/lib/room-layout";
import {
  createPreviewLights,
  isPreviewMessage,
  type PreviewMessage,
} from "@/lib/preview";
import styles from "./map.module.scss";

export interface MapHandle {
  openPreview: () => void;
}

export interface MapProps {
  ref?: Ref<MapHandle>;
  cueTimestamp: number;
  bpm: number;
  sequence?: string;
  sequenceColorMode: string;
  sequenceColor: Color;
  sequenceDimming: number;
  accent?: string;
  accentColorMode: string;
  accentColor: Color;
  accentDimming: number;
}

const Map = ({
  ref,
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
}: MapProps) => {
  const cueTimestampRef = useRef(cueTimestamp);
  const bpmRef = useRef(bpm);

  const activeSequence = useRef("");
  const runningSequence = useRef("");
  const sequenceColorModeRef = useRef(sequenceColorMode);
  const sequenceColorRef = useRef(sequenceColor);
  const sequenceDimmingRef = useRef(sequenceDimming);

  const activeAccent = useRef("");
  const runningAccent = useRef("");
  const accentColorModeRef = useRef(accentColorMode);
  const accentColorRef = useRef(accentColor);
  const accentDimmingRef = useRef(accentDimming);

  const queueRef = useRef<{
    sequence?: string;
    sequenceColorMode?: string;
    sequenceColor?: Color;
    accent?: string;
    accentColorMode?: string;
    accentColor?: Color;
  }>({});

  const currentBeat = useRef(-1);
  const currentTick = useRef(-1);

  const loopInterval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const lights = useRef(createPreviewLights());
  const lightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previewWindow = useRef<Window | null>(null);
  const [popupError, setPopupError] = useState("");

  const sendPreview = () => {
    if (previewWindow.current && !previewWindow.current.closed) {
      previewWindow.current.postMessage(
        {
          type: "preview:state",
          lights: lights.current,
        } satisfies PreviewMessage,
        window.location.origin,
      );
    }
  };

  useImperativeHandle(ref, () => ({
    openPreview() {
      if (!previewWindow.current || previewWindow.current.closed) {
        previewWindow.current = window.open(
          "/3d",
          "lighting-controller-3d",
          "popup,width=1100,height=800,resizable=yes,scrollbars=yes",
        );
      }
      if (!previewWindow.current) {
        setPopupError(
          "The 3D preview popup was blocked. Allow popups for this site and try again.",
        );
        return;
      }
      setPopupError("");
      previewWindow.current.focus();
      sendPreview();
    },
  }));

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin === window.location.origin &&
        event.source === previewWindow.current &&
        isPreviewMessage(event.data) &&
        event.data.type === "preview:request"
      ) {
        sendPreview();
      }
    };
    const disconnect = () => {
      if (previewWindow.current && !previewWindow.current.closed) {
        previewWindow.current.postMessage(
          { type: "preview:disconnected" } satisfies PreviewMessage,
          window.location.origin,
        );
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("pagehide", disconnect);
    return () => {
      disconnect();
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", disconnect);
    };
  }, []);

  const updateLight = (
    ip: number,
    config: { color?: Color; dimming?: number },
  ) => {
    const light = lights.current[IPS.indexOf(ip)];
    if (config.color) light.color = config.color;
    if (config.dimming !== undefined) {
      light.brightness = (1 - config.dimming) * sequenceDimmingRef.current;
    }
    const element = lightRefs.current[IPS.indexOf(ip)];
    if (element) {
      element.style.backgroundColor = `rgb(${light.color.join(",")})`;
      element.style.opacity = `${light.brightness}`;
    }
  };

  const loop = () => {
    const time = Date.now();
    const beat =
      ((time - cueTimestampRef.current) / (60000 / bpmRef.current)) % 16;
    const beatFloor = Math.floor(beat);
    const tick = (beat - beatFloor) * 4;
    const tickFloor = Math.floor(tick);
    if (currentBeat.current === beatFloor && currentTick.current === tickFloor)
      return;
    currentBeat.current = beatFloor;
    currentTick.current = tickFloor;

    // console.log(`${currentBeat.current + 1}/${currentTick.current + 1}`);

    if (!(currentBeat.current % 4) && currentTick.current === 0) {
      if (queueRef.current.sequence) {
        activeSequence.current = queueRef.current.sequence;
        runningSequence.current = queueRef.current.sequence;
      }
      if (queueRef.current.sequenceColorMode)
        sequenceColorModeRef.current = queueRef.current.sequenceColorMode;
      if (queueRef.current.sequenceColor)
        sequenceColorRef.current = queueRef.current.sequenceColor;
      if (queueRef.current.accent || queueRef.current.accent === "") {
        activeAccent.current = queueRef.current.accent;
        runningAccent.current = queueRef.current.accent;
      }
      if (queueRef.current.accentColorMode)
        accentColorModeRef.current = queueRef.current.accentColorMode;
      if (queueRef.current.accentColor)
        accentColorRef.current = queueRef.current.accentColor;
      queueRef.current = {};
    }

    if (!(currentBeat.current % 4) && currentTick.current === 0) {
      if (activeSequence.current === "random") {
        const availableSequences = sequenceOrder.filter(
          (sequence) => sequence !== runningSequence.current,
        );
        runningSequence.current =
          availableSequences[
            Math.floor(Math.random() * availableSequences.length)
          ];
      }
      if (activeAccent.current === "random")
        runningAccent.current =
          accentOrder[Math.floor(Math.random() * accentOrder.length)];
    }

    if (!(currentBeat.current % 2) && currentTick.current === 0) {
      if (sequenceColorModeRef.current === COLOR_MODES[0]) {
        sequenceColorRef.current =
          ACTIVE_COLORS[Math.floor(Math.random() * ACTIVE_COLORS.length)];
      }
      if (accentColorModeRef.current === COLOR_MODES[0]) {
        accentColorRef.current =
          ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
      }
    }

    const lightMap: Record<number, { color?: Color; dimming?: number }> = {};

    const sequenceTimeline =
      sequences[runningSequence.current]?.timeline({
        beat: currentBeat.current,
        tick: currentTick.current,
      }) || [];
    const sequenceTimelineBeats = sequenceTimeline.length / 4;
    const sequenceTimelineData =
      sequenceTimeline[
        (currentBeat.current % sequenceTimelineBeats) * 4 + currentTick.current
      ];
    if (sequenceTimelineData) {
      if (
        sequenceColorModeRef.current === COLOR_MODES[1] &&
        !(currentTick.current % 2)
      ) {
        sequenceColorRef.current =
          ACTIVE_COLORS[Math.floor(Math.random() * ACTIVE_COLORS.length)];
      }
      sequenceTimelineData.forEach((data: any) => {
        [...(data.ips || IPS)].forEach((ip) => {
          lightMap[ip] = {};
          lightMap[ip].dimming = data.dimming;
          lightMap[ip].color = sequenceColorRef.current;
          if (data.randomDimming) {
            lightMap[ip].dimming =
              Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
              data.randomDimming[0];
          }
        });
      });
    }

    const accentTimeline =
      accents[runningAccent.current]?.timeline({
        beat: currentBeat.current,
        tick: currentTick.current,
      }) || [];
    const accentTimelineBeats = accentTimeline.length / 4;
    const accentTimelineData =
      accentTimeline[
        (currentBeat.current % accentTimelineBeats) * 4 + currentTick.current
      ];
    if (accentTimelineData) {
      accentTimelineData.forEach((data: any) => {
        data.ips.forEach((ip: number) => {
          if (!lightMap[ip]) lightMap[ip] = {};
          lightMap[ip].dimming = data.dimming;
          lightMap[ip].color = accentColorRef.current;
        });
      });
    }

    for (const [ip, params] of Object.entries(lightMap)) {
      updateLight(parseInt(ip), params);
    }
    sendPreview();
  };

  const startLoop = () => {
    if (!loopInterval.current) {
      currentBeat.current = -1;
      currentTick.current = -1;
      loop();
      loopInterval.current = setInterval(loop, 1000 / 60);
    }
  };

  const stopLoop = () => {
    if (loopInterval.current) {
      clearInterval(loopInterval.current);
      loopInterval.current = undefined;
    }
  };

  useEffect(() => {
    cueTimestampRef.current = cueTimestamp;
  }, [cueTimestamp]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (sequenceColorMode)
      queueRef.current.sequenceColorMode = sequenceColorMode;
    if (sequenceColor) queueRef.current.sequenceColor = sequenceColor;
    if (accent || accent === "") queueRef.current.accent = accent;
    if (accentColorMode) queueRef.current.accentColorMode = accentColorMode;
    if (accentColor) queueRef.current.accentColor = accentColor;
  }, [sequenceColorMode, sequenceColor, accent, accentColorMode, accentColor]);

  useEffect(() => {
    if (sequence) {
      if (activeSequence.current) {
        queueRef.current.sequence = sequence;
      } else {
        activeSequence.current = sequence;
        runningSequence.current = sequence;
      }
      startLoop();
    } else {
      stopLoop();
      activeSequence.current = "";
      runningSequence.current = "";
    }
  }, [sequence]);

  useEffect(() => {
    sequenceDimmingRef.current = sequenceDimming;
  }, [sequenceDimming]);

  useEffect(() => {
    accentDimmingRef.current = accentDimming;
  }, [accentDimming]);

  return (
    <section className={styles.container} aria-label="2D lighting map">
      <div className={styles.layout}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 523 671"
          fill="none"
        >
          <polygon
            points={ROOM_OUTLINE.map(([x, y]) => `${x} ${y}`).join(" ")}
          />
        </svg>
        <div className={styles.plan}>
          <Image
            src="/map-plan.png"
            alt=""
            fill
            sizes="78svh"
            loading="eager"
          />
        </div>
        <ol className={styles.lights}>
          {IPS.map((ip, index) => (
            <li
              key={ip}
              data-index={index}
              style={{
                left: `${LIGHT_POSITIONS[index][0]}%`,
                top: `${LIGHT_POSITIONS[index][1]}%`,
              }}
            >
              <div />
              <div
                ref={(element) => {
                  lightRefs.current[index] = element;
                }}
                title={`#${index} ${ip}`}
                data-index={index}
              />
            </li>
          ))}
        </ol>
      </div>
      {popupError && (
        <p className={styles.error} role="alert">
          {popupError}
        </p>
      )}
    </section>
  );
};

export default Map;
