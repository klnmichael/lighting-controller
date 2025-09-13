import express from "express";
import cors from "cors";
import ip from "ip";
import { sequences } from "../src/lib/sequences/index.ts";
import { updateWizLight } from "../src/utils/updateWizLight.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let bpm = 125;
let sequence = "";
let queuedSequence = "";
let currentBeat = 0;

let timeouts: ReturnType<typeof setTimeout>[] = [];
let loopTimeout: ReturnType<typeof setInterval> | undefined = undefined;

const purgeSequenceTimeouts = () => {
  timeouts.forEach((timeout) => clearTimeout(timeout));
  timeouts = [];
};

const loop = () => {
  if (queuedSequence && queuedSequence !== sequence) {
    sequence = queuedSequence;
    queuedSequence = "";
    currentBeat = 0;
    console.log(currentBeat);
    timeouts = sequences[sequence].loop(updateWizLight, bpm, currentBeat);
  } else if (currentBeat === 0 || !(currentBeat % sequences[sequence].beats)) {
    console.log(currentBeat);
    timeouts = sequences[sequence].loop(updateWizLight, bpm, currentBeat);
  }
};

const startLoop = () => {
  currentBeat = 0;
  loop();
  loopTimeout = setInterval(() => {
    ++currentBeat;
    loop();
  }, (1000 * 60) / bpm);
};

const stopLoop = () => {
  if (loopTimeout) {
    clearInterval(loopTimeout);
    loopTimeout = undefined;
  }
};

app.post("/cue", async (req, res) => {
  purgeSequenceTimeouts();
  stopLoop();
  if (sequence) startLoop();
  res.status(200).json({});
});

app.post("/pause", async (req, res) => {
  purgeSequenceTimeouts();
  stopLoop();
  sequence = "";
  res.status(200).json({});
});

app.post("/bpm", async (req, res) => {
  bpm = req.body.value;
  res.status(200).json({});
});

app.post("/sequence/start", async (req, res) => {
  if (sequence) {
    queuedSequence = req.body.name;
  } else {
    sequence = req.body.name;
  }
  if (!loopTimeout) startLoop();
  res.status(200).json({});
});

app.post("/sequence/update", async (req, res) => {
  if (sequence && sequences[sequence].update)
    sequences[sequence].update(req.body);
  res.status(200).json({});
});

const PORT = process.env.HUB_PORT;
app.listen(PORT, () => {
  console.log(`Hub running on http://${ip.address()}:${PORT}`);
});
