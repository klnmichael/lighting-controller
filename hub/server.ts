import express from "express";
import cors from "cors";
import sequences from "../src/lib/sequences/index.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let bpm = 125;
let sequence = "";

let timeouts: ReturnType<typeof setTimeout>[] = [];
let loopTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

const purgeSequenceTimeouts = () => {
  timeouts.forEach((timeout) => clearTimeout(timeout));
  timeouts = [];
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = undefined;
  }
};

app.post("/bpm", async (req, res) => {
  bpm = req.body.bpm;
  res.status(200).json({});
});

app.post("/sequence/start", async (req, res) => {
  purgeSequenceTimeouts();
  sequence = req.body.name;
  const loop = () => {
    timeouts = sequences[sequence].loop(bpm);
    loopTimeout = setTimeout(() => {
      loop();
    }, ((1000 * 60) / bpm) * sequences[sequence].beat);
  };
  loop();
  res.status(200).json({});
});

app.post("/sequence/pause", async (req, res) => {
  purgeSequenceTimeouts();
  sequence = "";
  res.status(200).json({});
});

app.post("/sequence/update", async (req, res) => {
  if (sequence && sequences[sequence].update)
    sequences[sequence].update(req.body);
  res.status(200).json({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hub running on port ${PORT}`);
});
