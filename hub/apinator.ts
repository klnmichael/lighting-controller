import { Apinator as ApinatorClient } from "@apinator/client";
import { Apinator as ApinatorServer } from "@apinator/server";
import WebSocket from "ws";
import { APINATOR_CHANNEL, isSyncRequest, type SyncRequest } from "../src/lib/apinator-protocol.ts";
import { isHubCommand, type HubCommand, type HubSnapshot } from "../src/lib/hub-protocol.ts";

export function createApinatorBridge(
  getSnapshot: () => HubSnapshot,
  applyCommand: (command: HubCommand) => void,
) {
  const { APINATOR_APP_ID, APINATOR_KEY, APINATOR_SECRET, APINATOR_CLUSTER,
    APINATOR_AUTH_URL, APINATOR_CONTROL_PASSWORD } = process.env;
  const values = [APINATOR_APP_ID, APINATOR_KEY, APINATOR_SECRET, APINATOR_CLUSTER,
    APINATOR_AUTH_URL, APINATOR_CONTROL_PASSWORD];
  if (values.every((value) => !value)) return undefined;
  if (!APINATOR_APP_ID || !APINATOR_KEY || !APINATOR_SECRET ||
    !APINATOR_CLUSTER || !["us", "eu"].includes(APINATOR_CLUSTER) ||
    !APINATOR_AUTH_URL || !APINATOR_CONTROL_PASSWORD ||
    !/^[\x21-\x7e]{32,}$/.test(APINATOR_CONTROL_PASSWORD)) {
    throw new Error("Incomplete Apinator configuration; see README.");
  }
  const authUrl = new URL(APINATOR_AUTH_URL);
  if (authUrl.username || authUrl.password || authUrl.hash ||
    (authUrl.protocol !== "https:" &&
      !(authUrl.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(authUrl.hostname)))) {
    throw new Error("APINATOR_AUTH_URL must use HTTPS except on localhost.");
  }

  const client = new ApinatorClient({
    appKey: APINATOR_KEY,
    cluster: APINATOR_CLUSTER,
    authEndpoint: authUrl.href,
    authHeaders: { Authorization: `Bearer ${APINATOR_CONTROL_PASSWORD}` },
    WebSocket,
  });
  const publisher = new ApinatorServer({
    appId: APINATOR_APP_ID,
    key: APINATOR_KEY,
    secret: APINATOR_SECRET,
    cluster: APINATOR_CLUSTER,
  });
  const channel = client.subscribe(APINATOR_CHANNEL);
  let subscribed = false;
  let stopped = false;
  let flushing = false;
  let pendingState = false;
  const pendingSync = new Map<string, SyncRequest>();

  const flush = async () => {
    if (flushing || !subscribed || stopped) return;
    flushing = true;
    try {
      while (subscribed && !stopped && (pendingState || pendingSync.size)) {
        const sync = pendingSync.values().next().value;
        if (sync) pendingSync.delete(sync.id);
        else pendingState = false;
        const payload = {
          ...getSnapshot(),
          ...(sync ? { requestId: sync.id, clientTime: sync.clientTime, serverTime: Date.now() } : {}),
        };
        try {
          await publisher.trigger({
            channel: APINATOR_CHANNEL,
            name: sync ? "sync" : "state",
            data: JSON.stringify(payload),
          });
        } catch (error) {
          console.error("Apinator state publish failed:", error);
        }
      }
    } finally {
      flushing = false;
      if (subscribed && !stopped && (pendingState || pendingSync.size)) void flush();
    }
  };

  channel.bind("realtime:subscription_succeeded", () => {
    subscribed = true;
    pendingState = true;
    void flush();
    console.log("Apinator remote control connected");
  });
  channel.bind("realtime:subscription_error", (error) => {
    subscribed = false;
    console.error("Apinator subscription failed:", error);
  });
  client.bind("state_change", (state) => {
    if (state && typeof state === "object" && "current" in state && state.current !== "connected") {
      subscribed = false;
    }
  });
  client.bind("realtime:error", (error) => console.error("Apinator connection error:", error));
  channel.bind("client-command", (command) => {
    if (!isHubCommand(command)) {
      console.error("Rejected invalid Apinator command");
      return;
    }
    try {
      applyCommand(command);
    } catch (error) {
      console.error("Apinator command failed:", error);
    }
  });
  channel.bind("client-sync", (request) => {
    if (!isSyncRequest(request)) {
      console.error("Rejected invalid Apinator sync request");
      return;
    }
    if (pendingSync.size >= 100 && !pendingSync.has(request.id)) {
      console.error("Too many pending Apinator sync requests");
      return;
    }
    pendingSync.set(request.id, request);
    void flush();
  });
  client.connect();

  return {
    publishState() {
      pendingState = true;
      void flush();
    },
    close() {
      stopped = true;
      pendingSync.clear();
      client.disconnect();
    },
  };
}
