import { useFrame, useThree } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, Euler, Group, MeshStandardMaterial, Plane, Quaternion, SRGBColorSpace, Vector2, Vector3 } from "three";
import { orbitControlsRef } from "./orbit-controls";
import { liveBodyPoses, MATERIALS, usePlayground, type ShapeKind, type SpawnedBody } from "./store";

const GRAB_Y_MIN = 0.55;
const ARENA_RADIUS = 14;
const FALL_KILL = -8;
const GROUND_RESTITUTION = 0.04;
const GROUND_FRICTION = 0.92;

const pointerNdc = new Vector2();
const grabPlane = new Plane();
const planeHit = new Vector3();
const camDir = new Vector3();
const grabTarget = new Vector3();
const grabVel = new Vector3();
const rayOrigin = { x: 0, y: 0, z: 0 };
const rayDir = { x: 0, y: 0, z: 1 };

const bodyRefs = new Map<string, RapierRigidBody>();
const rotationGizmoGroupRef: { current: Group | null } = { current: null };

function bodyIdFor(api: RapierRigidBody) {
  for (const [id, body] of bodyRefs) {
    if (body === api) return id;
  }
  return null;
}

function PhysicsArena() {
  const restitution = usePlayground((s) => s.restitution);
  const groundRestitution = Math.min(restitution, 0.18);
  return (
    <>
      <RigidBody
        type="fixed"
        colliders={false}
        friction={GROUND_FRICTION}
        restitution={Math.max(GROUND_RESTITUTION, groundRestitution)}
      >
        <CuboidCollider args={[16, 0.2, 16]} position={[0, -0.2, 0]} />
        <CuboidCollider args={[0.2, 8, 16]} position={[-16, 8, 0]} />
        <CuboidCollider args={[0.2, 8, 16]} position={[16, 8, 0]} />
        <CuboidCollider args={[16, 8, 0.2]} position={[0, 8, -16]} />
        <CuboidCollider args={[16, 8, 0.2]} position={[0, 8, 16]} />
      </RigidBody>
    </>
  );
}

function shapeMaterial(kind: ShapeKind, color: string) {
  const roughness = kind === "box" ? 0.34 : kind === "sphere" ? 0.52 : 0.44;
  const metalness = kind === "box" ? 0.28 : kind === "sphere" ? 0.06 : 0.14;
  return new MeshStandardMaterial({
    color: new Color(color),
    roughness,
    metalness,
  });
}

