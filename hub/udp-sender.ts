export interface LightSocket {
  send(
    buffer: Uint8Array,
    port: number,
    address: string,
    callback: (error: Error | null) => void,
  ): void;
  close(): void;
}

interface Message {
  port: number;
  buffer: Uint8Array;
  /** Frames may be replaced by a newer frame before they are sent. */
  frame: boolean;
}

/**
 * UDP sender with one message in flight per address. Frames coalesce, so a
 * slow socket drops stale frames instead of building up a backlog, while
 * one-off commands stay queued in order.
 */
export const createUdpSender = (socket: LightSocket) => {
  const queues = new Map<string, Message[]>();
  const inFlight = new Set<string>();
  let closed = false;

  const flush = (address: string) => {
    if (closed || inFlight.has(address)) return;
    const message = queues.get(address)?.shift();
    if (!message) return;
    inFlight.add(address);

    const complete = () => {
      inFlight.delete(address);
      flush(address);
    };
    try {
      socket.send(message.buffer, message.port, address, complete);
    } catch {
      complete();
    }
  };

  const enqueue = (address: string, message: Message) => {
    if (closed) throw new Error("UDP sender is closed");
    let queue = queues.get(address);
    if (!queue) {
      queue = [];
      queues.set(address, queue);
    }
    if (message.frame && queue[queue.length - 1]?.frame) queue.pop();
    queue.push(message);
    flush(address);
  };

  return {
    /** Queue a command; it is always sent, in order. */
    send(address: string, port: number, buffer: Uint8Array) {
      enqueue(address, { port, buffer, frame: false });
    },
    /** Send a frame; replaces a frame for this address that hasn't gone yet. */
    update(address: string, port: number, buffer: Uint8Array) {
      enqueue(address, { port, buffer, frame: true });
    },
    clearPending() {
      queues.clear();
    },
    close() {
      if (closed) return;
      closed = true;
      queues.clear();
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
