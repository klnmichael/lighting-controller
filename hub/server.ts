import express from "express";
import cors from "cors";
import ip from "ip";
import { createWizSender } from "./wiz-sender.ts";
import type { Color, WizLight } from "../src/types/global.ts";
import {
  ACCENT_COLORS,
  ACTIVE_COLORS,
  COLOR_MODES,
  IPS,
} from "../src/lib/constants.ts";
import { sequenceOrder, sequences } from "../src/lib/sequences/index.ts";
import { accentOrder, accents } from "../src/lib/accents.ts";

const app = express();
const wizSender = createWizSender();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cueTimestamp = 0;
let bpm = 120;

let activeSequence = "";
let runningSequence = "";
let sequenceColorMode = "random";
let sequenceColor: Color = [255, 255, 255];
let sequenceDimming = 1;

let activeAccent = "";
let runningAccent = "";
let accentColorMode = "random";
let accentColor: Color = [255, 255, 255];
let accentDimming = 1;

let queue: {
  sequence?: string;
  sequenceColorMode?: string;
  sequenceColor?: Color;
  accent?: string;
  accentColorMode?: string;
  accentColor?: Color;
} = {};

let currentBeat = -1;
let currentTick = -1;

let loopInterval: ReturnType<typeof setInterval> | undefined = undefined;

const buildParams = (config: WizLight): WizLight => {
  const params: WizLight = {
    // state: true,
    // speed: 0,
    // fade: 0,
    // "fade-in": 0,
    // "fade-out": 0,
  };

  if (config.state !== undefined) {
    params.state = config.state;
  }

  if (config.dimming !== undefined) {
    params.dimming = (100 - config.dimming * 100) * sequenceDimming;
  }

  if (config.color) {
    params.r = config.color[0];
    params.g = config.color[1];
    params.b = config.color[2];
    if (
      config.color.reduce(
        (accumulator: number, currentValue: number) =>
          accumulator + currentValue,
        0,
      ) ===
      255 * 3
    ) {
      params.temp = 5000;
      if (params.dimming) params.dimming *= 0.25;
    }
  }

  return params;
};

const loop = () => {
  const time = Date.now();
  const beat = ((time - cueTimestamp) / (60000 / bpm)) % 16;
  const beatFloor = Math.floor(beat);
  const tick = (beat - beatFloor) * 4;
  const tickFloor = Math.floor(tick);
  if (currentBeat === beatFloor && currentTick === tickFloor) return;
  currentBeat = beatFloor;
  currentTick = tickFloor;

  // console.log(`${currentBeat + 1}/${currentTick + 1}`);

  if (!(currentBeat % 4) && currentTick === 0) {
    if (queue.sequence) {
      activeSequence = queue.sequence;
      runningSequence = queue.sequence;
    }
    if (queue.sequenceColorMode) sequenceColorMode = queue.sequenceColorMode;
    if (queue.sequenceColor) sequenceColor = queue.sequenceColor;
    if (queue.accent || queue.accent === "") {
      activeAccent = queue.accent;
      runningAccent = queue.accent;
    }
    if (queue.accentColorMode) accentColorMode = queue.accentColorMode;
    if (queue.accentColor) accentColor = queue.accentColor;
    queue = {};
  }

  if (!(currentBeat % 4) && currentTick === 0) {
    if (activeSequence === "random") {
      const availableSequences = sequenceOrder.filter(
        (sequence) => sequence !== runningSequence,
      );
      runningSequence =
        availableSequences[
          Math.floor(Math.random() * availableSequences.length)
        ];
    }
    if (activeAccent === "random")
      runningAccent =
        accentOrder[Math.floor(Math.random() * accentOrder.length)];
  }

  if (!(currentBeat % 2) && currentTick === 0) {
    if (sequenceColorMode === COLOR_MODES[0]) {
      sequenceColor =
        ACTIVE_COLORS[Math.floor(Math.random() * ACTIVE_COLORS.length)];
    }
    if (accentColorMode === COLOR_MODES[0]) {
      accentColor =
        ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    }
  }

  const lightMap: Record<number, { color?: Color; dimming?: number }> = {};

  const sequenceTimeline =
    sequences[runningSequence]?.timeline({
      beat: currentBeat,
      tick: currentTick,
    }) || [];
  const sequenceTimelineBeats = sequenceTimeline.length / 4;
  const sequenceTimelineData =
    sequenceTimeline[(currentBeat % sequenceTimelineBeats) * 4 + currentTick];
  if (sequenceTimelineData) {
    if (sequenceColorMode === COLOR_MODES[1] && !(currentTick % 2)) {
      sequenceColor =
        ACTIVE_COLORS[Math.floor(Math.random() * ACTIVE_COLORS.length)];
    }
    sequenceTimelineData.forEach((data: any) => {
      [...(data.ips || IPS)].forEach((ip) => {
        lightMap[ip] = {};
        lightMap[ip].dimming = data.dimming;
        lightMap[ip].color = sequenceColor;
        if (data.randomDimming) {
          lightMap[ip].dimming =
            Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
            data.randomDimming[0];
        }
      });
    });
  }

  const accentTimeline =
    accents[runningAccent]?.timeline({
      beat: currentBeat,
      tick: currentTick,
    }) || [];
  const accentTimelineBeats = accentTimeline.length / 4;
  const accentTimelineData =
    accentTimeline[(currentBeat % accentTimelineBeats) * 4 + currentTick];
  if (accentTimelineData) {
    accentTimelineData.forEach((data: any) => {
      data.ips.forEach((ip: number) => {
        if (!lightMap[ip]) lightMap[ip] = {};
        lightMap[ip].dimming = data.dimming + (1 - accentDimming);
        lightMap[ip].color = accentColor;
      });
    });
  }
  for (const [ip, config] of Object.entries(lightMap)) {
    wizSender.update(Number(ip), buildParams(config));
  }
};