function ShapeBody({ body, selected }: { body: SpawnedBody; selected: boolean }) {
  const restitution = usePlayground((s) => s.restitution);
  const materialProfile = MATERIALS[body.material];
  const material = useMemo(
    () => shapeMaterial(body.kind, body.color),
    [body.kind, body.color],
  );
  const friction = materialProfile.friction;
  const linearDamping = body.kind === "sphere" ? 0.3 : 0.24;
  const angularDamping = body.kind === "sphere" ? 0.62 : 0.48;

  useEffect(() => () => material.dispose(), [material]);
  material.emissive.set(selected ? "#f4cf72" : "#000000");
  material.emissiveIntensity = selected ? 0.42 : 0;

  useEffect(() => {
    const api = bodyRefs.get(body.id);
    if (!api || !api.isValid()) return;
    api.setTranslation({ x: body.position[0], y: body.position[1], z: body.position[2] }, true);
  }, [body.id, body.position]);

  useEffect(() => {
    const api = bodyRefs.get(body.id);
    if (!api || !api.isValid()) return;
    const euler = new Euler(body.rotation[0], body.rotation[1], body.rotation[2]);
    const quaternion = new Quaternion().setFromEuler(euler);
    api.setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }, true);
    api.setLinvel({ x: 0, y: 0, z: 0 }, true);
    api.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }, [body.id, body.rotation]);

  return (
    <RigidBody
      ref={(api) => {
        if (api) bodyRefs.set(body.id, api);
        else bodyRefs.delete(body.id);
      }}
      type={body.locked || selected ? "kinematicPosition" : "dynamic"}
      position={body.position}
      rotation={body.rotation}
      scale={body.scale}
      colliders={false}
      restitution={Math.min(restitution + materialProfile.restitution, 0.35)}
      friction={friction}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      angularVelocity={body.angularVelocity}
      ccd
      canSleep
    >
      {body.kind === "sphere" && <BallCollider args={[0.46]} density={materialProfile.density} sensor={selected} />}
      {body.kind === "box" && <CuboidCollider args={[0.42, 0.42, 0.42]} density={materialProfile.density} sensor={selected} />}
      {(body.kind === "cylinder" || body.kind === "cone" || body.kind === "triangle") && <CylinderCollider args={[0.5, 0.38]} density={materialProfile.density} sensor={selected} />}
      {(body.kind === "torus" || body.kind === "capsule" || body.kind === "arc" || body.kind === "semicircle") && <BallCollider args={[0.5]} density={materialProfile.density} sensor={selected} />}
      {(body.kind === "trapezium" || body.kind === "plateau") && <CuboidCollider args={[0.5, 0.35, 0.5]} density={materialProfile.density} sensor={selected} />}
      <group visible={body.visible}>
        <mesh castShadow receiveShadow material={material}>
          {body.kind === "sphere" && <sphereGeometry args={[0.46, 32, 24]} />}
          {body.kind === "box" && <boxGeometry args={[0.84, 0.84, 0.84]} />}
          {body.kind === "cylinder" && <cylinderGeometry args={[0.38, 0.38, 1, 28]} />}
          {body.kind === "cone" && <coneGeometry args={[0.48, 1, 28]} />}
          {body.kind === "triangle" && <coneGeometry args={[0.58, 1, 3]} />}
          {body.kind === "trapezium" && <cylinderGeometry args={[0.62, 0.42, 0.82, 4]} />}
          {body.kind === "plateau" && <cylinderGeometry args={[0.62, 0.62, 0.42, 8]} />}
          {body.kind === "torus" && <torusGeometry args={[0.34, 0.14, 16, 32]} />}
          {body.kind === "capsule" && <capsuleGeometry args={[0.28, 0.5, 8, 16]} />}
          {body.kind === "arc" && <torusGeometry args={[0.36, 0.14, 8, 20, Math.PI]} />}
          {body.kind === "semicircle" && <sphereGeometry args={[0.5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />}
        </mesh>
        {body.kind === "semicircle" && <mesh castShadow receiveShadow material={material} position={[0, -0.02, 0]}><cylinderGeometry args={[0.5, 0.5, 0.08, 32]} /></mesh>}
        {selected && <gridHelper args={[1.8, 8, "#f4cf72", "#6d5e2c"]} position={[0, -0.52, 0]} />}
      </group>
    </RigidBody>
  );
}

function Bodies() {
  const bodies = usePlayground((s) => s.bodies);
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  return (
    <>
      {bodies.map((body) => (
        <ShapeBody key={body.id} body={body} selected={body.id === selectedBodyId} />
      ))}
    </>
  );
}

function WeldJoints() {
  const welds = usePlayground((s) => s.welds);
  const { rapier, world } = useRapier();

  useEffect(() => {
    const joints: Array<ReturnType<typeof world.createImpulseJoint>> = [];
    for (const weld of welds) {
      const bodyA = bodyRefs.get(weld.bodyA);
      const bodyB = bodyRefs.get(weld.bodyB);
      if (!bodyA || !bodyB || !bodyA.isValid() || !bodyB.isValid()) continue;

      const translationA = bodyA.translation();
      const translationB = bodyB.translation();
      const worldAnchor = new Vector3(
        (translationA.x + translationB.x) / 2,
        (translationA.y + translationB.y) / 2,
        (translationA.z + translationB.z) / 2,
      );
      const localAnchor = (body: RapierRigidBody) => {
        const translation = body.translation();
        const rotation = body.rotation();
        const inverse = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w).invert();
        return new Vector3(worldAnchor.x - translation.x, worldAnchor.y - translation.y, worldAnchor.z - translation.z)
          .applyQuaternion(inverse);
      };
      const frame = (body: RapierRigidBody) => {
        const rotation = body.rotation();
        const inverse = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w).invert();
        return { x: inverse.x, y: inverse.y, z: inverse.z, w: inverse.w };
      };
      const localA = localAnchor(bodyA);
      const localB = localAnchor(bodyB);
      const data = rapier.JointData.fixed(
        { x: localA.x, y: localA.y, z: localA.z },
        frame(bodyA),
        { x: localB.x, y: localB.y, z: localB.z },
        frame(bodyB),
      );
      joints.push(world.createImpulseJoint(data, bodyA, bodyB, true));
    }
    return () => {
      for (const joint of joints) world.removeImpulseJoint(joint, true);
    };
  }, [rapier, welds, world]);

  return null;
}

