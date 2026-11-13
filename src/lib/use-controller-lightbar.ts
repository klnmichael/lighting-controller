"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  DualSenseLightbar,
  lightbarHid,
  type LightbarDevice,
  type LightbarInputReportEvent,
} from "./dualsense-lightbar";
import { dualSenseTouches, DualSenseTouchpadSelection } from "./dualsense-touchpad";
import { majorityLightColor, type LightState } from "./lights";
import type { Color } from "../types/global";

export function useControllerLightbar(
  lights: RefObject<LightState[]>,
  onColorSelected: (color: Color) => void,
) {
  const controller = useRef<DualSenseLightbar | null>(null);
  const previewColor = useRef<Color | null>(null);
  const selectionCallback = useRef(onColorSelected);
  const mounted = useRef(false);
  const connecting = useRef(false);
  const lastSent = useRef<{ controller: DualSenseLightbar; color: string } | null>(
    null,
  );
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    selectionCallback.current = onColorSelected;
  }, [onColorSelected]);

  useEffect(() => {
    mounted.current = true;
    const hid = lightbarHid();
    // WebHID availability is determined on the client, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(Boolean(hid));
    let writing = false;

    const onDisconnect = (event: Event) => {
      const device = (event as Event & { device: LightbarDevice }).device;
      if (device !== controller.current?.device) return;
      controller.current = null;
      previewColor.current = null;
      setConnected(false);
      setError("DualSense disconnected. Reconnect and enable light bar sync again.");
    };
    hid?.addEventListener("disconnect", onDisconnect);

    const timer = setInterval(async () => {
      const current = controller.current;
      if (!current || writing) return;
      const color = previewColor.current ?? majorityLightColor(lights.current);
      const key = color.join(",");
      if (lastSent.current?.controller === current && lastSent.current.color === key) {
        return;
      }
      writing = true;
      try {
        await current.setColor(color);
        lastSent.current = { controller: current, color: key };
      } catch (cause) {
        console.error("Unable to update the DualSense light bar.", cause);
        if (controller.current === current) {
          controller.current = null;
          previewColor.current = null;
          if (mounted.current) {
            setConnected(false);
            setError("Light bar update failed. Try enabling sync again.");
          }
        }
        await current.close().catch((closeError) =>
          console.error("Unable to close the DualSense device.", closeError),
        );
      } finally {
        writing = false;
      }
    }, 100);

    return () => {
      mounted.current = false;
      clearInterval(timer);
      hid?.removeEventListener("disconnect", onDisconnect);
      const current = controller.current;
      controller.current = null;
      previewColor.current = null;
      void current?.close().catch((cause) =>
        console.error("Unable to close the DualSense device.", cause),
      );
    };
  }, [lights]);

  useEffect(() => {
    const current = controller.current;
    if (!connected || !current) return;
    const selection = new DualSenseTouchpadSelection();
    const onInputReport = (event: Event) => {
      const report = event as LightbarInputReportEvent;
      if (report.device !== current.device || controller.current !== current) return;
      let touches;
      try {
        touches = dualSenseTouches(report.reportId, report.data);
      } catch (cause) {
        console.error("Unable to read the DualSense touchpad.", cause);
        controller.current = null;
        previewColor.current = null;
        setConnected(false);
        setError("Touchpad input failed. Try enabling sync again.");
        void current.close().catch((closeError) =>
          console.error("Unable to close the DualSense device.", closeError),
        );
        return;
      }
      if (!touches) return;
      const clicked = Boolean(
        report.data.getUint8(report.reportId === 0x31 ? 10 : 9) & 0x02,
      );
      const { preview, selected } = selection.update(touches, clicked);
      previewColor.current = preview;
      if (selected) selectionCallback.current(selected);
    };
    current.device.addEventListener("inputreport", onInputReport);
    return () => {
      current.device.removeEventListener("inputreport", onInputReport);
      previewColor.current = null;
    };
  }, [connected]);

  const connect = async () => {
    const hid = lightbarHid();
    if (!hid) {
      setError("Light bar sync requires Chrome or Edge on HTTPS or localhost.");
      return;
    }
    if (connecting.current || controller.current) return;
    connecting.current = true;
    setBusy(true);
    setError("");
    let selected: DualSenseLightbar | null = null;
    try {
      const [device] = await hid.requestDevice({
        filters: [
          { vendorId: 0x054c, productId: 0x0ce6 },
          { vendorId: 0x054c, productId: 0x0df2 },
        ],
      });
      if (!device) return;
      selected = new DualSenseLightbar(device);
      await selected.initialize();
      const color = majorityLightColor(lights.current);
      await selected.setColor(color);
      if (mounted.current) {
        controller.current = selected;
        lastSent.current = { controller: selected, color: color.join(",") };
        setConnected(true);
      } else {
        await selected.close();
      }
    } catch (cause) {
      console.error("Unable to connect the DualSense light bar.", cause);
      if (mounted.current) {
        setError(
          `Unable to connect the light bar: ${cause instanceof Error ? cause.message : String(cause)}`,
        );
      }
      await selected?.close().catch((closeError) =>
        console.error("Unable to close the DualSense device.", closeError),
      );
    } finally {
      connecting.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return { supported, busy, connected, error, connect };
}
