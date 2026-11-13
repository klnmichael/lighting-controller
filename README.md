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

The **3D** control opens a live room preview inside the main page. Use **CLOSE**
or Escape to return to the 2D map; a separate browser popup is not required.

## PS5 controller light bar

In Chrome or Edge on HTTPS or localhost, open **PS5 controls** (or **Controller
connected**) and click **Sync light bar**, then grant access to your DualSense.
USB and Bluetooth connections are supported, including DualSense Edge.
Button and joystick controls do not require this additional permission.

The light bar follows the most common RGB color among illuminated lights.
Unlit and black lights are ignored; ties use the first color in light order.
When all lights are dark, the light bar turns off. Updates are checked every
100 ms and sent only when the majority color changes. After a disconnect or
reload, enable sync again.

With sync enabled, the touchpad maps its top row left to right to Pulsate,
Wave Radiate Out, Wave Kitchen Wall, Circle 1, and Circle 2. The bottom row maps
left to right to 2/4/8 Drum and 2/4/8 Snare. Touch and slide, then lift to
select. With multiple fingers, the first finger controls the selection; it
commits when all fingers lift. Disconnecting cancels an unfinished selection.
Open **Show touchpad map** in the controller dropdown to see the mapped zones.

Click the touchpad to clear the active accent without changing the sequence.
Clicking cancels the current touch selection, so lifting your finger afterward
does not trigger a mapped effect. Touchpad clicks work without light bar sync
permission.

## Joystick colors

The left stick selects the sequence color; the right stick selects the accent
color (replacing right-stick camera orbit). Each maps `ACTIVE_COLORS` clockwise
around a circle, with the first color at up and equally spaced color sectors.
Tilt a stick to preview its color; return it to the center to apply that color
in custom-color mode, including on the connected hub. A 15% radial dead zone
prevents drift from selecting colors.

Press L3 for random sequence colors or R3 for random accent colors, without
changing the active effects. A click cancels that stick's pending selection
until it is released and centered. Disconnecting also cancels pending selections.
Color selection works without WebHID permission; controller light-bar previews
require **Sync light bar**. While tilted, even a stationary stick keeps the
preview active. If both sticks are tilted, the right stick's preview takes
priority. Normal light-bar sync resumes when all previews end.

## Start Hub

```bash
yarn hub
```