function setNdc(event: PointerEvent, el: HTMLCanvasElement) {
  const rect = el.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

const GIZMO_AXES = [
  { axis: "x" as const, color: "#ef6b67", lineRotation: [0, 0, Math.PI / 2] as [number, number, number], end: [1.25, 0, 0] as [number, number, number] },
  { axis: "y" as const, color: "#75c58b", lineRotation: [0, 0, 0] as [number, number, number], end: [0, 1.25, 0] as [number, number, number] },
  { axis: "z" as const, color: "#72a9e8", lineRotation: [Math.PI / 2, 0, 0] as [number, number, number], end: [0, 0, 1.25] as [number, number, number] },
];

function AxisLabel({ axis, color, position }: { axis: "x" | "y" | "z"; color: string; position: [number, number, number] }) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.beginPath();
    context.arc(48, 48, 38, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#101216";
    context.font = "700 56px Outfit, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(axis.toUpperCase(), 48, 49);
    const next = new CanvasTexture(canvas);
    next.colorSpace = SRGBColorSpace;
    return next;
  }, [axis, color]);

  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <sprite position={position} scale={[0.42, 0.42, 0.42]} userData={{ rotationAxis: axis }}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function RotationGizmo() {
  const { camera, gl, raycaster } = useThree();
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const interactionMode = usePlayground((s) => s.interactionMode);
  const rotateBody = usePlayground((s) => s.rotateBody);
  const setDragging = usePlayground((s) => s.setDragging);
  const selected = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId));
  const [activeAxis, setActiveAxis] = useState<"x" | "y" | "z" | null>(null);
  const activeRotation = useRef<{
    axis: "x" | "y" | "z";
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  useFrame(() => {
    const group = rotationGizmoGroupRef.current;
    const api = selectedBodyId ? bodyRefs.get(selectedBodyId) : null;
    if (!group || !api || !api.isValid() || !selected || interactionMode !== "rotate") {
      if (group) group.visible = false;
      return;
    }
    const position = api.translation();
    const rotation = api.rotation();
    group.visible = true;
    group.position.set(position.x, position.y, position.z);
    group.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    const distance = camera.position.distanceTo(group.position);
    group.scale.setScalar(Math.max(0.72, Math.min(1.8, distance * 0.11)));
    const baseExtent = selected.kind === "box" ? 0.42 : selected.kind === "cylinder" || selected.kind === "cone" ? 0.5 : 0.5;
    const axes = GIZMO_AXES.map(({ axis }) => axis);
    axes.forEach((axis, index) => {
      const axisEntry = group.children[index];
      if (!axisEntry) return;
      const boundary = baseExtent * selected.scale[index];
      const direction = GIZMO_AXES[index].end;
      const line = axisEntry.children[0];
      const label = axisEntry.children[1];
      line.position.set(direction[0] * (boundary + 0.575), direction[1] * (boundary + 0.575), direction[2] * (boundary + 0.575));
      label.position.set(direction[0] * (boundary + 1.15), direction[1] * (boundary + 1.15), direction[2] * (boundary + 1.15));
      axisEntry.visible = activeAxis === null || activeAxis === axis;
    });
  });

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !selectedBodyId || selected?.locked) return;
      const group = rotationGizmoGroupRef.current;
      if (!group?.visible) return;
      setNdc(event, el);
      const hit = raycaster
        .intersectObject(group, true)
        .find((entry) => entry.object.userData.rotationAxis) as { object: { userData: { rotationAxis?: "x" | "y" | "z" } } } | undefined;
      const axis = hit?.object.userData.rotationAxis;
      if (!axis) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      activeRotation.current = { axis, pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
      setActiveAxis(axis);
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
      setDragging(true);
      el.style.cursor = "grabbing";
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* best-effort */
      }
    };
    const onMove = (event: PointerEvent) => {
      const active = activeRotation.current;
      if (!active || event.pointerId !== active.pointerId) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      const horizontal = event.clientX - active.lastX;
      const vertical = event.clientY - active.lastY;
      const delta = active.axis === "x" ? -vertical : horizontal;
      if (delta !== 0 && selectedBodyId) rotateBody(selectedBodyId, active.axis, delta * 0.7);
      active.lastX = event.clientX;
      active.lastY = event.clientY;
    };
    const onEnd = (event: PointerEvent) => {
      const active = activeRotation.current;
      if (!active || event.pointerId !== active.pointerId) return;
      event.stopImmediatePropagation();
      activeRotation.current = null;
      setActiveAxis(null);
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
      setDragging(false);
      el.style.cursor = "auto";
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };
    el.addEventListener("pointerdown", onDown, { capture: true });
    el.addEventListener("pointermove", onMove, { capture: true });
    el.addEventListener("pointerup", onEnd, { capture: true });
    el.addEventListener("pointercancel", onEnd, { capture: true });
    return () => {
      el.removeEventListener("pointerdown", onDown, { capture: true });
      el.removeEventListener("pointermove", onMove, { capture: true });
      el.removeEventListener("pointerup", onEnd, { capture: true });
      el.removeEventListener("pointercancel", onEnd, { capture: true });
    };
  }, [gl, raycaster, rotateBody, selected, selectedBodyId, setDragging, interactionMode]);

  return (
    <group ref={rotationGizmoGroupRef} visible={false} renderOrder={20}>
      {GIZMO_AXES.map(({ axis, color, lineRotation, end }) => (
        <group key={axis} userData={{ rotationAxis: axis }}>
          <mesh rotation={lineRotation} position={end.map((value) => value / 2) as [number, number, number]} userData={{ rotationAxis: axis }} renderOrder={21}>
            <cylinderGeometry args={[0.025, 0.025, 1.15, 8]} />
            <meshBasicMaterial color={color} depthTest={false} depthWrite={false} />
          </mesh>
          <AxisLabel axis={axis} color={color} position={end} />
        </group>
      ))}
    </group>
  );
}

