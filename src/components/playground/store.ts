import { create } from "zustand";

export type ShapeKind = "sphere" | "box" | "cylinder";

export type SpawnedBody = {
  id: string;
  kind: ShapeKind;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  angularVelocity: [number, number, number];
};

export type Weld = {
  id: string;
  bodyA: string;
  bodyB: string;
};

export type SavedStructure = {
  version: 1;
  savedAt: string;
  bodies: SpawnedBody[];
  welds: Weld[];
  gravity: number;
  restitution: number;
};

export type PresetKind = "wall" | "floor" | "pillar";
export type ConstructionTool = "spawn" | "weld" | "demolish" | "scale";

export const STRUCTURE_STORAGE_KEY = "dropyard.structure.v1";
export const liveBodyPoses = new Map<
  string,
  { position: [number, number, number]; rotation: [number, number, number] }
>();

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

function isTuple(value: unknown, length: number): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

function parseSavedStructure(raw: string | null): SavedStructure | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SavedStructure>;
    if (
      value.version !== 1 ||
      !Array.isArray(value.bodies) ||
      !Array.isArray(value.welds) ||
      typeof value.gravity !== "number" ||
      typeof value.restitution !== "number"
    ) {
      return null;
    }
    const bodies = value.bodies.filter(
      (body): body is SpawnedBody =>
        Boolean(body) &&
        typeof body.id === "string" &&
        ["sphere", "box", "cylinder"].includes(body.kind) &&
        isTuple(body.position, 3) &&
        isTuple(body.rotation, 3) &&
        isTuple(body.angularVelocity, 3) &&
        typeof body.color === "string",
    );
    const normalizedBodies = bodies.map((body) => ({
      ...body,
      scale: isTuple((body as SpawnedBody & { scale?: unknown }).scale, 3)
        ? (body as SpawnedBody).scale
        : ([1, 1, 1] as [number, number, number]),
    }));
    const ids = new Set(normalizedBodies.map((body) => body.id));
    const welds = value.welds.filter(
      (weld): weld is Weld =>
        Boolean(weld) &&
        typeof weld.id === "string" &&
        typeof weld.bodyA === "string" &&
        typeof weld.bodyB === "string" &&
        weld.bodyA !== weld.bodyB &&
        ids.has(weld.bodyA) &&
        ids.has(weld.bodyB),
    );
    return {
      version: 1,
      savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
      bodies: normalizedBodies,
      welds,
      gravity: Math.max(0, Math.min(20, value.gravity)),
      restitution: Math.max(0, Math.min(1, value.restitution)),
    };
  } catch {
    return null;
  }
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
    scale: [1, 1, 1],
    color: pick(PALETTES[kind]),
    // A small initial spin gives the pile life without making every piece
    // tumble like a rubber toy when it lands.
    angularVelocity: [rand(-0.28, 0.28), rand(-0.4, 0.4), rand(-0.28, 0.28)],
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
  welds: Weld[];
  gravity: number;
  restitution: number;
  paused: boolean;
  dragging: boolean;
  weldMode: boolean;
  demolitionMode: boolean;
  activeTool: ConstructionTool;
  selectedBodyId: string | null;
  spawn: (kind: ShapeKind, position?: [number, number, number]) => void;
  scatter: () => void;
  remove: (id: string) => void;
  clear: () => void;
  weld: (bodyA: string, bodyB: string) => void;
  unweld: (bodyA: string, bodyB: string) => void;
  setWeldMode: (value: boolean) => void;
  setDemolitionMode: (value: boolean) => void;
  setActiveTool: (tool: ConstructionTool) => void;
  setSelectedBodyId: (id: string | null) => void;
  setBodyPose: (
    id: string,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => void;
  transformSelected: (rotationDelta: number, scaleFactor: number) => void;
  spawnPreset: (preset: PresetKind) => void;
  saveStructure: () => boolean;
  loadStructure: () => boolean;
  setGravity: (value: number) => void;
  setRestitution: (value: number) => void;
  togglePaused: () => void;
  setDragging: (value: boolean) => void;
};

