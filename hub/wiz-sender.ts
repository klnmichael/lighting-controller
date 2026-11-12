import dgram from "node:dgram";
import type { WizLight } from "../src/types/global.ts";

interface LightSocket {
  bind(): void;
  send(
    buffer: Uint8Array,
    port: number,
    address: string,
    callback: (error: Error | null) => void,
  ): void;
  on(event: "error", listener: (error: Error) => void): void;
  close(): void;
}

export const createWizSender = (
  socket: LightSocket = dgram.createSocket("udp4"),
) => {
  const pending = new Map<number, WizLight>();
  const inFlight = new Set<number>();
  let closed = false;

  socket.on("error", (error) => {
    console.error("WiZ UDP socket error:", error);
  });
  socket.bind();

  const flush = (ip: number) => {
    if (closed || inFlight.has(ip)) return;
    const params = pending.get(ip);
    if (!params) return;
    pending.delete(ip);
    inFlight.add(ip);

    const complete = (error: unknown) => {
      inFlight.delete(ip);
      if (error)
        console.error(
          `WiZ send failed for ${process.env.NEXT_PUBLIC_LOCAL_IP}.${ip}:`,
          error,
        );
      flush(ip);
    };

    try {
      socket.send(
        Buffer.from(JSON.stringify({ method: "setPilot", params })),
        38899,
        `${process.env.NEXT_PUBLIC_LOCAL_IP}.${ip}`,
        complete,
      );
    } catch (error) {
      complete(error);
    }
  };

  return {
    update(ip: number, params: WizLight) {
      if (closed) throw new Error("WiZ sender is closed");
      // These are resolved frame parameters, not patches to earlier frames.
      pending.set(ip, { ...params });
      flush(ip);
    },
    clearPending() {
      pending.clear();
    },
    close() {
      if (closed) return;
      closed = true;
      pending.clear();
      inFlight.clear();
      try {
        socket.close();
      } catch (error) {
        // A failed bind can leave the socket already stopped.
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "ERR_SOCKET_DGRAM_NOT_RUNNING"
        ) {
          throw error;
        }
      }
    },
  };
};
