import dgram from "dgram";
import type { WizLight } from "../types/global.ts";
// import { IPS } from "../lib/constants.ts";

const buildParams = (config: WizLight): WizLight => {
  const params: WizLight = {
    // state: true,
    // speed: 0,
    // fade: 0,
    // "fade-in": 1000,
    // "fade-out": 1000,
  };

  if (config.state !== undefined) {
    params.state = config.state;
  }

  if (config.dimming !== undefined) {
    params.dimming = 100 - config.dimming * 100;
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

  return params;
};

export const updateWizLights = async (
  updates: { ip: number; config: WizLight }[],
) => {
  if (!updates.length) return;

  const client = dgram.createSocket("udp4");

  await Promise.all(
    updates.map(({ ip, config }) => {
      const params = buildParams(config);
      // console.log(ip, params);

      const buffer = Buffer.from(
        JSON.stringify({
          method: "setPilot",
          // env: "pro",
          params,
        }),
      );

      return new Promise<void>((resolve) => {
        client.send(buffer, 0, buffer.length, 38899, `192.168.50.${ip}`, () => {
          resolve();
        });
      });
    }),
  );

  client.close();
};

export const updateWizLight = async (ip: number, config: WizLight) => {
  await updateWizLights([{ ip, config }]);
};
