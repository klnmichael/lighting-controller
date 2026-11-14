"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HubCommand, HubSnapshot } from "./hub-protocol";

export type HubConnectionState = "idle" | "connecting" | "connected" | "disconnected";

export function useHub(
  hubUrl: string,
  onSnapshot: (snapshot: HubSnapshot) => void,
) {
  const [status, setStatus] = useState("Not connected");
  const [connectionState, setConnectionState] = useState<HubConnectionState>("idle");
  const [clockOffset, setClockOffset] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const snapshotRef = useRef(onSnapshot);
  snapshotRef.current = onSnapshot;

  useEffect(() => {
    if (!hubUrl) {
      setStatus("Local preview");
      setConnectionState("idle");
      return;
    }
    let url: URL;
    try {
      const input = hubUrl.includes("://") ? hubUrl : `http://${hubUrl}`;
      url = new URL(input);
      if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol) ||
        url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        throw new Error("Use a hub origin without a path or credentials");
      }
      if (window.location.protocol === "https:" &&
        url.protocol !== "https:" && url.protocol !== "wss:") {
        throw new Error("HTTPS pages require an HTTPS or WSS hub URL");
      }
      url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
      url.pathname = "/sync";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid hub URL");
      setConnectionState("disconnected");
      return;
    }

    setConnectionState("connecting");
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    let socket: WebSocket;
    const connect = () => {
      setStatus("Connecting...");
      setConnectionState("connecting");
      socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        if (stopped) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === "state" && message.lighting) {
            attempts = 0;
            readyRef.current = true;
            setStatus("Connected");
            setConnectionState("connected");
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
            setStatus(`Hub error: ${String(message.message)}`);
          }
        } catch (error) {
          console.error("Invalid message from hub:", error);
          setStatus("Invalid message from hub");
        }
      };
      socket.onerror = () => {
        if (!stopped) {
          setStatus("Connection error");
          setConnectionState("disconnected");
        }
      };
      socket.onclose = (event) => {
        if (stopped) return;
        readyRef.current = false;
        setConnectionState("disconnected");
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = undefined;
        if (socketRef.current === socket) socketRef.current = null;
        if (event.code === 1008) {
          setStatus(event.reason || "Connection rejected");
          return;
        }
        setStatus("Disconnected; reconnecting...");
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
    };
  }, [hubUrl]);

  const send = useCallback((command: HubCommand) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !readyRef.current) {
      setStatus("Not connected; command not sent");
      return false;
    }
    socket.send(JSON.stringify(command));
    return true;
  }, []);

  return { status, connectionState, clockOffset, send };
}
