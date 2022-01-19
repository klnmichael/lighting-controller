import {
  createContext,
  ReactNode,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

export interface UpdateValues {
  time: number;
  progress: number;
  bar: number;
  beat: number;
}

export interface Block {
  time: number[];
  color: number[];
  alpha: number[];
}

export interface Device {
  id: string;
  tracks: Block[][];
}

interface SiteStateContextValue {
  setRaf: (
    update: (values: UpdateValues) => boolean,
    render?: (values: UpdateValues) => void
  ) => number;
  removeRaf: (index: number) => void;
  playing: boolean;
  beats: number;
  bars: number;
  bpm: number;
  setBeats: (value: number) => void;
  setBars: (value: number) => void;
  setBpm: (value: number) => void;
  devices: Device[];
  addDevice: () => void;
  removeDevice: (index: number) => void;
  updateTime: (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    time: number[]
  ) => void;
  updateColor: (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    color: number[]
  ) => void;
  updateAlpha: (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    alpha: number[]
  ) => void;
}

const initialState: SiteStateContextValue = {
  setRaf: () => -1,
  removeRaf: () => {},
  playing: false,
  beats: 4,
  bars: 16,
  bpm: 126,
  setBeats: () => {},
  setBars: () => {},
  setBpm: () => {},
  devices: [],
  addDevice: () => {},
  removeDevice: () => {},
  updateTime: () => {},
  updateColor: () => {},
  updateAlpha: () => {},
};

const SiteStateContext = createContext<SiteStateContextValue>(initialState);
const { Provider, Consumer: SiteStateConsumer } = SiteStateContext;

const SiteStateProvider = ({ children }: { children: ReactNode }) => {
  const rafRef = useRef(0);
  const rafListenersRef = useRef<
    {
      update: (values: UpdateValues) => boolean;
      render?: (values: UpdateValues) => void;
      changed: boolean;
    }[]
  >([]);

  const [playing, setPlaying] = useState(false);
  const refPlaying = useRef(false);
  const refPlayTime = useRef(0);

  const [beats, setBeats] = useState(initialState.beats);
  const [bars, setBars] = useState(initialState.bars);
  const [bpm, setBpm] = useState(initialState.bpm);
  const refBeats = useRef(initialState.beats);
  const refBars = useRef(initialState.bars);
  const refBpm = useRef(initialState.bpm);

  const [devices, setDevices] = useState<Device[]>([
    {
      id: "test-0",
      tracks: [
        [
          {
            time: [0, 0.5],
            color: [255, 255, 255],
            alpha: [1, 0],
          },
          {
            time: [0.5, 1],
            color: [255, 255, 255],
            alpha: [1, 0],
          },
        ],
        [
          {
            time: [0, 1],
            color: [255, 0, 180],
            alpha: [1, 1],
          },
        ],
      ],
    },
    {
      id: "test-1",
      tracks: [
        [
          {
            time: [0, 0.5],
            color: [255, 255, 255],
            alpha: [1, 0],
          },
          {
            time: [0.5, 1],
            color: [255, 255, 255],
            alpha: [1, 0],
          },
        ],
        [
          {
            time: [0, 1],
            color: [255, 0, 180],
            alpha: [1, 1],
          },
        ],
      ],
    },
  ]);

  const runFrame = (time: number) => {
    rafRef.current = requestAnimationFrame(runFrame);
    if (!refPlayTime.current) refPlayTime.current = time;
    const bar =
      ((time - refPlayTime.current) / (60000 / refBpm.current)) %
      refBars.current;
    const beat = (bar - Math.floor(bar)) * refBeats.current;
    const progress = bar / refBars.current;
    const updateValues = refPlaying.current
      ? {
          time: time - refPlayTime.current,
          progress,
          bar: Math.floor(bar) + 1,
          beat: Math.floor(beat) + 1,
        }
      : {
          time: 0,
          progress: 0,
          bar: 0,
          beat: 0,
        };
    rafListenersRef.current.forEach((listener) => {
      if (listener && listener.update) {
        listener.changed = listener.update(updateValues);
      }
    });
    rafListenersRef.current.forEach((listener) => {
      if (listener && listener.changed && listener.render) {
        listener.render(updateValues);
      }
    });
  };

  const setRaf = (
    update: (values: UpdateValues) => boolean,
    render?: (values: UpdateValues) => void
  ) => {
    rafListenersRef.current.push({ update, render, changed: false });
    return rafListenersRef.current.length - 1;
  };

  const removeRaf = (index: number) => {
    delete rafListenersRef.current[index];
  };

  const addDevice = () => {
    setDevices((devices) => {
      return [
        ...devices,
        {
          id: "test",
          tracks: [[], []],
        },
      ];
    });
  };

  const removeDevice = (index: number) => {
    setDevices((devices) => {
      return devices.splice(index, 1);
    });
  };

  const addTrack = (deviceIndex: number) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks.push([]);
      return updatedDevices;
    });
  };

  const removeTrack = (deviceIndex: number, trackIndex: number) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks.splice(trackIndex, 1);
      return updatedDevices;
    });
  };

  const addBlock = (deviceIndex: number, trackIndex: number, block: Block) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks[trackIndex].push(block);
      return updatedDevices;
    });
  };

  const removeBlock = (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number
  ) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks[trackIndex].splice(blockIndex, 1);
      return updatedDevices;
    });
  };

  const updateTime = (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    time: number[]
  ) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks[trackIndex][blockIndex].time = time;
      return updatedDevices;
    });
  };

  const updateColor = (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    color: number[]
  ) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks[trackIndex][blockIndex].color = color;
      return updatedDevices;
    });
  };

  const updateAlpha = (
    deviceIndex: number,
    trackIndex: number,
    blockIndex: number,
    alpha: number[]
  ) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex].tracks[trackIndex][blockIndex].alpha = alpha;
      return updatedDevices;
    });
  };

  const onDocumentKeydown = (e: KeyboardEvent) => {
    // console.log(e.code);
    switch (e.code) {
      case "Space":
        setPlaying(!playing);
      case "Enter":
      case "NumpadEnter":
        refPlayTime.current = 0;
    }
  };

  useEffect(() => {
    refBeats.current = beats;
    refBars.current = bars;
    refBpm.current = bpm;
    refPlaying.current = playing;
  }, [beats, bars, bpm, playing]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(runFrame);
    document.addEventListener("keydown", onDocumentKeydown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("keydown", onDocumentKeydown);
    };
  });

  const value = {
    setRaf,
    removeRaf,
    playing,
    beats,
    bars,
    bpm,
    setBeats,
    setBars,
    setBpm,
    devices,
    addDevice,
    removeDevice,
    updateTime,
    updateColor,
    updateAlpha,
  };

  return <Provider value={value}>{children}</Provider>;
};

const useSiteState = (): SiteStateContextValue => useContext(SiteStateContext);

export { SiteStateProvider, SiteStateContext, SiteStateConsumer, useSiteState };
