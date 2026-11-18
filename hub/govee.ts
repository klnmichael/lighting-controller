import dgram from "node:dgram";
import type { Color } from "../src/types/global.ts";
import type { LightFixture } from "../src/lib/constants.ts";
import { LIGHT_BRANDS } from "../src/lib/constants.ts";
import type { LightSample } from "../src/lib/light-map.ts";
import type { LightDriver } from "../src/lib/light-output.ts";
import { createUdpSender } from "./udp-sender.ts";

// Govee LAN API: scan via multicast to 4001, replies arrive on 4002, and
// commands go to the device on 4003. Only one process per host can bind 4002.
const MULTICAST_ADDRESS = "239.255.255.250";
const SCAN_PORT = 4001;
const LISTEN_PORT = 4002;
const CONTROL_PORT = 4003;
// Some firmware only accepts LAN commands after a recent scan.
const SCAN_INTERVAL = 30000;

const command = (cmd: string, data: unknown) =>
  Buffer.from(JSON.stringify({ msg: { cmd, data } }));

const SCAN = command("scan", { account_topic: "reserve" });

interface ScanReply {
  ip: string;
  device: string;
  sku?: string;
}

const parseScanReply = (data: Buffer): ScanReply | undefined => {
  try {
    const message = JSON.parse(data.toString());
    const reply = message?.msg?.data;
    if (
      message?.msg?.cmd === "scan" &&
      typeof reply?.ip === "string" &&
      typeof reply?.device === "string"
    ) {
      return reply;
    }
  } catch {
    // Not a Govee scan reply.
  }
  return undefined;
};

export const createGoveeSender = (fixtures: readonly LightFixture[]) => {
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  const udp = createUdpSender(socket);
  const addresses = new Map<number, string>();
  const byDevice = new Map<string, number>();
  for (const light of fixtures) {
    if (light.ip) addresses.set(light.id, light.ip);
    if (light.device) byDevice.set(light.device.toUpperCase(), light.id);
  }
  // Lights that have been switched on at full brightness this session.
  const ready = new Set<number>();
  const reported = new Set<string>();

  // Newer firmware may ignore multicast but answer a subnet broadcast.
  const broadcasts = () =>
    new Set([...addresses.values()].map((ip) => ip.replace(/\.\d+$/, ".255")));

  const scan = () => {
    for (const address of [MULTICAST_ADDRESS, ...broadcasts()]) {
      socket.send(SCAN, SCAN_PORT, address, () => {});
    }
  };

  socket.on("error", (error) => console.error("Govee UDP error:", error));
  socket.on("message", (data) => {
    const reply = parseScanReply(data);
    if (!reply) return;
    const id = byDevice.get(reply.device.toUpperCase());
    if (id !== undefined) {
      if (addresses.get(id) !== reply.ip) {
        addresses.set(id, reply.ip);
        ready.delete(id);
        console.log(`Govee light ${id} found at ${reply.ip}`);
      }
    } else if (
      ![...addresses.values()].includes(reply.ip) &&
      !reported.has(reply.device)
    ) {
      reported.add(reply.device);
      console.log(
        `Govee ${reply.sku ?? "device"} ${reply.device} at ${reply.ip} is not in LIGHTS`,
      );
    }
  });
  socket.bind(LISTEN_PORT, () => {
    socket.setBroadcast(true);
    scan();
  });
  const scanTimer = setInterval(scan, SCAN_INTERVAL);

  return {
    /** Returns false while the light's address is still unknown. */
    update(id: number, color: Color): boolean {
      const ip = addresses.get(id);
      if (!ip) return false;
      if (!ready.has(id)) {
        // Brightness stays at 100; dimming is folded into the color so each
        // frame is a single packet.
        ready.add(id);
        udp.send(ip, CONTROL_PORT, command("turn", { value: 1 }));
        udp.send(ip, CONTROL_PORT, command("brightness", { value: 100 }));
      }
      udp.update(
        ip,
        CONTROL_PORT,
        command("colorwc", {
          color: { r: color[0], g: color[1], b: color[2] },
          colorTemInKelvin: 0,
        }),
      );
      return true;
    },
    /** Drop queued frames and re-initialise lights on the next update. */
    reset() {
      udp.clearPending();
      ready.clear();
    },
    close() {
      clearInterval(scanTimer);
      udp.close();
    },
  };
};

export type GoveeSender = ReturnType<typeof createGoveeSender>;

export const encodeGovee = ({ color, brightness }: LightSample): Color =>
  color.map((channel) => Math.round(channel * brightness)) as Color;

export const createGoveeDriver = (
  sender: GoveeSender,
  fixtures: readonly LightFixture[],
): LightDriver<Color> => ({
  name: "govee",
  lights: fixtures.map((light) => light.id),
  ...LIGHT_BRANDS.govee,
  encode: encodeGovee,
  send: (id, color) => sender.update(id, color),
});
