import { timingSafeEqual } from "node:crypto";
import nextEnv from "@next/env";
import express from "express";
import cors from "cors";
import { WebSocket, WebSocketServer } from "ws";
import { createWizDriver, createWizSender } from "./wiz-sender.ts";
import { createGoveeDriver, createGoveeSender } from "./govee.ts";
import { isHubCommand, type HubCommand } from "../src/lib/hub-protocol.ts";
import { LIGHTS } from "../src/lib/constants.ts";
import { createLightOutput } from "../src/lib/light-output.ts";
import {
  advanceLightingEngine,
  createLightingEngine,
  createLightingLoopState,
  queueLightingUpdate,
  resetLightingEngine,
} from "../src/lib/lighting-loop.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const token = process.env.HUB_TOKEN;
const allowedOrigins = (process.env.HUB_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0 || (token !== undefined && token.length < 32)) {
  throw new Error(
    "Set HUB_ALLOWED_ORIGINS and, if using HTTP endpoints, a HUB_TOKEN of at least 32 characters.",
  );
}

const authorized = (candidate: unknown): boolean => {
  if (!token || typeof candidate !== "string") return false;
  const expected = Buffer.from(token);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
const originAllowed = (origin: string | undefined) =>
  !origin || allowedOrigins.includes(origin);

const app = express();
const wizSender = createWizSender();
const lighting = createLightingLoopState();
const engine = createLightingEngine(lighting);
const sockets = new Set<WebSocket>();
let running = false;

app.use(
  cors({
    origin(origin, callback) {
      callback(null, originAllowed(origin));
    },
  }),
);
app.use(express.json({ limit: "8kb" }));
app.use((req, res, next) => {
  if (!originAllowed(req.headers.origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  if (!token) {
    res
      .status(503)
      .json({ error: "HTTP access is disabled; configure HUB_TOKEN" });
    return;
  }
  const authorization = req.headers.authorization;
  if (
    !authorization?.startsWith("Bearer ") ||
    !authorized(authorization.slice(7))
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

const getSnapshot = () => ({ type: "state" as const, lighting });
const snapshot = () => JSON.stringify(getSnapshot());
const broadcast = () => {
  const message = snapshot();
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
  }
};

const activeKey = () =>
  JSON.stringify({
    activeSequence: lighting.activeSequence,
    runningSequence: lighting.runningSequence,
    activeAccent: lighting.activeAccent,
    runningAccent: lighting.runningAccent,
    sequenceColorMode: lighting.sequenceColorMode,
    sequenceColor: lighting.sequenceColor,
    accentColorMode: lighting.accentColorMode,
    accentColor: lighting.accentColor,
    queue: lighting.queue,
  });

// Output loops pull from the engine on their own schedule; whichever samples
// furthest ahead advances it, and state changes are broadcast as they happen.
const lightSource = {
  now: Date.now,
  grid: () => lighting,
  map: engine.map,
  advance(time: number) {
    const before = activeKey();
    if (advanceLightingEngine(engine, time) && activeKey() !== before) {
      broadcast();
    }
  },
};
const wizLights = LIGHTS.filter((light) => light.brand === "wiz");
const goveeLights = LIGHTS.filter((light) => light.brand === "govee");
// Only open the Govee socket (port 4002) when Govee lights are configured.
const goveeSender = goveeLights.length ? createGoveeSender(goveeLights) : undefined;
const outputs = [
  createLightOutput(createWizDriver(wizSender, wizLights), lightSource),
  ...(goveeSender
    ? [createLightOutput(createGoveeDriver(goveeSender, goveeLights), lightSource)]
    : []),
];

const startLoop = () => {
  if (running) return;
  running = true;
  resetLightingEngine(engine);
  for (const output of outputs) output.start();
};
const stopLoop = () => {
  running = false;
  for (const output of outputs) output.stop();
  wizSender.clearPending();
  goveeSender?.reset();
};

// Toggling playback back on resumes whatever sequence was last played.
let lastSequence = "shuffle";

const startSequence = (sequence: string) => {
  lastSequence = sequence;
  // While the loop is running (a sequence is playing or a cue started it),
  // queue the sequence so it comes in on the next bar.
  if (running && sequence !== lighting.activeSequence) {
    queueLightingUpdate(lighting, { sequence });
  } else {
    delete lighting.queue.sequence;
    lighting.cueTimestamp = Date.now();
    lighting.activeSequence = sequence;
    lighting.runningSequence = sequence;
    startLoop();
  }
};

/** Stop the loop and clear the sequence (and optionally the accent). */
const stopPlayback = ({ accent }: { accent: boolean }) => {
  stopLoop();
  lighting.cueTimestamp = 0;
  lighting.activeSequence = "";
  lighting.runningSequence = "";
  delete lighting.queue.sequence;
  if (accent) {
    lighting.activeAccent = "";
    lighting.runningAccent = "";
    delete lighting.queue.accent;
  }
};

const applyCommand = (command: HubCommand) => {
  console.log(command);
  switch (command.type) {
    case "toggle":
      // Stop everything that is playing, sequence and accent alike.
      if (running && (lighting.activeSequence || lighting.activeAccent)) {
        stopPlayback({ accent: true });
      } else {
        startSequence(lastSequence);
      }
      break;
    case "cue":
      // Cueing starts the beat loop without starting a sequence.
      lighting.cueTimestamp = Date.now();
      lighting.seedShift = command.seedShift;
      startLoop();
      break;
    case "bpm":
      lighting.bpm = command.bpm;
      break;
    case "sequence":
      if (command.sequence) startSequence(command.sequence);
      else stopPlayback({ accent: false });
      break;
    case "sequenceDimming":
      lighting.sequenceDimming = command.value;
      break;
    case "accentDimming":
      lighting.accentDimming = command.value;
      break;
    default:
      queueLightingUpdate(lighting, { [command.type]: command.value });
  }
};

/** Apply commands and send clients a single state update for all of them. */
const applyCommands = (commands: readonly HubCommand[]) => {
  for (const command of commands) applyCommand(command);
  broadcast();
};

app.get("/settings", (_req, res) => {
  res.json({
    cueTimestamp: lighting.cueTimestamp,
    seedShift: lighting.seedShift,
    bpm: lighting.bpm,
    sequence: lighting.queue.sequence ?? lighting.activeSequence,
    sequenceColorMode:
      lighting.queue.sequenceColorMode ?? lighting.sequenceColorMode,
    sequenceColor: lighting.queue.sequenceColor ?? lighting.sequenceColor,
    sequenceDimming: lighting.sequenceDimming,
    accent: lighting.queue.accent ?? lighting.activeAccent,
    accentColorMode: lighting.queue.accentColorMode ?? lighting.accentColorMode,
    accentColor: lighting.queue.accentColor ?? lighting.accentColor,
    accentDimming: lighting.accentDimming,
  });
});

// Keep the existing HTTP endpoints available to authenticated integrations.
app.post(
  ["/toggle", "/cue", "/bpm", "/sequence", "/update", "/dimming"],
  (req, res) => {
    const body: Record<string, unknown> = req.body ?? {};
    let candidates: unknown[];
    switch (req.path) {
      case "/toggle":
        candidates = [{ type: "toggle" }];
        break;
      case "/cue":
        candidates = [{ type: "cue", seedShift: body.seedShift }];
        break;
      case "/bpm":
        candidates = [{ type: "bpm", bpm: body.bpm }];
        break;
      case "/sequence":
        candidates = [{ type: "sequence", sequence: body.sequence }];
        break;
      default:
        candidates = Object.entries(body).map(([type, value]) => ({
          type,
          value,
        }));
    }
    const commands = candidates.filter(isHubCommand);
    if (commands.length === 0 || commands.length !== candidates.length) {
      res.status(400).json({ error: "Invalid command" });
      return;
    }
    applyCommands(commands);
    res.json({});
  },
);

const server = app.listen(
  Number(process.env.HUB_PORT ?? 3000),
  process.env.HUB_HOST ?? "0.0.0.0",
  () => {
    const address = server.address();
    console.log(
      `Hub listening on ${typeof address === "object" && address ? `${address.address}:${address.port}` : address}`,
    );
  },
);
const websocketServer = new WebSocketServer({
  noServer: true,
  maxPayload: 8192,
});
const aliveSockets = new WeakSet<WebSocket>();
server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/sync" || !originAllowed(request.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  websocketServer.handleUpgrade(request, socket, head, (ws) => {
    websocketServer.emit("connection", ws, request);
  });
});

websocketServer.on("connection", (socket) => {
  aliveSockets.add(socket);
  socket.on("pong", () => aliveSockets.add(socket));
  socket.on("error", (error) => console.error("WebSocket error:", error));
  socket.on("close", () => {
    sockets.delete(socket);
  });
  sockets.add(socket);
  socket.send(snapshot());
  socket.on("message", (data, isBinary) => {
    if (isBinary) {
      socket.close(1003, "Text messages only");
      return;
    }
    let message: unknown;
    try {
      message = JSON.parse(data.toString());
    } catch {
      socket.close(1007, "Invalid JSON");
      return;
    }
    if (!message || typeof message !== "object") {
      socket.close(1008, "Invalid message");
      return;
    }
    const record = message as Record<string, unknown>;
    if (
      record.type === "ping" &&
      typeof record.clientTime === "number" &&
      Number.isFinite(record.clientTime)
    ) {
      socket.send(
        JSON.stringify({
          type: "pong",
          clientTime: record.clientTime,
          serverTime: Date.now(),
        }),
      );
    } else if (isHubCommand(message)) {
      applyCommands([message]);
    } else {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid command", lighting }),
      );
    }
  });
});

const heartbeat = setInterval(() => {
  for (const socket of websocketServer.clients) {
    if (!aliveSockets.has(socket)) {
      socket.terminate();
    } else {
      aliveSockets.delete(socket);
      socket.ping();
    }
  }
}, 30000);

const shutdown = () => {
  clearInterval(heartbeat);
  stopLoop();
  wizSender.close();
  goveeSender?.close();
  for (const socket of websocketServer.clients) socket.terminate();
  websocketServer.close();
  server.close();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
