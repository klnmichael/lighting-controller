import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mock, test } from "node:test";
import { Apinator as Client } from "@apinator/client";
import { createLightingLoopState } from "../src/lib/lighting-loop.ts";
import { isHubSnapshot } from "../src/lib/hub-protocol.ts";

const key = "app_test";
const secret = "test-apinator-secret";
const password = "test-passphrase-at-least-32-characters";
const channelName = "private-lighting";
const authUrl = "http://localhost:9999/api/apinator/auth";
const peers = new Set();
let nextId = 0;

class FakeWebSocket {
  readyState = 1;
  onmessage = null;
  onclose = null;
  onerror = null;
  subscribed = false;
  id = `${++nextId}.1`;

  constructor() {
    peers.add(this);
    setImmediate(() => this.receive("realtime:connection_established", {
      socket_id: this.id,
      activity_timeout: 120,
    }));
  }
  receive(event, data, channel) {
    this.onmessage?.({ data: JSON.stringify({ event, data: JSON.stringify(data), channel }) });
  }
  send(raw) {
    const message = JSON.parse(raw);
    const data = JSON.parse(message.data);
    if (message.event === "realtime:subscribe") {
      const signature = createHmac("sha256", secret).update(`${this.id}:${channelName}`).digest("hex");
      assert.equal(data.auth, `${key}:${signature}`);
      this.subscribed = true;
      this.receive("realtime:subscription_succeeded", {}, channelName);
    } else if (message.event.startsWith("client-")) {
      for (const peer of peers) {
        if (peer !== this && peer.subscribed) peer.receive(message.event, data, channelName);
      }
    }
  }
  close() {
    this.readyState = 3;
    peers.delete(this);
    this.onclose?.({ code: 1000 });
  }
}

function waitFor(channel, event) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 3000);
    channel.bind(event, (value) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });
}

test("private Apinator channel relays state and commands through the hub", async (t) => {
  const savedEnv = { ...process.env };
  Object.assign(process.env, {
    APINATOR_APP_ID: "test-id",
    APINATOR_KEY: key,
    APINATOR_SECRET: secret,
    APINATOR_CLUSTER: "us",
    APINATOR_AUTH_URL: authUrl,
    APINATOR_CONTROL_PASSWORD: password,
  });
  t.after(() => {
    for (const name of Object.keys(process.env)) {
      if (!(name in savedEnv)) delete process.env[name];
    }
    Object.assign(process.env, savedEnv);
  });
  const { POST } = await import("../src/app/api/apinator/auth/route.ts");
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    if (url === authUrl) return POST(new Request(url, options));
    if (url === "https://ws-us.apinator.io/apps/test-id/events") {
      const event = JSON.parse(options.body);
      assert.equal(event.channel, channelName);
      for (const peer of peers) {
        if (peer.subscribed) peer.receive(event.name, JSON.parse(event.data), channelName);
      }
      return Response.json({});
    }
    throw new Error(`Unexpected network request: ${url}`);
  };
  t.after(() => { globalThis.fetch = realFetch; });
  const wsMock = mock.module("ws", { defaultExport: FakeWebSocket });
  t.after(() => wsMock.restore());
  const { createApinatorBridge } = await import("./apinator.ts");

  const state = createLightingLoopState();
  let bridge;
  bridge = createApinatorBridge(
    () => ({ type: "state", lighting: state }),
    (command) => {
      if (command.type === "bpm") state.bpm = command.bpm;
      bridge.publishState();
    },
  );
  assert.ok(bridge);
  t.after(() => bridge.close());

  const browser = new Client({
    appKey: key,
    cluster: "us",
    authEndpoint: authUrl,
    authHeaders: { Authorization: `Bearer ${password}` },
    WebSocket: FakeWebSocket,
  });
  t.after(() => browser.disconnect());
  const channel = browser.subscribe(channelName);
  const subscribed = waitFor(channel, "realtime:subscription_succeeded");
  browser.connect();
  await subscribed;
  const sync = waitFor(channel, "sync");
  channel.trigger("client-sync", { id: "request-1", clientTime: 123 });
  const initial = await sync;
  assert.equal(initial.requestId, "request-1");
  assert.equal(initial.clientTime, 123);
  assert.equal(initial.lighting.bpm, 120);
  assert.equal(typeof initial.serverTime, "number");
  assert.equal(isHubSnapshot(initial), true);
  assert.equal(isHubSnapshot({ type: "state", lighting: {} }), false);

  const updated = waitFor(channel, "state");
  channel.trigger("client-command", { type: "bpm", bpm: 135 });
  assert.equal((await updated).lighting.bpm, 135);

  const wrongPassword = await POST(new Request(authUrl, {
    method: "POST",
    headers: { Authorization: "Bearer wrong" },
    body: JSON.stringify({ socket_id: "1.1", channel_name: channelName }),
  }));
  assert.equal(wrongPassword.status, 401);
  const wrongChannel = await POST(new Request(authUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${password}` },
    body: JSON.stringify({ socket_id: "1.1", channel_name: "private-other" }),
  }));
  assert.equal(wrongChannel.status, 400);
  const missingId = await POST(new Request(authUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${password}` },
    body: JSON.stringify({ channel_name: channelName }),
  }));
  assert.equal(missingId.status, 400);
});