function GrabController() {
  const { gl, camera, raycaster } = useThree();
  const { world, rapier } = useRapier();
  const setDragging = usePlayground((s) => s.setDragging);
  const paused = usePlayground((s) => s.paused);
  const weldMode = usePlayground((s) => s.weldMode);
  const demolitionMode = usePlayground((s) => s.demolitionMode);
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const setSelectedBodyId = usePlayground((s) => s.setSelectedBodyId);
  const interactionMode = usePlayground((s) => s.interactionMode);
  const setInteractionMode = usePlayground((s) => s.setInteractionMode);
  const activeTool = usePlayground((s) => s.activeTool);
  const weld = usePlayground((s) => s.weld);
  const unweld = usePlayground((s) => s.unweld);
  const grab = useRef<{
    body: RapierRigidBody;
    offset: Vector3;
    planePoint: Vector3;
    last: Vector3;
    velocity: Vector3;
    lastTime: number;
    pointerId: number;
  } | null>(null);
  const lastTap = useRef<{ id: string; time: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";

    const pickDynamic = () => {
      raycaster.setFromCamera(pointerNdc, camera);
      rayOrigin.x = raycaster.ray.origin.x;
      rayOrigin.y = raycaster.ray.origin.y;
      rayOrigin.z = raycaster.ray.origin.z;
      rayDir.x = raycaster.ray.direction.x;
      rayDir.y = raycaster.ray.direction.y;
      rayDir.z = raycaster.ray.direction.z;
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const hit = world.castRay(
        ray,
        48,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        (collider) => {
          const parent = collider.parent();
          return parent !== null && (parent.isDynamic() || parent.isKinematic());
        },
      );
      if (!hit) return null;
      const parent = hit.collider.parent();
      if (!parent) return null;
      const point = ray.pointAt(hit.timeOfImpact);
      return {
        body: parent,
        point: new Vector3(point.x, point.y, point.z),
      };
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      setNdc(event, el);
      const gizmo = rotationGizmoGroupRef.current;
      if (gizmo?.visible && raycaster.intersectObject(gizmo, true).some((entry) => entry.object.userData.rotationAxis)) {
        return;
      }
      const picked = pickDynamic();
      if (!picked || !picked.body.isValid()) {
        if ((activeTool === "select" || activeTool === "scale") && interactionMode === "move") setSelectedBodyId(null);
        return;
      }

      event.stopImmediatePropagation();
      event.preventDefault();
      window.dispatchEvent(new Event("dropyard:scene-touch"));

      if (weldMode || demolitionMode) {
        const pickedId = bodyIdFor(picked.body);
        if (!pickedId) return;
        if (demolitionMode && usePlayground.getState().bodies.some((body) => (body.id === selectedBodyId || body.id === pickedId) && body.groupId)) return;
        if (!selectedBodyId || selectedBodyId === pickedId) {
          setSelectedBodyId(pickedId);
          return;
        }
        if (demolitionMode) {
          unweld(selectedBodyId, pickedId);
          return;
        }
        const first = bodyRefs.get(selectedBodyId);
        if (!first || !first.isValid()) {
          setSelectedBodyId(pickedId);
          return;
        }
        const firstPosition = first.translation();
        const secondPosition = picked.body.translation();
        const offset = new Vector3(
          secondPosition.x - firstPosition.x,
          secondPosition.y - firstPosition.y,
          secondPosition.z - firstPosition.z,
        );
        if (offset.length() > 2.4) {
          setSelectedBodyId(pickedId);
          return;
        }
        const direction = offset.lengthSq() > 0.0001 ? offset.normalize() : new Vector3(1, 0, 0);
        const snapped = new Vector3(firstPosition.x, firstPosition.y, firstPosition.z).add(
          direction.multiplyScalar(0.9),
        );
        picked.body.setTranslation({ x: snapped.x, y: snapped.y, z: snapped.z }, true);
        picked.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        picked.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        weld(selectedBodyId, pickedId);
        return;
      }

      const pickedId = bodyIdFor(picked.body);
      if (pickedId) {
        const now = performance.now();
        const isDoubleTap = lastTap.current?.id === pickedId && now - lastTap.current.time < 360;
        lastTap.current = { id: pickedId, time: now };
        if (activeTool === "select" && isDoubleTap && selectedBodyId === pickedId) {
          setInteractionMode(interactionMode === "rotate" ? "move" : "rotate");
        } else {
          setInteractionMode("move");
          setSelectedBodyId(pickedId);
        }
      }
      const pickedState = usePlayground.getState().bodies.find((body) => body.id === pickedId);
      if (pickedState?.locked) return;
      picked.body.wakeUp();
      picked.body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
      picked.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const translation = picked.body.translation();
      grab.current = {
        body: picked.body,
        offset: new Vector3(
          picked.point.x - translation.x,
          picked.point.y - translation.y,
          picked.point.z - translation.z,
        ),
        planePoint: picked.point,
        last: new Vector3(translation.x, translation.y, translation.z),
        velocity: new Vector3(),
        lastTime: performance.now(),
        pointerId: event.pointerId,
      };
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
      setDragging(true);
      el.style.cursor = "grabbing";
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* best-effort */
      }
    };

    const onMove = (event: PointerEvent) => {
      setNdc(event, el);
      if (grab.current) return;
      el.style.cursor = pickDynamic() ? "grab" : "auto";
    };

    const onEnd = (event: PointerEvent) => {
      const active = grab.current;
      if (!active || event.pointerId !== active.pointerId) return;
      if (active.body.isValid()) {
        const remainsInEditMode = selectedBodyId !== null && bodyIdFor(active.body) === selectedBodyId;
        if (!remainsInEditMode) {
          active.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
          const speed = active.velocity.length();
          if (speed > 18) active.velocity.multiplyScalar(18 / speed);
          active.body.setLinvel(
            { x: active.velocity.x, y: active.velocity.y, z: active.velocity.z },
            true,
          );
        } else {
          active.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          active.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
      grab.current = null;
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
      setDragging(false);
      el.style.cursor = "auto";
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const preventMenu = (event: Event) => event.preventDefault();
    el.addEventListener("pointerdown", onDown, { capture: true });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointercancel", onEnd);
    el.addEventListener("contextmenu", preventMenu);
    return () => {
      el.removeEventListener("pointerdown", onDown, { capture: true });
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointercancel", onEnd);
      el.removeEventListener("contextmenu", preventMenu);
    };
  }, [
    camera,
    gl,
    rapier,
    raycaster,
    selectedBodyId,
    activeTool,
    interactionMode,
    setInteractionMode,
    setDragging,
    setSelectedBodyId,
    weld,
    unweld,
    demolitionMode,
    weldMode,
    world,
  ]);

  useFrame(() => {
    const active = grab.current;
    if (!active || !active.body.isValid()) return;

    camera.getWorldDirection(camDir);
    grabPlane.setFromNormalAndCoplanarPoint(camDir, active.planePoint);
    raycaster.setFromCamera(pointerNdc, camera);
    if (!raycaster.ray.intersectPlane(grabPlane, planeHit)) return;

    grabTarget.copy(planeHit).sub(active.offset);
    grabTarget.y = Math.max(GRAB_Y_MIN, grabTarget.y);
    const radial = Math.hypot(grabTarget.x, grabTarget.z);
    if (radial > ARENA_RADIUS) {
      const scale = ARENA_RADIUS / radial;
      grabTarget.x *= scale;
      grabTarget.z *= scale;
    }

    const now = performance.now();
    const dt = Math.min(0.08, Math.max(1 / 120, (now - active.lastTime) / 1000));
    grabVel.copy(grabTarget).sub(active.last).divideScalar(dt);
    active.velocity.lerp(grabVel, 0.45);
    active.last.copy(grabTarget);
    active.lastTime = now;

    active.body.setNextKinematicTranslation(grabTarget);
    if (paused) active.body.setTranslation(grabTarget, true);
  });

  return null;
}

function BodyCuller() {
  const bodies = usePlayground((s) => s.bodies);
  const remove = usePlayground((s) => s.remove);
  const dragging = usePlayground((s) => s.dragging);

  useFrame(() => {
    if (dragging) return;
    for (const body of bodies) {
      const rb = bodyRefs.get(body.id);
      if (!rb || !rb.isValid()) continue;
      const position = rb.translation();
      const radius = (body.kind === "box" ? 0.42 : body.kind === "cylinder" || body.kind === "cone" ? 0.5 : 0.5) * Math.max(...body.scale);
      if (position.y < radius) {
        rb.setTranslation({ x: position.x, y: radius, z: position.z }, true);
        const velocity = rb.linvel();
        if (velocity.y < 0) rb.setLinvel({ x: velocity.x, y: 0, z: velocity.z }, true);
      }
      const rotation = rb.rotation();
      const euler = new Euler().setFromQuaternion(
        new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
      );
      liveBodyPoses.set(body.id, {
        position: [position.x, position.y, position.z],
        rotation: [euler.x, euler.y, euler.z],
      });
      if (position.y < FALL_KILL) remove(body.id);
    }
  });

  return null;
}

export default function PhysicsScene() {
  const gravity = usePlayground((s) => s.gravity);
  const paused = usePlayground((s) => s.paused);

  return (
    <Physics
      gravity={[0, -gravity, 0]}
      timeStep={1 / 60}
      interpolate
      paused={paused}
      numSolverIterations={10}
      numInternalPgsIterations={4}
      maxCcdSubsteps={2}
    >
      <PhysicsArena />
      <Bodies />
      <WeldJoints />
      <RotationGizmo />
      <GrabController />
      <BodyCuller />
    </Physics>
  );
}
