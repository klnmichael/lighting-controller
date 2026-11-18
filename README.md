# Light Controller (WiZ)

## Requirements

- [Node.js](https://nodejs.org/en)
- [yarn](https://www.npmjs.com/package/yarn)
- [nodemon](https://www.npmjs.com/package/nodemon)
- [ts-node](https://www.npmjs.com/package/ts-node)

## Getting Started

```bash
yarn install
yarn dev
```

## Start Hub

The hub runs on the same local network as the lights. It listens on all IPv4
interfaces (`0.0.0.0:3000`) by default; use a different port if Next.js is using 3000.
Configure the exact browser origin(s):

```bash
export HUB_ALLOWED_ORIGINS="https://lighting-controller.vercel.app,http://localhost:3000"
HUB_PORT=3001 yarn hub
```

## Lights

Every light is listed in `LIGHTS` in `src/lib/constants.ts` with its brand,
address and floor plan position. Per-brand latency and update rate live in
`LIGHT_BRANDS` next to it.

### Govee

1. Enable **LAN Control** for each light in the Govee Home app.
2. Add the light to `LIGHTS` with `brand: "govee"`, an unused `id`, and its
   `device` ID and/or `ip`. Lights with a `device` ID are found by LAN scan,
   so their IP can change. Unknown Govee devices that answer the scan are
   logged by the hub with their device ID, to copy into `LIGHTS`.
3. The hub needs UDP port 4002 free (only one Govee LAN client per machine),
   and multicast to `239.255.255.250:4001` allowed on the network.

Govee's LAN API has no transition speed, so the hub renders fades itself at
up to 33 frames per second, in whole frames per 16th note so beats land
exactly on a frame. Brightness is folded into the color, so each frame is one
packet per light.

## Local socket security

The hub's local WebSocket is unauthenticated, so restrict the hub port to a
trusted network or use `HUB_HOST=127.0.0.1`.

## TODO

- Settings
  - Light hub URL
  - Editable layouts and color pallets for both sequences and accents
  - Controller mapping
- Bluetooth light hook
- Sequence builder?
