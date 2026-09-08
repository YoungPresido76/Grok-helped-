import { create } from "zustand";

export type ShapeKind = "sphere" | "box" | "cylinder" | "cone" | "torus" | "capsule";
export type MaterialKind = "wood" | "steel" | "glass";

export type SpawnedBody = {
  id: string;
  kind: ShapeKind;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material: MaterialKind;
  locked: boolean;
  color: string;
  angularVelocity: [number, number, number];
};

export type Weld = {
  id: string;
  bodyA: string;
  bodyB: string;
};

export type SavedStructure = {
  version: 1 | 2;
  savedAt: string;
  bodies: SpawnedBody[];
  welds: Weld[];
  gravity: number;
  restitution: number;
};

export type NamedPlayground = SavedStructure & { name: string };

export type PresetKind = "wall" | "floor" | "pillar" | "room" | "bridge";
export type ConstructionTool = "spawn" | "select" | "weld" | "demolish" | "scale";

export const STRUCTURE_STORAGE_KEY = "dropyard.structure.v1";
export const PLAYGROUNDS_STORAGE_KEY = "dropyard.playgrounds.v1";
export const liveBodyPoses = new Map<
  string,
  { position: [number, number, number]; rotation: [number, number, number] }
>();

const MAX_BODIES = 72;

const PALETTES: Record<ShapeKind, string[]> = {
  sphere: ["#c56a4a", "#d07a58", "#b85c40", "#a8523a"],
  box: ["#3d6b6a", "#4a7c74", "#355e62", "#2f5850"],
  cylinder: ["#bba57e", "#c9b48a", "#a8946c", "#9a8662"],
  cone: ["#b26c45", "#c17a4f", "#9d5c3b", "#8d5037"],
  torus: ["#8b6cae", "#9a7cba", "#755990", "#674d82"],
  capsule: ["#5e8db0", "#6da0c3", "#4d7798", "#416885"],
};

