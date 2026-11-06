"use client";

import { useEffect, useRef, useState } from "react";
import RoomScene, { type RoomSceneHandle } from "@/components/map/room-scene";
import { createPreviewLights, isPreviewMessage, type PreviewMessage } from "@/lib/preview";

export default function PreviewPage() {
  const lights = useRef(createPreviewLights());
  const scene = useRef<RoomSceneHandle>(null);
  const [status, setStatus] = useState(
    "Waiting for the controller. Open this preview using 3D View in the main window.",
  );

  useEffect(() => {
    document.title = "3D Preview | Lighting Controller";
    const controller: Window | null = window.opener;
    if (!controller) return;
    let lastReceived = Date.now();

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== controller) {
        return;
      }
      if (!isPreviewMessage(event.data)) {
        console.error("Invalid 3D preview message from the controller.");
        setStatus("Invalid preview data received. Reopen 3D View from the controller.");
        return;
      }
      if (event.data.type === "preview:state") {
        lastReceived = Date.now();
        lights.current = event.data.lights;
        scene.current?.invalidate();
        setStatus("Live preview. Use the lighting controls in the main window.");
      } else if (event.data.type === "preview:disconnected") {
        setStatus("Controller disconnected. Showing the last state. Reopen 3D View from the controller to reconnect.");
      }
    };
    const requestState = () => {
      if (controller.closed) {
        setStatus("Controller closed. Showing the last received state.");
      } else {
        if (Date.now() - lastReceived > 5000) {
          setStatus("Controller disconnected or not responding. Showing the last state. Reopen 3D View from the controller to reconnect.");
        }
        controller.postMessage(
          { type: "preview:request" } satisfies PreviewMessage,
          window.location.origin,
        );
      }
    };

    window.addEventListener("message", onMessage);
    requestState();
    const heartbeat = window.setInterval(requestState, 1000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(heartbeat);
    };
  }, []);

  return <RoomScene ref={scene} lights={lights} status={status} />;
}
