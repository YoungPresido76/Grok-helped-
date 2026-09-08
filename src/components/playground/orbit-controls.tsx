import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three/addons/controls/OrbitControls.js";

export const orbitControlsRef: { current: OrbitControlsImpl | null } = {
  current: null,
};

export function CameraControls({ enabled }: { enabled: boolean }) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const next = new OrbitControlsImpl(camera, gl.domElement);
    next.enableDamping = true;
    next.dampingFactor = 0.08;
    next.enablePan = true;
    next.minDistance = 5;
    next.maxDistance = 28;
    next.minPolarAngle = 0.05;
    next.maxPolarAngle = Math.PI - 0.05;
    next.target.set(0, 0.55, 0);
    next.update();
    controls.current = next;
    orbitControlsRef.current = next;
    return () => {
      next.dispose();
      if (orbitControlsRef.current === next) orbitControlsRef.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    if (controls.current) controls.current.enabled = enabled;
  }, [enabled]);

  useFrame(() => {
    controls.current?.update();
  });

  return null;
}
