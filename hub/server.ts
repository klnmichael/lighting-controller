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
let currentBeat = 0;

let timeouts: ReturnType<typeof setTimeout>[] = [];
let loopTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

const purgeSequenceTimeouts = () => {
  timeouts.forEach((timeout) => clearTimeout(timeout));
  timeouts = [];
};

const startLoop = () => {
  timeouts = sequences[sequence].loop(updateWizLight, bpm);
  loopTimeout = setTimeout(() => {
    if (++currentBeat >= sequences[sequence].beat) {
      currentBeat = 0;
      startLoop();
    }
  }, (1000 * 60) / bpm);
};

const stopLoop = () => {
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = undefined;
  }
};

app.post("/cue", async (req, res) => {
  stopLoop();
  purgeSequenceTimeouts();
  startLoop();
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
  console.log(bpm);
  res.status(200).json({});
});

app.post("/sequence/start", async (req, res) => {
  purgeSequenceTimeouts();
  sequence = req.body.name;
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
