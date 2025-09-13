import randomColor from "randomcolor";
import { ROWS, ZONES } from "../constants.ts"; // potentially ROW_Y ROW_X
import type { Color } from "../../types/global.ts";

// Crazy title, I know. But not sure what to name it else
export const talkSolidRedDanceFlashWhite = {
  label: "Talk Solid Red / Dance Flash White",
  beat: 1,
  loop: (updateLight: any, bpm: number) => {
    const talkColor: Color = [255, 0, 0];
    const danceColor: Color = [255, 255, 255];

    ZONES.talk.forEach((_, index) => { // WHY WONT THIS TURN RED
        updateLight(index, {
            color: talkColor,
            dimming: 100,
        });
    });

    ZONES.dance.forEach((_, index) => {
        updateLight(index, {
            color: danceColor,
            dimming: 100,
        });
    });

    return [
        setTimeout(
            () =>
              ZONES.dance.forEach((_, index) => {
                updateLight(index, {
                  dimming: 0,
                });
            }),
            (1000 * 60) / bpm / 2
        ),
    ];

  },

};
