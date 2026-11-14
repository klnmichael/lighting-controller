import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { networkInterfaces } from "node:os";
import { test } from "node:test";
import { WebSocket } from "ws";

const origin = "http://localhost:3000";

async function startHub(t, token, host) {
  const env = {
    ...process.env,
    HUB_PORT: "0",
    HUB_ALLOWED_ORIGINS: origin,
  };
  if (host) env.HUB_HOST = host;
  else delete env.HUB_HOST;
  if (token) env.HUB_TOKEN = token;
  else delete env.HUB_TOKEN;
  const child = spawn(process.execPath, ["hub/server.ts"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill("SIGTERM"));
  let errors = "";
  child.stderr.setEncoding("utf8").on("data", (chunk) => { errors += chunk; });
  const [output] = await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(() => { throw new Error(`Hub exited: ${errors}`); }),
  ]);
  const match = String(output).match(/Hub listening on ([\d.]+):(\d+)/);
  assert.ok(match, `Hub did not start: ${output} ${errors}`);
  assert.equal(match[1], host ?? "0.0.0.0");
  return `127.0.0.1:${match[2]}`;
}

test("sockets synchronize without a token and HTTP remains disabled", async (t) => {
  const address = await startHub(t);
  const sockets = [];
  t.after(() => sockets.forEach((socket) => socket.terminate()));
  const connect = async () => {
    const socket = new WebSocket(`ws://${address}/sync`, { origin });
    sockets.push(socket);
    const snapshot = once(socket, "message");
    await once(socket, "open");
    assert.equal(JSON.parse(String((await snapshot)[0])).type, "state");
    return socket;
  };
  const first = await connect();
  const second = await connect();
  const update = once(second, "message");
  first.send(JSON.stringify({ type: "bpm", bpm: 135 }));
  assert.equal(JSON.parse(String((await update)[0])).lighting.bpm, 135);
  assert.equal((await fetch(`http://${address}/settings`)).status, 503);
});

test("socket accepts connections on a local network address", async (t) => {
  const ip = Object.values(networkInterfaces())
    .flat()
    .find((address) => address && address.family === "IPv4" && !address.internal)
    ?.address;
  if (!ip) {
    t.skip("No non-loopback IPv4 interface available");
    return;
  }
  const address = await startHub(t);
  const port = address.split(":")[1];
  const socket = new WebSocket(`ws://${ip}:${port}/sync`, { origin });
  t.after(() => socket.terminate());
  const snapshot = once(socket, "message");
  await once(socket, "open");
  assert.equal(JSON.parse(String((await snapshot)[0])).type, "state");
});

test("HTTP still requires the configured token", async (t) => {
  const token = "test-token-with-at-least-32-characters";
  const address = await startHub(t, token, "127.0.0.1");
  assert.equal((await fetch(`http://${address}/settings`)).status, 401);
  assert.equal((await fetch(`http://${address}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  })).status, 200);
});
