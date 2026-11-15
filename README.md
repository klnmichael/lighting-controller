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
export HUB_ALLOWED_ORIGINS="https://lighting-controller.vercel.app,http://192.168.50.150:3000,http://localhost:3000"
HUB_PORT=3001 yarn hub
```

## Remote control with Apinator

Create an Apinator app and enable client events in its settings. Configure the
following environment variables in Vercel, then redeploy the client:

| Variable                       | Value                                     |
| ------------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_APINATOR_KEY`     | Apinator app key (public)                 |
| `NEXT_PUBLIC_APINATOR_CLUSTER` | App cluster: `us` or `eu`                 |
| `APINATOR_APP_ID`              | Apinator app ID                           |
| `APINATOR_KEY`                 | The same Apinator app key                 |
| `APINATOR_SECRET`              | Apinator app secret                       |
| `APINATOR_CLUSTER`             | The same app cluster                      |
| `APINATOR_CONTROL_PASSWORD`    | A separate, randomly generated passphrase |

Use the same `APINATOR_APP_ID`, `APINATOR_KEY`, `APINATOR_SECRET`,
`APINATOR_CLUSTER`, and `APINATOR_CONTROL_PASSWORD` in the hub's environment.
When started from the project root, the hub loads `.env` and `.env.local` using
Next.js environment precedence; explicitly exported variables take priority.
Also set
`APINATOR_AUTH_URL=https://lighting-controller.vercel.app/api/apinator/auth`
on the hub and restart it. For local development, the auth URL may use HTTP
only on localhost. All variables must be present to enable the relay.

Generate the passphrase once with `openssl rand -hex 32`, then configure the
same value privately on Vercel and the hub. Never commit the secret or
passphrase, put either in a `NEXT_PUBLIC_` variable, or share them in chat.
Set rate limiting for `/api/apinator/auth` at Vercel and restrict access to
your deployment. Changing the passphrase prevents new subscriptions but does
not immediately disconnect existing subscribers.

On the hosted client, select **Remote (Apinator)** and enter the passphrase.
The indicator turns green when the hub responds. The passphrase stays in memory
and must be entered again after a reload. The hub and browser need outbound
access to Apinator; no inbound tunnel to the hub is required. Without Apinator
configuration, the existing local socket connection remains available.

Apinator receives lighting state and commands. The local WebSocket remains
unauthenticated, so restrict the hub port to a trusted network or use
`HUB_HOST=127.0.0.1`. Remote clients must be able to reach the deployed auth
route, and the hub must be running for controls to work.

## TODO

- Settings
  - Light hub URL and remote passphrase
  - Editable layouts and color pallets for both sequences and accents
  - Controller mapping
- Bluetooth light hook
- Sequence builder?
