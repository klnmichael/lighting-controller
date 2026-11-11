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

```bash
yarn hub
```

The hub reuses one UDP socket for WiZ commands. Each light has at most one send
in flight and one pending update; under backpressure, newer values replace stale
pending frames rather than building an animation backlog. A slow send to one
light does not block the others. Stopping
playback discards pending updates; commands already handed to UDP cannot be recalled.
Send/socket errors are logged, and shutdown closes the socket.

A completed send means the local UDP stack accepted the command, not that the
light acknowledged or applied it. Packet loss, Wi-Fi congestion, and bulb firmware
can still cause delays. Repeated timeline commands are intentionally retained
during normal playback rather than deduplicated, so a lost packet can be refreshed.

Run the sender's backpressure, error, and socket-lifecycle regression tests:

```bash
node --test hub/wiz-sender.test.ts
```

## Sequence timelines

Sequences are defined in `src/lib/sequences/index.ts`. Each outer timeline
entry is one quarter-beat (four entries per beat); an empty entry holds the
previous state. Updates within an entry run in order. Omit `ips` to target all
lights, or use `ips: [IPS[index]]` to target one configured IP suffix.
`dimming: 0` is fully bright and `dimming: 1` is dark.

The **Circle 1** sequence is a clockwise loading animation following `OUTLINE`.
Its 16 entries repeat every four beats (two seconds at 120 BPM), with a bright
head and a four-light fading tail. Fractional head positions interpolate across
the 17 perimeter lights, including the wraparound. Every frame first darkens
all lights, then applies per-IP dimming to the perimeter; other lights stay dark
unless an accent overrides them. Use full sequence brightness with no accent
to preview the pattern.

**Circle 2** uses the same speed and fading tail, with two streaks moving
clockwise half a perimeter apart. Each streak completes a rotation every four
beats; their identical combined pattern repeats every two beats. The half-loop
offset is fractional so the streaks remain opposite on the 17-light perimeter.

**1 Circle CCW** (`circle1CounterClockwise`) and **2 Circle CCW**
(`circle2CounterClockwise`) move counter-clockwise at the same speed. They mirror
the clockwise patterns spatially, keeping the four-light tails behind the heads
and preserving Circle 2's half-perimeter spacing. Both variants are available
in the controls and random sequence selection; the original versions are unchanged.
Automatic random-sequence changes exclude the currently running sequence.

**Pacman Chase** (`pacmanChase`) sends two short fading trails clockwise along
`OUTLINE`, followed by a third blinking chaser. Heads stay four positions apart,
with two-position fades and at least one dark light between trails. The chaser
is on for half a beat and off for half a beat; all three complete a lap every
four beats. Non-outline lights remain dark unless overridden by an accent.
The sequence is available in the controls and random sequence selection and
uses the selected sequence color.

Run its timeline and circle regression tests:

```bash
node --test src/lib/sequences/pacman.test.ts
```

Four rave-inspired patterns are also available in the controls and random selection:

- **Laser Bounce** sweeps a narrow beam across the room's columns and back,
  crossfading between neighboring columns.
- **Radial Ripple** sends a smooth brightness wave outward through the four
  radial rings.
- **Zone Crossfade** passes the light from couch to kitchen to dance floor,
  then back to the couch.
- **Orbit Collision** sends two fading perimeter trails in opposite directions,
  merging and separating as they pass.

Each loops every four beats (16 quarter-beat frames), uses the selected sequence
color, and supports the existing brightness and accent controls. These are
brightness animations, not physical lasers. Preview at a comfortable brightness;
beat-synchronized lighting can still be uncomfortable for photosensitive viewers.

Run their timeline tests:

```bash
node --test src/lib/sequences/rave.test.ts
```

The 2D map, optional 3D preview, and hub consume these timelines. Selecting a
sequence starts the hub playback loop and sends commands to the physical lights.

Run the timeline tests with Node.js supporting native TypeScript:

```bash
node --test src/lib/sequences/circle.test.ts
```

## 3D room preview

The main controller retains its original 2D map and overlaid controls. Click
**3D View** next to **CUE** to open the dedicated `/3d` preview in a separate
browser popup. Clicking it again focuses the existing preview; closing the popup
does not stop the controller. Allow popups for this site if the browser blocks it.

The Three.js cutaway preserves the original 523 x 671 blueprint outline and all
23 ceiling-light positions, indexed in `IPS` order. Geometry and coordinates
live in `src/lib/room-layout.ts`. Blueprint coordinates are scaled by 0.01;
the 1.35-unit ceiling height is illustrative, not a measured room dimension.
Walls are solid except for camera-side walls, which become faintly translucent
to reveal the room. The cutaway updates while orbiting or panning; the ceiling
remains open so fixtures stay visible.
Fixtures are flat, horizontal circles visible from both sides.
Colors, brightness, sequences, and accents drive both fixtures and room lighting.
Each active fixture casts a faint colored cone whose top matches the light
circle's radius and meets it at ceiling height. The cone's opacity fades
quadratically to zero at the floor and follows the fixture's brightness;
cones disappear when their lights are off.

The preview renders on demand: new light states animate until settled, while
camera movement and resizing request new frames. Static scenes do not redraw,
identical snapshots do not restart rendering, and hidden windows pause rendering
until visible again. Label positions and wall cutaways update only when the
camera changes. Transparent cones and flat cutaway walls use a single render pass.

Drag to orbit, scroll/pinch to zoom, or right-drag to pan. **Top view** shows the
original layout from above; **Reset view** restores the cutaway. Light labels
retain their zero-based indices and IP suffix tooltips. The popup has no lighting
controls: it receives the exact resolved light states from the main window, so
random colors, sequences, accents, and brightness stay synchronized with the 2D
map. Same-origin messages are accepted only from its controller window.
Reloading the popup requests the current state. If the controller closes,
reloads, or stops responding for five seconds, the popup reports disconnection
and retains the last state;
click **3D View** in the controller to reconnect. Opening `/3d` directly displays
a waiting message until opened from the controller.

WebGL is required only in the popup; rendering failures leave the main 2D
controller usable.

Run geometry and timeline regression tests:

```bash
node --test src/lib/room-layout.test.ts src/lib/preview.test.ts src/lib/sequences/circle.test.ts
```