export const MATERIALS: Record<MaterialKind, { label: string; density: number; friction: number; restitution: number; color: string }> = {
  wood: { label: "Wood", density: 0.65, friction: 0.82, restitution: 0.08, color: "#b8794f" },
  steel: { label: "Steel", density: 7.8, friction: 0.48, restitution: 0.03, color: "#71808a" },
  glass: { label: "Glass", density: 2.5, friction: 0.24, restitution: 0.12, color: "#8fc8d6" },
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
      (value.version !== 1 && value.version !== 2) ||
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
        ["sphere", "box", "cylinder", "cone", "torus", "capsule"].includes(body.kind) &&
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
      material: (body as SpawnedBody & { material?: MaterialKind }).material ?? "wood",
      locked: Boolean((body as SpawnedBody & { locked?: unknown }).locked),
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
      version: value.version,
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
  const spread = kind === "cylinder" || kind === "cone" || kind === "capsule" ? 1.6 : 1.15;
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
    material: "wood",
    locked: false,
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
  spawnCount: number;
  savedPlaygrounds: NamedPlayground[];
  spawn: (kind: ShapeKind, position?: [number, number, number]) => void;
  scatter: () => void;
  remove: (id: string) => void;
  duplicateSelected: () => void;
  clear: () => void;
  weld: (bodyA: string, bodyB: string) => void;
  unweld: (bodyA: string, bodyB: string) => void;
  setWeldMode: (value: boolean) => void;
  setDemolitionMode: (value: boolean) => void;
  setActiveTool: (tool: ConstructionTool) => void;
  setSelectedBodyId: (id: string | null) => void;
  setSelectedMaterial: (material: MaterialKind) => void;
  toggleSelectedLock: () => void;
  setSpawnCount: (count: number) => void;
  setBodyPose: (
    id: string,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => void;
  transformSelected: (rotationDelta: number, scaleFactor: number) => void;
  moveSelected: (axis: "x" | "y" | "z", distance: number) => void;
  rotateSelected: (axis: "x" | "y" | "z", degrees: number) => void;
  rotateBody: (id: string, axis: "x" | "y" | "z", degrees: number) => void;
  uprightSelected: () => void;
  spawnPreset: (preset: PresetKind) => void;
  saveStructure: () => boolean;
  saveNamed: (name: string) => boolean;
  loadNamed: (name: string) => boolean;
  deleteNamed: (name: string) => void;
  hydrateSavedPlaygrounds: () => void;
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
  spawnCount: 1,
  savedPlaygrounds: [],
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
      const kinds: ShapeKind[] = ["sphere", "box", "cylinder", "cone", "torus", "capsule"];
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
  duplicateSelected: () =>
    set((state) => {
      const source = state.bodies.find((body) => body.id === state.selectedBodyId);
      if (!source) return state;
      const copy = {
        ...source,
        id: nextId(),
        position: [source.position[0] + 1.1, source.position[1] + 0.4, source.position[2]] as [number, number, number],
        locked: false,
        angularVelocity: [0, 0, 0] as [number, number, number],
      };
      return { bodies: [...state.bodies, copy].slice(-MAX_BODIES), selectedBodyId: copy.id };
    }),
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
    set((state) => ({
      activeTool: tool,
      weldMode: tool === "weld",
      demolitionMode: tool === "demolish",
      selectedBodyId: tool === "spawn" || tool === "demolish" ? null : state.selectedBodyId,
    })),
  setSelectedBodyId: (id) => set({ selectedBodyId: id }),
  setSelectedMaterial: (material) =>
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === state.selectedBodyId
          ? { ...body, material, color: MATERIALS[material].color }
          : body,
      ),
    })),
  toggleSelectedLock: () =>
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === state.selectedBodyId ? { ...body, locked: !body.locked } : body,
      ),
    })),
  setSpawnCount: (count) => set({ spawnCount: Math.max(1, Math.min(10, Math.round(count))) }),
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
  moveSelected: (axis, distance) =>
    set((state) => ({
      bodies: state.bodies.map((body) => {
        if (body.id !== state.selectedBodyId) return body;
        const position = [...body.position] as [number, number, number];
        const index = axis === "x" ? 0 : axis === "y" ? 1 : 2;
        position[index] += distance;
        position[1] = Math.max(0.5, position[1]);
        return { ...body, position };
      }),
    })),
  rotateSelected: (axis, degrees) =>
    set((state) => ({
      bodies: state.bodies.map((body) => {
        if (body.id !== state.selectedBodyId) return body;
        const rotation = [...body.rotation] as [number, number, number];
        const index = axis === "x" ? 0 : axis === "y" ? 1 : 2;
        rotation[index] += (degrees * Math.PI) / 180;
        return { ...body, rotation };
      }),
    })),
  rotateBody: (id, axis, degrees) =>
    set((state) => ({
      bodies: state.bodies.map((body) => {
        if (body.id !== id) return body;
        const rotation = [...body.rotation] as [number, number, number];
        const index = axis === "x" ? 0 : axis === "y" ? 1 : 2;
        rotation[index] += (degrees * Math.PI) / 180;
        return { ...body, rotation };
      }),
    })),
  uprightSelected: () =>
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === state.selectedBodyId
          ? { ...body, rotation: [0, body.rotation[1], 0] as [number, number, number] }
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
              add("box", [(index - 2) * 1.55, 0.35, 0], [1.8, 0.65, 0.7]),
            )
          : preset === "floor"
            ? [add("box", [0, 0.15, 0], [4.8, 0.3, 4.8])]
            : preset === "pillar"
              ? [
                add("cylinder", [-2.6, 1.7, -2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [2.6, 1.7, -2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [-2.6, 1.7, 2.6], [0.9, 3.4, 0.9]),
                add("cylinder", [2.6, 1.7, 2.6], [0.9, 3.4, 0.9]),
              ]
              : preset === "room"
                ? [
                    add("box", [-2.4, 1.2, 0], [0.35, 1.2, 3.2]),
                    add("box", [2.4, 1.2, 0], [0.35, 1.2, 3.2]),
                    add("box", [0, 1.2, -2.85], [2.8, 1.2, 0.35]),
                    add("box", [0, 2.6, 0], [2.8, 0.25, 3.2]),
                  ]
                : [
                    add("box", [0, 0.2, 0], [4.8, 0.3, 1.4]),
                    add("box", [-3.5, 1.2, 0], [0.35, 1.2, 1.4]),
                    add("box", [3.5, 1.2, 0], [0.35, 1.2, 1.4]),
                  ];
      const next = [...state.bodies, ...pieces].slice(-MAX_BODIES);
      const liveIds = new Set(next.map((body) => body.id));
      return {
        bodies: next,
        welds: state.welds.filter((weld) => liveIds.has(weld.bodyA) && liveIds.has(weld.bodyB)),
      };
    }),
  saveNamed: (name) => {
    if (typeof window === "undefined" || !name.trim()) return false;
    const state = usePlayground.getState();
    const snapshot: NamedPlayground = {
      name: name.trim(),
      version: 2,
      savedAt: new Date().toISOString(),
      bodies: state.bodies.map((body) => ({ ...body, ...(liveBodyPoses.get(body.id) ?? {}) })),
      welds: state.welds,
      gravity: state.gravity,
      restitution: state.restitution,
    };
    try {
      const existing = JSON.parse(window.localStorage.getItem(PLAYGROUNDS_STORAGE_KEY) ?? "[]") as NamedPlayground[];
      const next = [...existing.filter((entry) => entry.name !== snapshot.name), snapshot].slice(-20);
      window.localStorage.setItem(PLAYGROUNDS_STORAGE_KEY, JSON.stringify(next));
      set({ savedPlaygrounds: next });
      return true;
    } catch {
      return false;
    }
  },
  loadNamed: (name) => {
    if (typeof window === "undefined") return false;
    try {
      const entries = JSON.parse(window.localStorage.getItem(PLAYGROUNDS_STORAGE_KEY) ?? "[]") as NamedPlayground[];
      const saved = parseSavedStructure(JSON.stringify(entries.find((entry) => entry.name === name)));
      if (!saved) return false;
      set({ bodies: saved.bodies, welds: saved.welds, gravity: saved.gravity, restitution: saved.restitution, selectedBodyId: null, activeTool: "spawn", weldMode: false, demolitionMode: false });
      liveBodyPoses.clear();
      return true;
    } catch {
      return false;
    }
  },
  deleteNamed: (name) => {
    if (typeof window === "undefined") return;
    try {
      const next = (JSON.parse(window.localStorage.getItem(PLAYGROUNDS_STORAGE_KEY) ?? "[]") as NamedPlayground[]).filter((entry) => entry.name !== name);
      window.localStorage.setItem(PLAYGROUNDS_STORAGE_KEY, JSON.stringify(next));
      set({ savedPlaygrounds: next });
    } catch {
      /* ignore malformed local storage */
    }
  },
  hydrateSavedPlaygrounds: () => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(PLAYGROUNDS_STORAGE_KEY) ?? "[]") as NamedPlayground[];
      set({ savedPlaygrounds: saved.filter((entry) => typeof entry.name === "string") });
    } catch {
      set({ savedPlaygrounds: [] });
    }
  },
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
