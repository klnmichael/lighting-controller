import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { networkInterfaces, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const origin = "http://localhost:3000";

async function startHub(t, token, host, files = {}) {
  const cwd = await mkdtemp(join(tmpdir(), "lighting-hub-test-"));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(cwd, name), content);
  }
  const env = {
    ...process.env,
    HUB_PORT: "0",
    HUB_ALLOWED_ORIGINS: origin,
    NODE_ENV: "development",
  };
  for (const name of Object.keys(env)) {
    if (name.startsWith("APINATOR_") || name.startsWith("NEXT_PUBLIC_APINATOR_")) delete env[name];
  }
  if (Object.keys(files).length) delete env.HUB_ALLOWED_ORIGINS;
  if (host) env.HUB_HOST = host;
  else delete env.HUB_HOST;
  if (token) env.HUB_TOKEN = token;
  else delete env.HUB_TOKEN;
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.ts", import.meta.url))], {
    env,
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await once(child, "exit");
    }
    for (const name of Object.keys(files)) await unlink(join(cwd, name));
    await rmdir(cwd);
  });
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

test("the hub loads .env and honors .env.local and exported overrides", async (t) => {
  const fromEnv = await startHub(t, undefined, undefined, {
    ".env": `HUB_ALLOWED_ORIGINS=${origin}\nHUB_PORT=12345\n`,
  });
  const first = new WebSocket(`ws://${fromEnv}/sync`, { origin });
  t.after(() => first.terminate());
  const firstSnapshot = once(first, "message");
  await once(first, "open");
  assert.equal(JSON.parse(String((await firstSnapshot)[0])).type, "state");

  const fromLocal = await startHub(t, undefined, undefined, {
    ".env": "HUB_ALLOWED_ORIGINS=https://other.example\n",
    ".env.local": `HUB_ALLOWED_ORIGINS=${origin}\n`,
  });
  const second = new WebSocket(`ws://${fromLocal}/sync`, { origin });
  t.after(() => second.terminate());
  const secondSnapshot = once(second, "message");
  await once(second, "open");
  assert.equal(JSON.parse(String((await secondSnapshot)[0])).type, "state");
});

test("the Apinator bridge receives configuration from .env", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "lighting-hub-test-"));
  const file = join(cwd, ".env");
  await writeFile(file, `HUB_ALLOWED_ORIGINS=${origin}\nAPINATOR_APP_ID=example\n`);
  t.after(async () => {
    await unlink(file);
    await rmdir(cwd);
  });
  const env = { ...process.env, HUB_PORT: "0", NODE_ENV: "development" };
  for (const name of Object.keys(env)) {
    if (name.startsWith("APINATOR_") || name.startsWith("NEXT_PUBLIC_APINATOR_") ||
      name === "HUB_ALLOWED_ORIGINS") delete env[name];
  }
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.ts", import.meta.url))], {
    env,
    cwd,
    stdio: ["ignore", "ignore", "pipe"],
  });
  let errors = "";
  child.stderr.setEncoding("utf8").on("data", (chunk) => { errors += chunk; });
  const [code] = await once(child, "exit");
  assert.notEqual(code, 0);
  assert.match(errors, /Incomplete Apinator configuration/);
});

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
