"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { IPS } from "@/lib/constants";
import {
  BLUEPRINT_DEPTH,
  BLUEPRINT_SCALE,
  CEILING_HEIGHT,
  ROOM_OUTLINE,
  blueprintToWorld,
  isWallOccludingRoom,
  lightPosition,
} from "@/lib/room-layout";
import type { PreviewLight } from "@/lib/preview";
import styles from "./room-scene.module.scss";

export interface RoomSceneHandle {
  invalidate: () => void;
}

export default function RoomScene({
  ref,
  lights,
  status,
  embedded = false,
}: {
  ref?: Ref<RoomSceneHandle>;
  lights: RefObject<PreviewLight[]>;
  status: string;
  embedded?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const setView = useRef<(top: boolean) => void>(() => {});
  const requestRenderRef = useRef<() => void>(() => {});
  const [error, setError] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      invalidate: () => requestRenderRef.current(),
    }),
    [],
  );

  useEffect(() => {
    const host = viewport.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (cause) {
      console.error("Unable to initialize the 3D room preview.", cause);
      // WebGL availability is only known after initializing the external renderer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(
        "The 3D preview requires WebGL. Enable hardware acceleration and reload.",
      );
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#000000");
    host.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.domElement.className = styles.labels;
    host.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const resetView = (top: boolean) => {
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const fit =
        (BLUEPRINT_DEPTH * BLUEPRINT_SCALE + CEILING_HEIGHT) /
        (2 * Math.tan(halfFov) * Math.min(camera.aspect, 1));
      controls.target.set(0, CEILING_HEIGHT / 2, 0);
      const direction = new THREE.Vector3(0, 1, 0.001);
      camera.position.copy(controls.target).addScaledVector(direction, fit);
      controls.maxDistance = Math.max(35, fit * 2);
      controls.update();
    };
    setView.current = resetView;

    scene.add(new THREE.HemisphereLight("#ccc", "#222", 1.8));
    const daylight = new THREE.DirectionalLight("#ffffff", 2);
    daylight.position.set(-3, 8, 4);
    scene.add(daylight);

    const outline = ROOM_OUTLINE.map(([x, y]) => blueprintToWorld(x, y));
    const shape = new THREE.Shape();
    outline.forEach(([x, z], index) => {
      if (index === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    shape.closePath();
    const floor = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: "#333", roughness: 0.9 }),
    );
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#bbb",
      side: THREE.DoubleSide,
      roughness: 0.85,
    });
    const cutawayWallMaterial = new THREE.MeshStandardMaterial({
      color: "#bbb",
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
      forceSinglePass: true,
      roughness: 0.85,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: "#bbb",
      transparent: true,
      opacity: 0.65,
    });
    const walls = outline.map(([x, z], index) => {
      const [nextX, nextZ] = outline[(index + 1) % outline.length];
      const length = Math.hypot(nextX - x, nextZ - z);
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(length, CEILING_HEIGHT),
        wallMaterial,
      );
      wall.position.set((x + nextX) / 2, CEILING_HEIGHT / 2, (z + nextZ) / 2);
      wall.rotation.y = -Math.atan2(nextZ - z, nextX - x);
      scene.add(wall);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(wall.geometry),
        edgeMaterial,
      );
      edges.position.copy(wall.position);
      edges.rotation.copy(wall.rotation);
      scene.add(edges);
      return {
        wall,
        start: outline[index],
        end: outline[(index + 1) % outline.length],
      };
    });

    const lightRadius = 0.095;
    const bulbGeometry = new THREE.CircleGeometry(lightRadius, 32);
    const beamHeight = CEILING_HEIGHT - 0.01;
    const beamGeometry = new THREE.CylinderGeometry(
      lightRadius,
      beamHeight * 0.32,
      beamHeight,
      32,
      16,
      true,
    );
    const beamPositions = beamGeometry.getAttribute("position");
    const beamColors = new Float32Array(beamPositions.count * 4);
    for (let index = 0; index < beamPositions.count; index++) {
      const fade = THREE.MathUtils.clamp(
        (beamPositions.getY(index) + beamHeight / 2) / beamHeight,
        0,
        1,
      );
      beamColors.set([1, 1, 1, fade * fade], index * 4);
    }
    beamGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(beamColors, 4),
    );

    const fixtures = IPS.map((ip, index) => {
      const position = lightPosition(index);
      const material = new THREE.MeshStandardMaterial({
        color: "#222",
        emissive: "#ffffff",
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      });
      const bulb = new THREE.Mesh(bulbGeometry, material);
      bulb.position.set(...position);
      bulb.rotation.x = -Math.PI / 2;
      scene.add(bulb);

      const light = new THREE.PointLight("#ffffff", 0, 5, 2);
      light.position.set(position[0], position[1] - 0.12, position[2]);
      scene.add(light);

      const beamMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        toneMapped: false,
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(position[0], position[1] - beamHeight / 2, position[2]);
      beam.visible = false;
      scene.add(beam);

      const element = document.createElement("span");
      element.className = styles.lightLabel;
      element.textContent = `${index}`;
      element.title = `#${index} - IP suffix ${ip}`;
      element.setAttribute("aria-label", `Light ${index}, IP suffix ${ip}`);
      element.style.borderColor = "#ffffff";
      const label = new CSS2DObject(element);
      label.position.set(position[0], position[1] + 0.2, position[2]);
      scene.add(label);
      return {
        material,
        light,
        beam,
        element,
        color: new THREE.Color(),
        sourceColor: [255, 255, 255],
        labelColor: "#ffffff",
        brightness: 0,
      };
    });

    // Only materials and the camera animate; room and fixture transforms are fixed.
    scene.updateMatrixWorld(true);
    scene.matrixWorldAutoUpdate = false;
    scene.traverse((object) => {
      object.matrixAutoUpdate = false;
    });

    let animationFrame = 0;
    let disposed = false;
    let contextLost = false;
    let cameraDirty = true;
    let renderNeeded = true;
    let lastFrame: number | null = null;

    const requestRender = () => {
      if (!animationFrame && !disposed && !contextLost && !document.hidden) {
        lastFrame ??= performance.now();
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };
    requestRenderRef.current = requestRender;

    const onCameraChange = () => {
      cameraDirty = true;
      requestRender();
    };
    controls.addEventListener("change", onCameraChange);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labels.setSize(width, height);
      renderNeeded = true;
      requestRender();
    };
    resize();
    resetView(false);
    const observer = new ResizeObserver(() => {
      resize();
      resetView(false);
    });
    observer.observe(host);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      console.error("The 3D preview lost its graphics context.");
      setError(
        "The 3D preview lost its graphics context. Reload to restore it.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastFrame = null;
      } else {
        renderNeeded = true;
        lastFrame = performance.now() - 100;
        requestRender();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    function renderFrame(now: number) {
      animationFrame = 0;
      if (disposed || contextLost || document.hidden) return;
      const elapsed = Math.min(Math.max(now - (lastFrame ?? now), 0), 100);
      const blend = 1 - Math.exp(-elapsed / 50);
      lastFrame = now;
      let lightsChanged = false;
      let transitioning = false;
      fixtures.forEach((fixture, index) => {
        const state = lights.current[index];
        if (
          state.color.some(
            (channel, channelIndex) =>
              channel !== fixture.sourceColor[channelIndex],
          )
        ) {
          fixture.color.setRGB(
            state.color[0] / 255,
            state.color[1] / 255,
            state.color[2] / 255,
            THREE.SRGBColorSpace,
          );
          fixture.sourceColor[0] = state.color[0];
          fixture.sourceColor[1] = state.color[1];
          fixture.sourceColor[2] = state.color[2];
        }
        const emissive = fixture.material.emissive;
        const colorDelta = Math.max(
          Math.abs(emissive.r - fixture.color.r),
          Math.abs(emissive.g - fixture.color.g),
          Math.abs(emissive.b - fixture.color.b),
        );
        const brightnessDelta = Math.abs(fixture.brightness - state.brightness);
        if (colorDelta === 0 && brightnessDelta === 0) return;

        lightsChanged = true;
        // Snap below visible precision so interpolation can stop completely.
        const colorSettled = colorDelta * (1 - blend) <= 0.0001;
        const brightnessSettled = brightnessDelta * (1 - blend) <= 0.0001;
        transitioning ||= !colorSettled || !brightnessSettled;
        if (colorSettled) emissive.copy(fixture.color);
        else emissive.lerp(fixture.color, blend);
        fixture.brightness = brightnessSettled
          ? state.brightness
          : THREE.MathUtils.lerp(fixture.brightness, state.brightness, blend);
        fixture.material.emissiveIntensity = fixture.brightness * 3;
        fixture.light.color.copy(emissive);
        fixture.light.intensity = fixture.brightness * 4;
        fixture.beam.material.color.copy(emissive);
        fixture.beam.material.opacity = fixture.brightness * 0.08;
        fixture.beam.visible = fixture.brightness > 0.001;
        if (colorDelta > 0) {
          const labelColor = `#${emissive.getHexString()}`;
          if (labelColor !== fixture.labelColor) {
            fixture.element.style.borderColor = labelColor;
            fixture.labelColor = labelColor;
          }
        }
      });
      const cameraMoving = controls.update();
      if (cameraDirty) {
        walls.forEach(({ wall, start, end }) => {
          wall.material = isWallOccludingRoom(start, end, camera.position)
            ? cutawayWallMaterial
            : wallMaterial;
        });
      }
      if (renderNeeded || cameraDirty || lightsChanged) {
        renderer.render(scene, camera);
        if (renderNeeded || cameraDirty) labels.render(scene, camera);
        renderNeeded = false;
        cameraDirty = false;
      }
      if (transitioning || cameraMoving) requestRender();
      if (!animationFrame) lastFrame = null;
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      requestRenderRef.current = () => {};
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      controls.removeEventListener("change", onCameraChange);
      controls.dispose();
      setView.current = () => {};
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>([
        wallMaterial,
        cutawayWallMaterial,
      ]);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      scene.clear();
      renderer.dispose();
      renderer.domElement.remove();
      labels.domElement.remove();
    };
  }, [lights]);

  return (
    <section
      className={`${styles.container} ${embedded ? styles.embedded : ""}`}
      aria-label="Room lighting preview"
    >
      <div className={styles.viewport} ref={viewport} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
