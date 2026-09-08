import { Canvas } from "@react-three/fiber";
import { lazy, Suspense } from "react";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { CameraControls } from "./orbit-controls";
import { usePlayground } from "./store";
import { useTheme } from "@/contexts/theme";

const PhysicsScene = lazy(() => import("./physics-scene"));

function Lights() {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === "light";
  return (
    <>
      <color attach="background" args={[light ? "#f3f5f8" : "#0c0d0f"]} />
      <fog attach="fog" args={[light ? "#f3f5f8" : "#0c0d0f", 16, 38]} />
      <hemisphereLight args={light ? ["#ffffff", "#aeb9c8", 0.72] : ["#d8dbe2", "#1a1c20", 0.55]} />
      <ambientLight intensity={light ? 0.5 : 0.28} />
      <directionalLight
        position={[8.5, 14, 6]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={36}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-7, 6, -5]} intensity={light ? 0.5 : 0.32} color="#9aa6b4" />
    </>
  );
}

function VisualArena() {
  const { resolvedTheme } = useTheme();
  const major = resolvedTheme === "light" ? "#b9c3d0" : "#3a3f48";
  const minor = resolvedTheme === "light" ? "#d6dce5" : "#262930";
  return (
    <>
      <gridHelper args={[32, 64, major, minor]} position={[0, 0, 0]} />
      <gridHelper args={[32, 64, major, minor]} rotation={[0, 0, Math.PI / 2]} position={[-16, 8, 0]} />
      <gridHelper args={[32, 64, major, minor]} rotation={[0, 0, Math.PI / 2]} position={[16, 8, 0]} />
      <gridHelper args={[32, 64, major, minor]} rotation={[Math.PI / 2, 0, 0]} position={[0, 8, -16]} />
      <gridHelper args={[32, 64, major, minor]} rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 16]} />
    </>
  );
}

export function PlaygroundCanvas() {
  const dragging = usePlayground((s) => s.dragging);
  const { resolvedTheme } = useTheme();
  const background = resolvedTheme === "light" ? "#f3f5f8" : "#0c0d0f";

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [9.4, 6.6, 9.4], fov: 42, near: 0.1, far: 80 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(background);
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFShadowMap;
      }}
      className="touch-none"
    >
      <Lights />
      <VisualArena />
      <Suspense fallback={null}>
        <PhysicsScene />
      </Suspense>
      <CameraControls enabled={!dragging} />
    </Canvas>
  );
}
