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

Sequence, accent, and color buttons pulse with an inset shadow while their
selection is queued for the next four-beat boundary. Applied selections have a
steady inset shadow. Reduced-motion preferences disable the pulse.

## Start Hub

The hub runs on the same local network as the lights. It listens on all IPv4
interfaces (`0.0.0.0:3000`) by default; use a different port if Next.js is using 3000.
Configure the exact browser origin(s):

```bash
export HUB_ALLOWED_ORIGINS="http://192.168.50.150:3000,http://localhost:3000"
HUB_PORT=3001 yarn hub
```

## TODO

- Settings overlay
  - Light hub URL
  - Color pallets for both sequences and accents
  - Controller mapping
  - Sequence builder?
- Bluetooth light timeline
