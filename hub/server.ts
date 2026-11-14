import express from "express";
import cors from "cors";
import ip from "ip";
import { createWizSender } from "./wiz-sender.ts";
import type { WizLight } from "../src/types/global.ts";
import {
  advanceLightingLoop,
  createLightingLoopState,
  queueLightingUpdate,
} from "../src/lib/lighting-loop.ts";

const app = express();
const wizSender = createWizSender();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const lighting = createLightingLoopState();

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
    params.dimming = 100 - config.dimming * 100;
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
      // params.temp = 5000;
      if (params.dimming) params.dimming *= 0.75;
    }
  }

  if (params.dimming === 0) {
    params.r = 255;
    params.g = 0;
    params.b = 0;
  }

  return params;
};

const loop = () => {
  const lightMap = advanceLightingLoop(lighting, Date.now(), 120);
  if (!lightMap) return;
  for (const [ip, config] of Object.entries(lightMap)) {
    wizSender.update(Number(ip), buildParams(config));
  }
};

const startLoop = () => {
  if (!loopInterval) {
    lighting.currentBeat = -1;
    lighting.currentTick = -1;
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

app.get("/", async (_, res) => {
  res.status(200).send(`${ip.address()}:${process.env.HUB_PORT}`);
});

app.get("/settings", async (_, res) => {
  res.status(200).json({
    cueTimestamp: lighting.cueTimestamp,
    seedShift: lighting.seedShift,
    bpm: lighting.bpm,
    sequence: lighting.queue.sequence || lighting.activeSequence,
    sequenceColorMode:
      lighting.queue.sequenceColorMode || lighting.sequenceColorMode,
    sequenceColor: lighting.queue.sequenceColor || lighting.sequenceColor,
    sequenceDimming: lighting.sequenceDimming,
    accent: lighting.queue.accent || lighting.activeAccent,
    accentColorMode: lighting.queue.accentColorMode || lighting.accentColorMode,
    accentColor: lighting.queue.accentColor || lighting.accentColor,
    accentDimming: lighting.accentDimming,
  });
});

app.post("/toggle", async (_, res) => {
  stopLoop();
  lighting.cueTimestamp = 0;
  lighting.activeSequence = "";
  lighting.runningSequence = "";
  res.status(200).json({});
});

app.post("/cue", async (req, res) => {
  console.log(req.body);
  lighting.cueTimestamp = req.body.timestamp;
  lighting.seedShift = req.body.seedShift;
  res.status(200).json({});
});

app.post("/bpm", async (req, res) => {
  console.log(req.body);
  lighting.bpm = req.body.bpm;
  res.status(200).json({});
});

app.post("/sequence", async (req, res) => {
  console.log(req.body);
  const { timestamp, sequence } = req.body;
  if (sequence) {
    if (lighting.activeSequence && sequence !== lighting.activeSequence) {
      queueLightingUpdate(lighting, { sequence });
    } else {
      lighting.cueTimestamp = timestamp;
      lighting.activeSequence = sequence;
      lighting.runningSequence = sequence;
      startLoop();
    }
  } else {
    stopLoop();
    lighting.activeSequence = "";
    lighting.runningSequence = "";
  }
  res.status(200).json({});
});

app.post("/update", async (req, res) => {
  console.log(req.body);
  const {
    sequenceColorMode,
    sequenceColor,
    accent,
    accentColorMode,
    accentColor,
  } = req.body;
  queueLightingUpdate(lighting, {
    sequenceColorMode,
    sequenceColor,
    accent,
    accentColorMode,
    accentColor,
  });
  res.status(200).json({});
});

app.post("/dimming", async (req, res) => {
  const {
    sequenceDimming: updatedSequenceDimming,
    accentDimming: updatedAccentDimming,
  } = req.body;
  if (updatedSequenceDimming || updatedSequenceDimming === 0)
    lighting.sequenceDimming = updatedSequenceDimming;
  if (updatedAccentDimming || updatedAccentDimming === 0)
    lighting.accentDimming = updatedAccentDimming;
  res.status(200).json({});
});

const server = app.listen(process.env.HUB_PORT, () => {
  console.log(`${ip.address()}:${process.env.HUB_PORT}`);
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
