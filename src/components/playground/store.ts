import { create } from "zustand";

export type ShapeKind = "sphere" | "box" | "cylinder";

export type SpawnedBody = {
  id: string;
  kind: ShapeKind;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  angularVelocity: [number, number, number];
};

const MAX_BODIES = 72;

const PALETTES: Record<ShapeKind, string[]> = {
  sphere: ["#c56a4a", "#d07a58", "#b85c40", "#a8523a"],
  box: ["#3d6b6a", "#4a7c74", "#355e62", "#2f5850"],
  cylinder: ["#bba57e", "#c9b48a", "#a8946c", "#9a8662"],
};

let seq = 0;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function nextId() {
  seq += 1;
  return `body-${seq}`;
}

export function makeBody(
  kind: ShapeKind,
  position?: [number, number, number],
): SpawnedBody {
  const spread = kind === "cylinder" ? 1.6 : 1.15;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * spread;
  return {
    id: nextId(),
    kind,
    position: position ?? [
      Math.cos(angle) * radius,
      rand(5.2, 7.4),
      Math.sin(angle) * radius,
    ],
    rotation: [rand(-0.35, 0.35), rand(-Math.PI, Math.PI), rand(-0.35, 0.35)],
    color: pick(PALETTES[kind]),
    angularVelocity: [rand(-1.2, 1.2), rand(-1.6, 1.6), rand(-1.2, 1.2)],
  };
}

function demoPile(): SpawnedBody[] {
  return [
    makeBody("box", [0.02, 5.4, -0.04]),
    makeBody("box", [-0.08, 6.3, 0.06]),
    makeBody("box", [0.12, 7.2, -0.02]),
    makeBody("sphere", [0.28, 8.4, 0.1]),
    makeBody("cylinder", [-1.35, 6.8, 0.55]),
    makeBody("sphere", [1.45, 7.6, -0.7]),
  ];
}

type PlaygroundState = {
  bodies: SpawnedBody[];
  gravity: number;
  restitution: number;
  paused: boolean;
  dragging: boolean;
  spawn: (kind: ShapeKind, position?: [number, number, number]) => void;
  scatter: () => void;
  remove: (id: string) => void;
  clear: () => void;
  setGravity: (value: number) => void;
  setRestitution: (value: number) => void;
  togglePaused: () => void;
  setDragging: (value: boolean) => void;
};

export const usePlayground = create<PlaygroundState>((set) => ({
  bodies: demoPile(),
  gravity: 9.81,
  restitution: 0.38,
  paused: false,
  dragging: false,
  spawn: (kind, position) =>
    set((state) => {
      const next = [...state.bodies, makeBody(kind, position)];
      if (next.length > MAX_BODIES) next.splice(0, next.length - MAX_BODIES);
      return { bodies: next };
    }),
  scatter: () =>
    set((state) => {
      const kinds: ShapeKind[] = ["sphere", "box", "cylinder"];
      const extra: SpawnedBody[] = Array.from({ length: 9 }, (_, i) => {
        const kind = kinds[i % 3] as ShapeKind;
        const angle = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2);
        const radius = rand(0.3, 1.8);
        return makeBody(kind, [
          Math.cos(angle) * radius,
          rand(6.5, 9.5),
          Math.sin(angle) * radius,
        ]);
      });
      const next = [...state.bodies, ...extra];
      if (next.length > MAX_BODIES) next.splice(0, next.length - MAX_BODIES);
      return { bodies: next };
    }),
  remove: (id) =>
    set((state) => ({ bodies: state.bodies.filter((body) => body.id !== id) })),
  clear: () => set({ bodies: [] }),
  setGravity: (value) => set({ gravity: value }),
  setRestitution: (value) => set({ restitution: value }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  setDragging: (value) => set({ dragging: value }),
}));
