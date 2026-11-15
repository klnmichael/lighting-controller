"use client";

import { Apinator } from "@apinator/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { APINATOR_CHANNEL } from "./apinator-protocol";
import { isHubCommand, isHubSnapshot, type HubCommand, type HubSnapshot } from "./hub-protocol";
import type { HubConnectionState } from "./use-hub";

const SYNC_INTERVAL_MS = 60000;
const COMMAND_THROTTLE_MS = 150;
// Slider and joystick commands only need their latest value delivered.
const CONTINUOUS_COMMANDS = new Set<HubCommand["type"]>([
  "bpm", "sequenceColor", "sequenceDimming", "accentColor", "accentDimming",
]);

export function useApinator(enabled: boolean, password: string, onSnapshot: (snapshot: HubSnapshot) => void) {
  const [status, setStatus] = useState("Enter remote passphrase");
  const [connectionState, setConnectionState] = useState<HubConnectionState>("idle");
  const [clockOffset, setClockOffset] = useState(0);
  const channelRef = useRef<ReturnType<Apinator["subscribe"]> | null>(null);
  const readyRef = useRef(false);
  const pendingCommandsRef = useRef(new Map<HubCommand["type"], HubCommand>());
  const lastCommandAtRef = useRef(0);
  const commandTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const snapshotRef = useRef(onSnapshot);
  snapshotRef.current = onSnapshot;

  useEffect(() => {
    if (!enabled) return;
    if (!password) {
      setStatus("Enter remote passphrase");
      setConnectionState("idle");
      return;
    }
    const appKey = process.env.NEXT_PUBLIC_APINATOR_KEY;
    const cluster = process.env.NEXT_PUBLIC_APINATOR_CLUSTER;
    if (!appKey || !cluster || !["us", "eu"].includes(cluster)) {
      setStatus("Apinator is not configured");
      setConnectionState("disconnected");
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pendingId = "";
    let client: Apinator;
    try {
      client = new Apinator({
        appKey,
        cluster,
        authEndpoint: "/api/apinator/auth",
        authHeaders: { Authorization: `Bearer ${password}` },
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Apinator configuration error");
      setConnectionState("disconnected");
      return;
    }
    const channel = client.subscribe(APINATOR_CHANNEL);
    channelRef.current = channel;
    const requestSync = () => {
      if (!channel.subscribed) return;
      const request = { id: crypto.randomUUID(), clientTime: Date.now() };
      pendingId = request.id;
      try {
        channel.trigger("client-sync", request);
      } catch (error) {
        readyRef.current = false;
        setConnectionState("disconnected");
        setStatus(error instanceof Error ? error.message : "Unable to request hub state");
        return;
      }
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        readyRef.current = false;
        setConnectionState("disconnected");
        setStatus("Hub not responding");
      }, 10000);
    };
    const acceptSnapshot = (value: unknown): value is HubSnapshot => {
      if (!isHubSnapshot(value)) {
        setStatus("Invalid state from hub");
        return false;
      }
      snapshotRef.current(value);
      return true;
    };

    channel.bind("realtime:subscription_succeeded", () => {
      if (stopped) return;
      setStatus("Waiting for hub...");
      setConnectionState("connecting");
      requestSync();
      if (timer) clearInterval(timer);
      timer = setInterval(requestSync, SYNC_INTERVAL_MS);
    });
    channel.bind("realtime:subscription_error", (error) => {
      if (stopped) return;
      console.error("Apinator subscription failed:", error);
      readyRef.current = false;
      setStatus("Remote authorization failed");
      setConnectionState("disconnected");
    });
    channel.bind("state", (value) => {
      if (!stopped) acceptSnapshot(value);
    });
    channel.bind("sync", (value) => {
      if (stopped || !acceptSnapshot(value)) return;
      // Replies to other clients' syncs still carry current state.
      if (!("requestId" in value) || value.requestId !== pendingId ||
        !("clientTime" in value) || typeof value.clientTime !== "number" ||
        !("serverTime" in value) || typeof value.serverTime !== "number") return;
      if (timeout) clearTimeout(timeout);
      setClockOffset(value.serverTime - (value.clientTime + Date.now()) / 2);
      readyRef.current = true;
      setStatus("Connected");
      setConnectionState("connected");
    });
    client.bind("state_change", (value) => {
      if (stopped || !value || typeof value !== "object" || !("current" in value)) return;
      if (value.current !== "connected") {
        readyRef.current = false;
        setConnectionState(value.current === "connecting" ? "connecting" : "disconnected");
        setStatus(value.current === "connecting" ? "Connecting..." : "Remote connection unavailable");
        if (timer) clearInterval(timer);
        if (timeout) clearTimeout(timeout);
      }
    });
    client.bind("realtime:error", (error) => {
      if (stopped) return;
      console.error("Apinator connection error:", error);
      readyRef.current = false;
      setStatus("Apinator connection error");
      setConnectionState("disconnected");
    });
    setStatus("Connecting...");
    setConnectionState("connecting");
    const connectTimer = setTimeout(() => client.connect(), 500);
    return () => {
      stopped = true;
      readyRef.current = false;
      clearTimeout(connectTimer);
      if (commandTimerRef.current) clearTimeout(commandTimerRef.current);
      commandTimerRef.current = undefined;
      pendingCommandsRef.current.clear();
      if (timer) clearInterval(timer);
      if (timeout) clearTimeout(timeout);
      if (channelRef.current === channel) channelRef.current = null;
      client.disconnect();
    };
  }, [enabled, password]);

  const trigger = useCallback((command: HubCommand) => {
    const channel = channelRef.current;
    if (!channel?.subscribed || !readyRef.current) {
      setStatus("Hub not connected; command not sent");
      return false;
    }
    try {
      channel.trigger("client-command", command);
      lastCommandAtRef.current = Date.now();
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send command");
      return false;
    }
  }, []);

  const flushCommands = useCallback(() => {
    if (commandTimerRef.current) clearTimeout(commandTimerRef.current);
    commandTimerRef.current = undefined;
    const pending = [...pendingCommandsRef.current.values()];
    pendingCommandsRef.current.clear();
    for (const command of pending) trigger(command);
  }, [trigger]);

  const send = useCallback((command: HubCommand) => {
    const channel = channelRef.current;
    if (!channel?.subscribed || !readyRef.current) {
      setStatus("Hub not connected; command not sent");
      return false;
    }
    if (!isHubCommand(command)) {
      setStatus("Invalid command");
      return false;
    }
    if (CONTINUOUS_COMMANDS.has(command.type)) {
      const wait = lastCommandAtRef.current + COMMAND_THROTTLE_MS - Date.now();
      if (wait > 0 || commandTimerRef.current) {
        pendingCommandsRef.current.set(command.type, command);
        commandTimerRef.current ??= setTimeout(flushCommands, Math.max(wait, 0));
        return true;
      }
      return trigger(command);
    }
    // Keep ordering: deliver queued slider values before discrete commands.
    flushCommands();
    return trigger(command);
  }, [flushCommands, trigger]);

  return { status, connectionState, clockOffset, send };
}