export const usePlayground = create<PlaygroundState>((set) => ({
  bodies: demoPile(),
  welds: [],
  gravity: 9.81,
  // Most everyday materials lose almost all of their impact energy. Users
  // can still raise this with the Bounce control for deliberately bouncy scenes.
  restitution: 0.08,
  paused: false,
  dragging: false,
  weldMode: false,
  demolitionMode: false,
  activeTool: "spawn",
  selectedBodyId: null,
  spawn: (kind, position) =>
    set((state) => {
      const next = [...state.bodies, makeBody(kind, position)];
      if (next.length > MAX_BODIES) next.splice(0, next.length - MAX_BODIES);
      const liveIds = new Set(next.map((body) => body.id));
      return {
        bodies: next,
        welds: state.welds.filter((weld) => liveIds.has(weld.bodyA) && liveIds.has(weld.bodyB)),
      };
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
      const liveIds = new Set(next.map((body) => body.id));
      return {
        bodies: next,
        welds: state.welds.filter((weld) => liveIds.has(weld.bodyA) && liveIds.has(weld.bodyB)),
      };
    }),
  remove: (id) =>
    set((state) => ({
      bodies: state.bodies.filter((body) => body.id !== id),
      welds: state.welds.filter((weld) => weld.bodyA !== id && weld.bodyB !== id),
      selectedBodyId: state.selectedBodyId === id ? null : state.selectedBodyId,
    })),
  clear: () => set({ bodies: [], welds: [], selectedBodyId: null }),
  weld: (bodyA, bodyB) =>
    set((state) => {
      if (bodyA === bodyB) return state;
      const exists = state.welds.some(
        (weld) =>
          (weld.bodyA === bodyA && weld.bodyB === bodyB) ||
          (weld.bodyA === bodyB && weld.bodyB === bodyA),
      );
      if (exists) return { selectedBodyId: null };
      return {
        welds: [...state.welds, { id: `weld-${bodyA}-${bodyB}`, bodyA, bodyB }],
        selectedBodyId: null,
      };
    }),
  unweld: (bodyA, bodyB) =>
    set((state) => ({
      welds: state.welds.filter(
        (weld) =>
          !(
            (weld.bodyA === bodyA && weld.bodyB === bodyB) ||
            (weld.bodyA === bodyB && weld.bodyB === bodyA)
          ),
      ),
      selectedBodyId: null,
    })),
  setWeldMode: (value) =>
    set({ weldMode: value, demolitionMode: false, activeTool: value ? "weld" : "spawn", selectedBodyId: null }),
  setDemolitionMode: (value) =>
    set({ demolitionMode: value, weldMode: false, activeTool: value ? "demolish" : "spawn", selectedBodyId: null }),
  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      weldMode: tool === "weld",
      demolitionMode: tool === "demolish",
      selectedBodyId: null,
    }),
  setSelectedBodyId: (id) => set({ selectedBodyId: id }),
  setBodyPose: (id, position, rotation) =>
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === id ? { ...body, position, ...(rotation ? { rotation } : {}) } : body,
      ),
    })),
  transformSelected: (rotationDelta, scaleFactor) =>
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === state.selectedBodyId
          ? {
              ...body,
              rotation: [body.rotation[0], body.rotation[1] + rotationDelta, body.rotation[2]],
              scale: body.scale.map((value) => Math.max(0.25, Math.min(4, value * scaleFactor))) as [
                number,
                number,
                number,
              ],
            }
          : body,
      ),
    })),
  spawnPreset: (preset) =>
    set((state) => {
      const add = (
        kind: ShapeKind,
        position: [number, number, number],
        scale: [number, number, number],
      ) => ({
        ...makeBody(kind, position),
        scale,
        rotation: [0, 0, 0] as [number, number, number],
        angularVelocity: [0, 0, 0] as [number, number, number],
      });
      const pieces =
        preset === "wall"
          ? Array.from({ length: 5 }, (_, index) =>
              add("box", [(index - 2) * 1.55, 0.1, 0], [1.8, 0.65, 0.7]),
            )
          : preset === "floor"
            ? [add("box", [0, -0.55, 0], [4.8, 0.3, 4.8])]
            : [
                add("cylinder", [-2.6, 1.7, -2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [2.6, 1.7, -2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [-2.6, 1.7, 2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [2.6, 1.7, 2.6], [0.9, 3.4, 0.9]),
              ];
      const next = [...state.bodies, ...pieces].slice(-MAX_BODIES);
      const liveIds = new Set(next.map((body) => body.id));
      return {
        bodies: next,
        welds: state.welds.filter((weld) => liveIds.has(weld.bodyA) && liveIds.has(weld.bodyB)),
      };
    }),
  saveStructure: () => {
    if (typeof window === "undefined") return false;
    const state = usePlayground.getState();
    const snapshot: SavedStructure = {
      version: 1,
      savedAt: new Date().toISOString(),
      bodies: state.bodies.map((body) => {
        const live = liveBodyPoses.get(body.id);
        return live ? { ...body, ...live } : body;
      }),
      welds: state.welds,
      gravity: state.gravity,
      restitution: state.restitution,
    };
    try {
      window.localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  },
  loadStructure: () => {
    if (typeof window === "undefined") return false;
    const saved = parseSavedStructure(window.localStorage.getItem(STRUCTURE_STORAGE_KEY));
    if (!saved) return false;
    const maxSequence = saved.bodies.reduce((max, body) => {
      const match = body.id.match(/^body-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0);
    seq = Math.max(seq, maxSequence);
    set({
      bodies: saved.bodies,
      welds: saved.welds,
      gravity: saved.gravity,
      restitution: saved.restitution,
      selectedBodyId: null,
      weldMode: false,
      demolitionMode: false,
      activeTool: "spawn",
    });
    liveBodyPoses.clear();
    return true;
  },
  setGravity: (value) => set({ gravity: value }),
  setRestitution: (value) => set({ restitution: value }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  setDragging: (value) => set({ dragging: value }),
}));
