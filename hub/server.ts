import express from "express";
import cors from "cors";
import ip from "ip";
import dgram from "dgram";
import randomColor from "randomcolor";
import type { Color } from "../src/types/global.ts";
import { COLOR_MODES, IPS } from "../src/lib/constants.ts";
import { sequenceOrder, sequences } from "../src/lib/sequences/index.ts";
import {
  updateWizLight,
  updateWizLights,
} from "../src/utils/updateWizLight.ts";
import { accentOrder, accents } from "../src/lib/accents.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cueTimestamp = 0;
let bpm = 120;

let activeSequence = "";
let runningSequence = "";
let sequenceColorMode = "random";
let sequenceColor = [255, 255, 255];
let sequenceDimming = 1;

let activeAccent = "";
let runningAccent = "";
let accentColorMode = "random";
let accentColor = [255, 255, 255];
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loop = () => {
  // const time = Date.now();
  // const beat = ((time - cueTimestamp) / (60000 / bpm)) % 16;
  // const beatFloor = Math.floor(beat);
  // const tick = (beat - beatFloor) * 4;
  // const tickFloor = Math.floor(tick);
  // if (currentBeat === beatFloor && currentTick === tickFloor) return;
  // currentBeat = beatFloor;
  // currentTick = tickFloor;
  // // console.log(`${currentBeat + 1}/${currentTick + 1}`);
  // if (!(currentBeat % 2) && currentTick === 0) {
  //   if (queue.sequence) {
  //     activeSequence = queue.sequence;
  //     runningSequence = queue.sequence;
  //   }
  //   if (queue.sequenceColorMode) sequenceColorMode = queue.sequenceColorMode;
  //   if (queue.sequenceColor) sequenceColor = queue.sequenceColor;
  //   if (queue.accent || queue.accent === "") {
  //     activeAccent = queue.accent;
  //     runningAccent = queue.accent;
  //   }
  //   if (queue.accentColorMode) accentColorMode = queue.accentColorMode;
  //   if (queue.accentColor) accentColor = queue.accentColor;
  //   queue = {};
  //   if (sequenceColorMode === COLOR_MODES[0]) {
  //     sequenceColor = randomColor({
  //       luminosity: "bright",
  //       format: "rgbArray",
  //     }) as unknown as Color;
  //   }
  //   if (accentColorMode === COLOR_MODES[0]) {
  //     accentColor = randomColor({
  //       luminosity: "bright",
  //       format: "rgbArray",
  //     }) as unknown as Color;
  //   }
  // }
  // if (!(currentBeat % 16) && currentTick === 0) {
  //   if (activeSequence === "random")
  //     runningSequence =
  //       sequenceOrder[Math.floor(Math.random() * sequenceOrder.length)];
  //   if (activeAccent === "random")
  //     runningAccent =
  //       accentOrder[Math.floor(Math.random() * accentOrder.length)];
  // }
  // const lightMap: any = {};
  // const sequenceTimeline =
  //   sequences[runningSequence]?.timeline({
  //     beat: currentBeat,
  //     tick: currentTick,
  //   }) || [];
  // const sequenceTimelineBeats = sequenceTimeline.length / 4;
  // const sequenceTimelineData =
  //   sequenceTimeline[(currentBeat % sequenceTimelineBeats) * 4 + currentTick];
  // if (sequenceTimelineData) {
  //   sequenceTimelineData.forEach((data: any) => {
  //     [...(data.ips || IPS)].forEach((ip) => {
  //       lightMap[ip] = {};
  //       lightMap[ip].dimming = data.dimming;
  //       lightMap[ip].color =
  //         sequenceColorMode === COLOR_MODES[1]
  //           ? (randomColor({
  //               luminosity: "bright",
  //               format: "rgbArray",
  //             }) as unknown as Color)
  //           : sequenceColor;
  //       if (data.randomDimming) {
  //         lightMap[ip].dimming =
  //           Math.random() * (data.randomDimming[1] - data.randomDimming[0]) +
  //           data.randomDimming[0];
  //       }
  //       lightMap[ip].dimming = lightMap[ip].dimming;
  //     });
  //   });
  // }
  // const accentTimeline =
  //   accents[runningAccent]?.timeline({
  //     beat: currentBeat,
  //     tick: currentTick,
  //   }) || [];
  // const accentTimelineBeats = accentTimeline.length / 4;
  // const accentTimelineData =
  //   accentTimeline[(currentBeat % accentTimelineBeats) * 4 + currentTick];
  // if (accentTimelineData) {
  //   accentTimelineData.forEach((data: any) => {
  //     data.ips.forEach((ip: number) => {
  //       if (data.dimming === 1 && lightMap[ip]) {
  //         lightMap[ip].color = accentColor;
  //       } else {
  //         if (!lightMap[ip]) lightMap[ip] = {};
  //         lightMap[ip].dimming = data.dimming;
  //         lightMap[ip].color = accentColor;
  //       }
  //     });
  //   });
  // }
  // updateWizLights(
  //   Object.entries(lightMap).map(([ip, params]) => ({
  //     ip: parseInt(ip),
  //     config: params as any,
  //   })),
  // );
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

// app.get("/test", async (_, res) => {
//   let state = true;
//   setInterval(() => {
//     state = !state;
//     const client = dgram.createSocket("udp4");
//     const buffer = Buffer.from(
//       JSON.stringify({
//         method: "setPilot",
//         env: "pro",
//         params: {
//           r: 255,
//           g: state ? 0 : 255,
//           b: state ? 0 : 255,
//           // dimming: 10, // 10 - 100
//           // state: true,
//           transition: 20,
//           fade: 0,
//         },
//       }),
//     );
//     client.send(buffer, 0, buffer.length, 38899, "192.168.50.216", () => {
//       client.close();
//     });
//   }, 1000);
//   res.status(200).json({});
// });

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
app.listen(PORT, () => {
  console.log(`Light hub running on http://${ip.address()}:${PORT}`);
});
