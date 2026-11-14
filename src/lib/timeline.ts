export interface TimelinePosition {
  beat: number;
  tick: number;
}

export interface TimelineData {
  ips?: number[];
  dimming?: number;
  randomDimming?: [number, number];
}

export interface AccentTimelineData extends TimelineData {
  ips: number[];
  dimming: number;
}

export type LightingTimeline = TimelineData[][];

export type TimelineFactory<TData extends TimelineData = TimelineData> = (
  position: TimelinePosition,
) => TData[][];

export interface LightingPattern<TData extends TimelineData = TimelineData> {
  title: string;
  timeline: TimelineFactory<TData>;
}

export function createCachedTimeline(
  factory: () => LightingTimeline,
): TimelineFactory {
  let cached: LightingTimeline | undefined;
  return () => {
    cached ??= factory();
    return cached;
  };
}
