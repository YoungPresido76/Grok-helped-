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
import { useEffect, useMemo, useRef } from "react";
import { Color, Euler, MeshStandardMaterial, Plane, Quaternion, Vector2, Vector3 } from "three";
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
    const euler = new Euler(body.rotation[0], body.rotation[1], body.rotation[2]);
    const quaternion = new Quaternion().setFromEuler(euler);
    api.setTranslation({ x: body.position[0], y: body.position[1], z: body.position[2] }, true);
    api.setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }, true);
    api.setLinvel({ x: 0, y: 0, z: 0 }, true);
    api.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }, [body.id, body.position, body.rotation]);

  return (
    <RigidBody
      ref={(api) => {
        if (api) bodyRefs.set(body.id, api);
        else bodyRefs.delete(body.id);
      }}
      type={body.locked ? "kinematicPosition" : "dynamic"}
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
      {body.kind === "sphere" && <BallCollider args={[0.46]} density={materialProfile.density} />}
      {body.kind === "box" && <CuboidCollider args={[0.42, 0.42, 0.42]} density={materialProfile.density} />}
      {body.kind === "cylinder" && <CylinderCollider args={[0.5, 0.38]} density={materialProfile.density} />}
      <mesh castShadow receiveShadow material={material}>
        {body.kind === "sphere" && <sphereGeometry args={[0.46, 32, 24]} />}
        {body.kind === "box" && <boxGeometry args={[0.84, 0.84, 0.84]} />}
        {body.kind === "cylinder" && <cylinderGeometry args={[0.38, 0.38, 1, 28]} />}
      </mesh>
      {selected && <gridHelper args={[1.8, 8, "#f4cf72", "#6d5e2c"]} position={[0, -0.52, 0]} />}
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

function GrabController() {
  const { gl, camera, raycaster } = useThree();
  const { world, rapier } = useRapier();
  const setDragging = usePlayground((s) => s.setDragging);
  const paused = usePlayground((s) => s.paused);
  const weldMode = usePlayground((s) => s.weldMode);
  const demolitionMode = usePlayground((s) => s.demolitionMode);
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const setSelectedBodyId = usePlayground((s) => s.setSelectedBodyId);
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
          return parent !== null && parent.isDynamic();
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
      const picked = pickDynamic();
      if (!picked || !picked.body.isValid()) return;

      event.stopImmediatePropagation();
      event.preventDefault();
      window.dispatchEvent(new Event("dropyard:scene-touch"));

      if (weldMode || demolitionMode) {
        const pickedId = bodyIdFor(picked.body);
        if (!pickedId) return;
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
      if (pickedId) setSelectedBodyId(pickedId);
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
        active.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
        const speed = active.velocity.length();
        if (speed > 18) active.velocity.multiplyScalar(18 / speed);
        active.body.setLinvel(
          { x: active.velocity.x, y: active.velocity.y, z: active.velocity.z },
          true,
        );
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
      <GrabController />
      <BodyCuller />
    </Physics>
  );
}
