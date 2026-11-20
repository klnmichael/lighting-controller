import dgram from "node:dgram";
import type { WizLight } from "../src/types/global.ts";
import type { LightFixture } from "../src/lib/constants.ts";
import { LIGHT_BRANDS } from "../src/lib/constants.ts";
import type { LightSample } from "../src/lib/light-map.ts";
import type { LightDriver } from "../src/lib/light-output.ts";
import { createUdpSender } from "./udp-sender.ts";

const WIZ_PORT = 38899;

export const createWizSender = (socket = dgram.createSocket("udp4")) => {
  // Without a listener, a socket error would crash the hub. Per-packet send
  // failures (e.g. an unplugged bulb) go to the send callback, not here.
  socket.on("error", (error) => {
    console.error("WiZ UDP socket error:", error);
  });
  socket.bind();
  const udp = createUdpSender(socket);
  return {
    update(ip: string, params: WizLight) {
      // These are resolved frame parameters, not patches to earlier frames.
      udp.update(
        ip,
        WIZ_PORT,
        Buffer.from(JSON.stringify({ method: "setPilot", params })),
      );
    },
    clearPending: udp.clearPending,
    close: udp.close,
  };
};

export type WizSender = ReturnType<typeof createWizSender>;

export const encodeWiz = ({ color, brightness }: LightSample): WizLight => {
  const [r, g, b] = color.map(Math.round);
  let dimming = brightness * 100;
  // Full white is much brighter than saturated colors; tame it.
  if (r + g + b === 255 * 3) dimming *= 0.75;
  return { r, g, b, dimming: Math.round(dimming) };
};

export const createWizDriver = (
  sender: WizSender,
  fixtures: readonly LightFixture[],
): LightDriver<WizLight> => {
  const addresses = new Map(
    fixtures.flatMap((light) => (light.ip ? [[light.id, light.ip]] : [])),
  );
  return {
    name: "wiz",
    lights: [...addresses.keys()],
    ...LIGHT_BRANDS.wiz,
    encode: encodeWiz,
    send: (id, params) => sender.update(addresses.get(id)!, params),
  };
};
