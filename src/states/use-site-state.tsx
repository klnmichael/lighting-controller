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
  name: string;
  bluetoothDevice: BluetoothDevice;
  tracks: string[];
}

export interface Tracks {
  [id: string]: Block[];
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
  tracks: Tracks;
  addDevice: () => void;
  removeDevice: (index: number) => void;
  addTrack: (deviceIndex: number) => void;
  removeTrack: (deviceIndex: number, trackIndex: number) => void;
  addBlock: (trackId: string, block: Block) => void;
  removeBlock: (trackId: string, blockIndex: number) => void;
  updateTime: (trackId: string, blockIndex: number, time: number[]) => void;
  updateColor: (trackId: string, blockIndex: number, color: number[]) => void;
  updateAlpha: (trackId: string, blockIndex: number, alpha: number[]) => void;
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
  tracks: {},
  addDevice: () => {},
  removeDevice: () => {},
  addTrack: () => {},
  removeTrack: () => {},
  addBlock: () => {},
  removeBlock: () => {},
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

  const [devices, setDevices] = useState<Device[]>([]);
  const [tracks, setTracks] = useState<Tracks>({});

  // const [devices, setDevices] = useState<Device[]>(
  //   JSON.parse(
  //     typeof window !== "undefined" && window.localStorage.getItem("lc-devices")
  //       ? String(window.localStorage.getItem("lc-devices"))
  //       : "[]"
  //   )
  // );
  // const [tracks, setTracks] = useState<Tracks>(
  //   JSON.parse(
  //     typeof window !== "undefined" && window.localStorage.getItem("lc-tracks")
  //       ? String(window.localStorage.getItem("lc-tracks"))
  //       : "{}"
  //   )
  // );

  // useEffect(() => {
  //   const serializedDevices = JSON.stringify(devices);
  //   const serializedTracks = JSON.stringify(tracks);
  //   if (serializedDevices !== window.localStorage.getItem("lc-devices")) {
  //     window.localStorage.setItem("lc-devices", serializedDevices);
  //   }
  //   if (serializedTracks !== window.localStorage.getItem("lc-tracks")) {
  //     window.localStorage.setItem("lc-tracks", serializedTracks);
  //   }
  // }, [devices, tracks]);

  const generateId = () => {
    return Math.random().toString(16).slice(2);
  };

  const runFrame = (time: number) => {
    if (!refPlaying.current) return;
    rafRef.current = requestAnimationFrame(runFrame);
    if (!refPlayTime.current) refPlayTime.current = time;
    const bar =
      ((time - refPlayTime.current) / (60000 / refBpm.current)) %
      refBars.current;
    const beat = (bar - Math.floor(bar)) * refBeats.current;
    const progress = bar / refBars.current;
    const updateValues = {
      time: time - refPlayTime.current,
      progress,
      bar: Math.floor(bar) + 1,
      beat: Math.floor(beat) + 1,
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

  const addDevice = async () => {
    navigator.bluetooth
      .requestDevice({
        filters: [{ namePrefix: "LEDBlue-" }],
        optionalServices: [0xffe5],
      })
      .then((bluetoothDevice) => {
        if (!bluetoothDevice) return;
        const name = bluetoothDevice.name?.trim() || generateId();
        if (devices.find((d) => d.name === name)) return;
        const trackIds = [generateId(), generateId()];
        setTracks((tracks) => {
          return {
            ...tracks,
            [trackIds[0]]: [],
            [trackIds[1]]: [],
          };
        });
        setDevices((devices) => {
          return [
            ...devices,
            {
              name,
              bluetoothDevice,
              tracks: trackIds,
            },
          ];
        });
      })
      .catch((e) => {});
  };

  const removeDevice = (index: number) => {
    setDevices((devices) => {
      const updatedDevices = [...devices];
      updatedDevices.splice(index, 1);
      return updatedDevices;
    });
  };

  const addTrack = (deviceIndex: number) => {
    const trackId = generateId();
    setDevices((devices) => {
      const updatedDevices = [...devices];
      const updatedTracks = devices[deviceIndex].tracks;
      updatedDevices[deviceIndex].tracks = [...updatedTracks, trackId];
      return updatedDevices;
    });
    setTracks((tracks) => {
      return {
        ...tracks,
        [trackId]: [],
      };
    });
  };

  const removeTrack = (deviceIndex: number, trackIndex: number) => {
    setDevices((devices) => {
      devices[deviceIndex].tracks.splice(trackIndex, 1);
      return devices;
    });
  };

  const addBlock = (trackId: string, block: Block) => {
    setTracks((tracks) => {
      const updatedTracks = { ...tracks };
      const updatedBlocks = tracks[trackId];
      updatedTracks[trackId] = [...updatedBlocks, block];
      return updatedTracks;
    });
  };

  const removeBlock = (trackId: string, blockIndex: number) => {
    setTracks((tracks) => {
      const updatedTracks = { ...tracks };
      const updatedBlocks = tracks[trackId];
      updatedTracks[trackId] = [...updatedBlocks];
      updatedTracks[trackId].splice(blockIndex, 1);
      return updatedTracks;
    });
  };

  const updateTime = (trackId: string, blockIndex: number, time: number[]) => {
    setTracks((tracks) => {
      const updatedTracks = { ...tracks };
      updatedTracks[trackId][blockIndex].time = time;
      return updatedTracks;
    });
  };

  const updateColor = (
    trackId: string,
    blockIndex: number,
    color: number[]
  ) => {
    setTracks((tracks) => {
      const updatedTracks = { ...tracks };
      updatedTracks[trackId][blockIndex].color = color;
      return updatedTracks;
    });
  };

  const updateAlpha = (
    trackId: string,
    blockIndex: number,
    alpha: number[]
  ) => {
    setTracks((tracks) => {
      const updatedTracks = { ...tracks };
      updatedTracks[trackId][blockIndex].alpha = alpha;
      return updatedTracks;
    });
  };

  const onDocumentKeydown = (e: KeyboardEvent) => {
    // console.log(e.code);
    switch (e.code) {
      case "Space":
        e.preventDefault();
        setPlaying(!playing);
      case "Enter":
      case "NumpadEnter":
        e.preventDefault();
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
    tracks,
    addDevice,
    removeDevice,
    addTrack,
    removeTrack,
    addBlock,
    removeBlock,
    updateTime,
    updateColor,
    updateAlpha,
  };

  return <Provider value={value}>{children}</Provider>;
};

const useSiteState = (): SiteStateContextValue => useContext(SiteStateContext);

export { SiteStateProvider, SiteStateContext, SiteStateConsumer, useSiteState };
