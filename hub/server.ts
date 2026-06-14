import express from "express";
import cors from "cors";
import ip from "ip";
import randomColor from "randomcolor";
import type { Color } from "../src/types/global.ts";
import { IPS } from "../src/lib/constants.ts";
import { sequences } from "../src/lib/sequences/index.ts";
import { updateWizLight } from "../src/utils/updateWizLight.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let activeSequence = "";
let queuedSequence = "";

let cueTimestamp = 0;
// let shuffle = false;
let bpm = 125;
let dimming = 100;
let customColor = [255, 0, 255];
// let colorShuffle = false;

let currentBeat = -1;
let currentTick = -1;

let loopInterval: ReturnType<typeof setInterval> | undefined = undefined;

const loop = () => {
  const time = Date.now();
  const beat = ((time - cueTimestamp) / (60000 / bpm)) % 8;
  const beatFloor = Math.floor(beat);
  const tick = (beat - beatFloor) * 4;
  const tickFloor = Math.floor(tick);
  if (currentBeat === beatFloor && currentTick === tickFloor) return;
  currentBeat = beatFloor;
  currentTick = tickFloor;
  // console.log(`${currentBeat + 1}/${currentTick + 1}`);
  if (!(currentBeat % 2) && currentTick === 0) {
    if (queuedSequence) {
      activeSequence = queuedSequence;
      queuedSequence = "";
    }
    customColor = randomColor({
      luminosity: "bright",
      format: "rgbArray",
    }) as unknown as Color;
  }
  const timeline =
    sequences[activeSequence]?.timeline({
      beat: currentBeat,
      tick: currentTick,
    }) || [];
  const timelineBeats = timeline.length / 4;
  const barData = timeline[(currentBeat % timelineBeats) * 4 + currentTick];
  if (barData) {
    barData.forEach((data: any) => {
      if (!data) return;
      [...(data.ips || IPS)].forEach((ip) => {
        const params: any = {
          dimming:
            data.dimming || data.dimming === 0
              ? data.dimming * dimming
              : dimming,
        };
        if (data.color) params.color = data.color;
        if (data.randomColor) {
          params.color = randomColor({
            luminosity: "bright",
            format: "rgbArray",
          }) as unknown as Color;
        }
        if (data.customColor) params.color = customColor;
        if (data.randomDimming) {
          params.dimming = Math.round(
            (Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
              data.randomDimming[0]) *
              dimming,
          );
        }
        if (data.state !== undefined) {
          params.state = data.state;
        }
        updateWizLight(ip, params);
      });
    });
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
};

app.post("/sequence", async (req, res) => {
  const timestamp = req.body.timestamp;
  const sequence = req.body.name;
  if (sequence) {
    if (activeSequence && sequence !== activeSequence) {
      queuedSequence = sequence;
    } else {
      activeSequence = sequence;
      cueTimestamp = timestamp;
      startLoop();
    }
  } else {
    stopLoop();
    activeSequence = "";
    queuedSequence = "";
  }
  res.status(200).json({});
});

app.post("/cue", async (req, res) => {
  const timestamp = req.body.timestamp;
  stopLoop();
  if (activeSequence) startLoop();
  res.status(200).json({});
});

app.post("/pause", async (req, res) => {
  stopLoop();
  activeSequence = "";
  queuedSequence = "";
  res.status(200).json({});
});

app.post("/update", async (req, res) => {
  if (req.body.bpm) bpm = req.body.bpm;
  if (req.body.color) customColor = req.body.color;
  if (req.body.dimming) dimming = req.body.dimming;
  res.status(200).json({});
});

const PORT = process.env.HUB_PORT;
app.listen(PORT, () => {
  console.log(`Hub running on http://${ip.address()}:${PORT}`);
});
