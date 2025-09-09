import { NextRequest } from "next/server";
import dgram from "dgram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const params: {
      state?: boolean;
      w?: number;
      temp?: number;
      speed?: number;
      fade?: number;
      "fade-in"?: number;
      "fade-out"?: number;
      dimming?: number;
      r?: number;
      g?: number;
      b?: number;
    } = {
      state: body.state || true,
      // w: body.color?.reduce() === 255 * 3 ? 255 : 0,
      // temp: 2700,
      speed: 20,
      fade: 20,
      "fade-in": 20,
      "fade-out": 20,
    };

    if (body.dimming || body.dimming === 0) {
      params.dimming = body.dimming < 10 ? 10 : body.dimming;
    }

    if (body.color) {
      params.r = body.color[0];
      params.g = body.color[1];
      params.b = body.color[2];
      if (
        body.color.reduce(
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

    const message = {
      method: "setPilot",
      env: "pro",
      params,
    };

    const IP = `192.168.1.${body.ip}`;

    const client = dgram.createSocket("udp4");
    const buffer = Buffer.from(JSON.stringify(message));

    await client.send(buffer, 0, buffer.length, 38899, IP, (e) => {
      if (e) {
        // console.error(e);
      } else {
        // console.log(IP, message);
      }
      client.close();
    });

    return new Response("", { status: 200 });
  } catch (e) {
    console.log(e);
    return new Response("", { status: 500 });
  }
}