const startLoop = () => {
  if (!loopInterval) {
    currentBeat = -1;
    currentTick = -1;
    loop();
    loopInterval = setInterval(loop, 1000 / 60);
  }
};

const stopLoop = () => {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = undefined;
  }
  wizSender.clearPending();
};

app.get("/settings", async (_, res) => {
  res.status(200).json({
    cueTimestamp,
    bpm,
    sequence: queue.sequence || activeSequence,
    sequenceColorMode: queue.sequenceColorMode || sequenceColorMode,
    sequenceColor: queue.sequenceColor || sequenceColor,
    sequenceDimming,
    accent: queue.accent || activeAccent,
    accentColorMode: queue.accentColorMode || accentColorMode,
    accentColor: queue.accentColor || accentColor,
    accentDimming,
  });
});

app.post("/toggle", async (_, res) => {
  stopLoop();
  activeSequence = "";
  runningSequence = "";
  res.status(200).json({});
});

app.post("/cue", async (req, res) => {
  cueTimestamp = req.body.timestamp;
  res.status(200).json({});
});

app.post("/bpm", async (req, res) => {
  bpm = req.body.bpm;
  res.status(200).json({});
});

app.post("/sequence", async (req, res) => {
  const { timestamp, sequence } = req.body;
  if (sequence) {
    if (activeSequence && sequence !== activeSequence) {
      queue.sequence = sequence;
    } else {
      activeSequence = sequence;
      runningSequence = sequence;
      cueTimestamp = timestamp;
      startLoop();
    }
  } else {
    stopLoop();
    activeSequence = "";
    runningSequence = "";
  }
  res.status(200).json({});
});

app.post("/update", async (req, res) => {
  const {
    sequenceColorMode,
    sequenceColor,
    accent,
    accentColorMode,
    accentColor,
  } = req.body;
  if (sequenceColorMode) queue.sequenceColorMode = sequenceColorMode;
  if (sequenceColor) queue.sequenceColor = sequenceColor;
  if (accent || accent === "") queue.accent = accent;
  if (accentColorMode) queue.accentColorMode = accentColorMode;
  if (accentColor) queue.accentColor = accentColor;
  res.status(200).json({});
});

app.post("/dimming", async (req, res) => {
  const {
    sequenceDimming: updatedSequenceDimming,
    accentDimming: updatedAccentDimming,
  } = req.body;
  if (updatedSequenceDimming || updatedSequenceDimming === 0)
    sequenceDimming = updatedSequenceDimming;
  if (updatedAccentDimming || updatedAccentDimming === 0)
    accentDimming = updatedAccentDimming;
  res.status(200).json({});
});

const PORT = process.env.HUB_PORT;
const server = app.listen(PORT, () => {
  console.log(`Light hub running on http://${ip.address()}:${PORT}`);
});

server.on("close", () => {
  stopLoop();
  wizSender.close();
});

const shutdown = () => {
  stopLoop();
  wizSender.close();
  server.close();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
