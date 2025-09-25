export const flashWhite = {
  label: "Flash White",
  timeline: () => [[{ color: [255, 255, 255] }], [], [{ dimming: 0 }], []],
};

export const flashRandom = {
  label: "Flash Random",
  timeline: () => [[{ randomColor: true }], [], [{ dimming: 0 }], []],
};

export const flashCustom = {
  label: "Flash Custom",
  timeline: () => [[{ customColor: true }], [], [{ dimming: 0 }], []],
};
