import assert from "node:assert/strict";
import dgram from "node:dgram";
import { EventEmitter, once } from "node:events";
import test from "node:test";
import { IPS } from "../src/lib/constants.ts";
import type { WizLight } from "../src/types/global.ts";
import { createWizSender } from "./wiz-sender.ts";

class SlowSocket extends EventEmitter {
  sends: {
    params: WizLight;
    address: string;
    complete: (error: Error | null) => void;
  }[] = [];
  closes = 0;

  bind() {}

  send(
    buffer: Uint8Array,
    port: number,
    address: string,
    complete: (error: Error | null) => void,
  ) {
    assert.equal(port, 38899);
    const message = JSON.parse(Buffer.from(buffer).toString());
    assert.equal(message.method, "setPilot");
    this.sends.push({ params: message.params, address, complete });
  }

  close() {
    this.closes++;
  }
}

test("10,000 frames stay bounded to one in-flight and one latest update per light", () => {
  const socket = new SlowSocket();
  const sender = createWizSender(socket);
  try {
    for (let frame = 0; frame < 10_000; frame++) {
      for (const ip of IPS) {
        sender.update(ip, { dimming: frame % 100, r: frame % 256 });
      }
    }
    assert.equal(socket.sends.length, IPS.length);
    socket.sends.slice().forEach(({ complete }) => complete(null));
    assert.equal(socket.sends.length, IPS.length * 2);
    for (const send of socket.sends.slice(IPS.length)) {
      assert.deepEqual(send.params, { dimming: 99, r: 15 });
    }
    socket.sends.slice(IPS.length).forEach(({ complete }) => complete(null));
    assert.equal(socket.sends.length, IPS.length * 2);
    assert.equal(socket.listenerCount("error"), 1);
  } finally {
    sender.close();
  }
});

test("latest frames replace stale color modes and a blocked light does not stall others", () => {
  const socket = new SlowSocket();
  const sender = createWizSender(socket);
  try {
    sender.update(IPS[0], { dimming: 10 });
    sender.update(IPS[0], { r: 255, g: 255, b: 255, temp: 5000, dimming: 20 });
    sender.update(IPS[0], { r: 255, g: 0, b: 0, dimming: 30 });
    sender.update(IPS[1], { dimming: 40 });
    assert.equal(socket.sends.length, 2);
    socket.sends[1].complete(null);
    sender.update(IPS[1], { dimming: 50 });
    assert.equal(socket.sends[2].address, `192.168.1.${IPS[1]}`);
    socket.sends[0].complete(null);
    assert.deepEqual(socket.sends[3].params, { r: 255, g: 0, b: 0, dimming: 30 });
  } finally {
    sender.close();
  }
});

test("stopping discards pending work, resuming sends again, and closing is final", () => {
  const socket = new SlowSocket();
  const sender = createWizSender(socket);
  sender.update(IPS[0], { dimming: 10 });
  sender.update(IPS[0], { dimming: 20 });
  sender.clearPending();
  socket.sends[0].complete(null);
  assert.equal(socket.sends.length, 1);
  sender.update(IPS[0], { dimming: 30 });
  sender.update(IPS[0], { dimming: 40 });
  sender.close();
  sender.close();
  socket.sends[1].complete(null);
  assert.equal(socket.sends.length, 2);
  assert.equal(socket.closes, 1);
  assert.throws(() => sender.update(IPS[0], {}), /closed/);
});

test("send failures are reported and release backpressure; socket errors are handled", (t) => {
  const socket = new SlowSocket();
  const sender = createWizSender(socket);
  const log = t.mock.method(console, "error", () => {});
  const failure = new Error("send failed");
  try {
    sender.update(IPS[0], { dimming: 10 });
    sender.update(IPS[0], { dimming: 20 });
    socket.sends[0].complete(failure);
    assert.equal(socket.sends.length, 2);
    assert.deepEqual(socket.sends[1].params, { dimming: 20 });
    socket.sends[1].complete(null);
    const send = t.mock.method(socket, "send", () => {
      throw failure;
    });
    sender.update(IPS[0], { dimming: 30 });
    send.mock.restore();
    sender.update(IPS[0], { dimming: 40 });
    assert.equal(socket.sends.length, 3);
    socket.emit("error", failure);
    assert.equal(log.mock.callCount(), 3);
    for (const call of log.mock.calls) assert.equal(call.arguments[1], failure);
  } finally {
    sender.close();
  }
});

test("real UDP sends reuse the same socket, retain repeated commands, and close cleanly", async (t) => {
  const receiver = dgram.createSocket("udp4");
  t.after(() => receiver.close());
  receiver.bind(0, "127.0.0.1");
  await once(receiver, "listening");
  const socket = dgram.createSocket("udp4");
  const send = socket.send.bind(socket);
  const port = receiver.address().port;
  // Redirect only the destination so this test never contacts physical lights.
  t.mock.method(
    socket,
    "send",
    (
      buffer: Uint8Array,
      _port: number,
      _address: string,
      callback: (error: Error | null) => void,
    ) => {
      send(buffer, port, "127.0.0.1", callback);
    },
  );
  const sender = createWizSender(socket);
  t.after(() => sender.close());
  await once(socket, "listening");
  const sourcePort = socket.address().port;
  const signal = AbortSignal.timeout(2000);
  for (let frame = 0; frame < 50; frame++) {
    const received = once(receiver, "message", { signal });
    sender.update(IPS[0], { dimming: 50 });
    const [buffer, remote] = await received;
    assert.equal(remote.port, sourcePort);
    assert.deepEqual(JSON.parse(buffer.toString()), {
      method: "setPilot",
      params: { dimming: 50 },
    });
  }
  const closed = once(socket, "close", { signal });
  sender.close();
  await closed;
});

test("the socket can close while its initial bind is still pending", async () => {
  const socket = dgram.createSocket("udp4");
  const sender = createWizSender(socket);
  const closed = once(socket, "close", { signal: AbortSignal.timeout(2000) });
  sender.close();
  await closed;
});
