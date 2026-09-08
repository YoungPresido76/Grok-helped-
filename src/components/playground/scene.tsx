import { Canvas } from "@react-three/fiber";
import { lazy, Suspense } from "react";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { CameraControls } from "./orbit-controls";
import { usePlayground } from "./store";

const PhysicsScene = lazy(() => import("./physics-scene"));

function Lights() {
  return (
    <>
      <color attach="background" args={["#0c0d0f"]} />
      <fog attach="fog" args={["#0c0d0f", 16, 38]} />
      <hemisphereLight args={["#d8dbe2", "#1a1c20", 0.55]} />
      <ambientLight intensity={0.28} />
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
      <directionalLight position={[-7, 6, -5]} intensity={0.32} color="#9aa6b4" />
    </>
  );
}

function VisualArena() {
  return (
    <gridHelper args={[32, 64, "#3a3f48", "#262930"]} position={[0, 0, 0]} />
  );
}

export function PlaygroundCanvas() {
  const dragging = usePlayground((s) => s.dragging);

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
        gl.setClearColor("#0c0d0f");
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
