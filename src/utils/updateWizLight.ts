import dgram from "dgram";
import type { WizLight } from "../types/global.ts";
import { IPS } from "../lib/constants.ts";

export const updateWizLight = async (ip: number, config: WizLight) => {
  const params: WizLight = {
    // state: true,
    // speed: 0,
    // fade: 0,
    // "fade-in": 0,
    // "fade-out": 0,
  };

  if (config.state !== undefined) {
    params.state = config.state;
  }

  if (config.dimming !== undefined) {
    params.dimming = config.dimming;
  }

  if (config.color) {
    params.r = config.color[0];
    params.g = config.color[1];
    params.b = config.color[2];
    if (
      config.color.reduce(
        (accumulator: number, currentValue: number) =>
          accumulator + currentValue,
        0,
      ) ===
      255 * 3
    ) {
      params.temp = 5000;
      params.dimming =
        config.dimming !== undefined && config.dimming < 35
          ? config.dimming
          : 35;
    }
  }

  // console.log(`192.168.1.${ip}`, params);

  const client = dgram.createSocket("udp4");
  const buffer = Buffer.from(
    JSON.stringify({
      method: "setPilot",
      // env: "pro",
      params,
    }),
  );

  client.send(buffer, 0, buffer.length, 38899, `192.168.1.${ip}`, () => {
    client.close();
  });
};
