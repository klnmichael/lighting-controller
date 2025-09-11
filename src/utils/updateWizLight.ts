import dgram from "dgram";
import type { WizLight } from "../types/global.ts";
import { IPS } from "../lib/constants.ts";

export const updateWizLight = async (index: number, config: WizLight) => {
  const params: WizLight = {
    // speed: 0,
    // fade: 0,
    // "fade-in": 0,
    // "fade-out": 0,
  };

  if (config.state !== undefined) {
    params.state = config.state;
  }

  if (config.color) {
    params.r = config.color[0];
    params.g = config.color[1];
    params.b = config.color[2];
    if (
      config.color.reduce(
        (accumulator: number, currentValue: number) =>
          accumulator + currentValue,
        0
      ) ===
      255 * 3
    ) {
      params.temp = 5000;
      params.dimming = 50;
    }
  }

  if (config.dimming || config.dimming === 0) {
    params.dimming = config.dimming < 10 ? 10 : config.dimming;
  }

  const message = {
    method: "setPilot",
    env: "pro",
    params,
  };

  const ip = `192.168.1.${IPS[index]}`;

  console.log(ip, params);

  // const client = dgram.createSocket("udp4");
  // const buffer = Buffer.from(JSON.stringify(message));

  // await client.send(buffer, 0, buffer.length, 38899, ip, (e) => {
  //   if (e) {
  //     console.error(e);
  //   } else {
  //     console.log(ip, message);
  //   }
  //   client.close();
  // });
};
