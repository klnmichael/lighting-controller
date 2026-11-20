"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HubCommand, HubSnapshot } from "./hub-protocol";

export type HubConnectionState = "idle" | "connecting" | "connected" | "disconnected";

/** The hub's WebSocket URL, or why `hubUrl` can't be used. */
function parseHubUrl(hubUrl: string): { url: URL } | { error: string } {
  try {
    const input = hubUrl.includes("://") ? hubUrl : `http://${hubUrl}`;
    const url = new URL(input);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Use a hub origin without a path or credentials");
    }
    if (typeof window !== "undefined" && window.location.protocol === "https:" &&
      url.protocol !== "https:" && url.protocol !== "wss:") {
      throw new Error("HTTPS pages require an HTTPS or WSS hub URL");
    }
    url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
    url.pathname = "/sync";
    return { url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid hub URL" };
  }
}

interface Connection {
  /** The hub URL this status describes. */
  hubUrl: string;
  status: string;
  state: HubConnectionState;
}

export function useHub(
  hubUrl: string,
  onSnapshot: (snapshot: HubSnapshot) => void,
) {
  const [connection, setConnection] = useState<Connection>({
    hubUrl: "",
    status: "Not connected",
    state: "idle",
  });
  const [clockOffset, setClockOffset] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const snapshotRef = useRef(onSnapshot);
  useEffect(() => {
    snapshotRef.current = onSnapshot;
  });
  const target = useMemo(() => (hubUrl ? parseHubUrl(hubUrl) : undefined), [hubUrl]);

  useEffect(() => {
    if (!target || "error" in target) return;
    const { url } = target;
    const report = (status: string, state?: HubConnectionState) =>
      setConnection((current) => ({
        hubUrl,
        status,
        state: state ?? (current.hubUrl === hubUrl ? current.state : "connecting"),
      }));

    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    let socket: WebSocket;
    const connect = () => {
      report("Connecting...", "connecting");
      socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        if (stopped) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === "state" && message.lighting) {
            attempts = 0;
            readyRef.current = true;
            report("Connected", "connected");
            snapshotRef.current(message as HubSnapshot);
            if (!pingTimer) {
              const ping = () => {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type: "ping", clientTime: Date.now() }));
                }
              };
              ping();
              pingTimer = setInterval(ping, 15000);
            }
          } else if (message.type === "pong" &&
            typeof message.clientTime === "number" && typeof message.serverTime === "number") {
            setClockOffset(message.serverTime - (message.clientTime + Date.now()) / 2);
          } else if (message.type === "error") {
            if (message.lighting) {
              snapshotRef.current({ type: "state", lighting: message.lighting });
            }
            report(`Hub error: ${String(message.message)}`);
          }
        } catch (error) {
          console.error("Invalid message from hub:", error);
          report("Invalid message from hub");
        }
      };
      socket.onerror = () => {
        if (!stopped) report("Connection error", "disconnected");
      };
      socket.onclose = (event) => {
        if (stopped) return;
        readyRef.current = false;
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = undefined;
        if (socketRef.current === socket) socketRef.current = null;
        if (event.code === 1008) {
          report(event.reason || "Connection rejected", "disconnected");
          return;
        }
        report("Disconnected; reconnecting...", "disconnected");
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 15000));
      };
    };
    retryTimer = setTimeout(connect, 500);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      if (pingTimer) clearInterval(pingTimer);
      if (socketRef.current === socket) socketRef.current = null;
      readyRef.current = false;
      socket?.close();
      // This status no longer describes a live connection attempt.
      setConnection((current) =>
        current.hubUrl === hubUrl ? { ...current, hubUrl: "" } : current,
      );
    };
  }, [hubUrl, target]);

  const send = useCallback((command: HubCommand) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !readyRef.current) {
      setConnection((current) => ({
        ...current,
        status: "Not connected; command not sent",
      }));
      return false;
    }
    socket.send(JSON.stringify(command));
    return true;
  }, []);

  // Derived for states the connection effect doesn't (or hasn't yet) reported.
  let status = connection.status;
  let connectionState = connection.state;
  if (!target) {
    status = "Local preview";
    connectionState = "idle";
  } else if ("error" in target) {
    status = target.error;
    connectionState = "disconnected";
  } else if (connection.hubUrl !== hubUrl) {
    status = "Connecting...";
    connectionState = "connecting";
  }

  return { status, connectionState, clockOffset, send };
}
