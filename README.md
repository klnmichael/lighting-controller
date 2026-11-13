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

With sync enabled, the touchpad selects from `ACTIVE_COLORS` in a 5-column,
2-row grid: array order runs left to right across the top row, then the bottom
row. Touch and slide to preview the color on the controller without changing
the sequences. Lift your finger to apply the last previewed color to sequences
and switch to custom-color mode, including on the connected hub. The light bar
then resumes following the illuminated lights. With multiple fingers, the first
finger controls the preview; selection commits when all fingers lift.
Disconnecting cancels an unfinished selection.

Click the touchpad to activate random sequence-color mode (without changing
the sequence effect). Clicking cancels the current touch selection, so lifting
your finger afterward does not restore custom-color mode. Touchpad clicks work
without light bar sync permission.

## Start Hub

```bash
yarn hub
```
