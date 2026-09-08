import {
  Circle,
  Cuboid,
  Cylinder,
  FolderOpen,
  Link2,
  Maximize2,
  Unlink2,
  Pause,
  Play,
  RotateCw,
  Save,
  Shuffle,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayground, type PresetKind, type ShapeKind } from "./store";

const SHAPES: { kind: ShapeKind; label: string; icon: typeof Circle }[] = [
  { kind: "sphere", label: "Sphere", icon: Circle },
  { kind: "box", label: "Box", icon: Cuboid },
  { kind: "cylinder", label: "Cylinder", icon: Cylinder },
];

export function Toolbar() {
  const spawn = usePlayground((s) => s.spawn);
  const scatter = usePlayground((s) => s.scatter);
  const clear = usePlayground((s) => s.clear);
  const gravity = usePlayground((s) => s.gravity);
  const restitution = usePlayground((s) => s.restitution);
  const setGravity = usePlayground((s) => s.setGravity);
  const setRestitution = usePlayground((s) => s.setRestitution);
  const paused = usePlayground((s) => s.paused);
  const togglePaused = usePlayground((s) => s.togglePaused);
  const count = usePlayground((s) => s.bodies.length);
  const weldMode = usePlayground((s) => s.weldMode);
  const demolitionMode = usePlayground((s) => s.demolitionMode);
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const setWeldMode = usePlayground((s) => s.setWeldMode);
  const setDemolitionMode = usePlayground((s) => s.setDemolitionMode);
  const saveStructure = usePlayground((s) => s.saveStructure);
  const loadStructure = usePlayground((s) => s.loadStructure);
  const transformSelected = usePlayground((s) => s.transformSelected);
  const spawnPreset = usePlayground((s) => s.spawnPreset);
  const selected = usePlayground((s) => s.selectedBodyId !== null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (loadStructure()) setStatus("Loaded saved structure");
  }, [loadStructure]);

  const handleSave = () => {
    setStatus(saveStructure() ? "Structure saved on this device" : "Could not save structure");
  };

  const handleLoad = () => {
    setStatus(loadStructure() ? "Structure loaded" : "No saved structure found");
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
      <header className="pointer-events-none flex items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-fg text-balance sm:text-2xl">
            Dropyard
          </h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">Physics playground</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <p className="rounded-sm border border-border bg-surface px-3 py-2 text-xs font-medium tabular-nums text-muted">
            <span className="text-fg">{count}</span> bodies
          </p>
          <Button
            variant="muted"
            size="icon"
            onClick={togglePaused}
            aria-label={paused ? "Resume simulation" : "Pause simulation"}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
        </div>
      </header>

      <div className="pointer-events-none flex flex-col items-center gap-3">
        <p className="hidden text-center text-xs text-subtle sm:block">
          Drag a body to throw it. Orbit empty space. Drop from the toolbar.
        </p>
        <div
          className={cn(
            "pointer-events-auto w-full max-w-3xl rounded-toolbar border border-border bg-surface p-3 shadow-toolbar",
            "flex flex-col gap-3 sm:p-4",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {SHAPES.map(({ kind, label, icon: Icon }) => (
              <Button
                key={kind}
                variant="muted"
                onClick={() => spawn(kind)}
                aria-label={`Drop ${label.toLowerCase()}`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                <span>{label}</span>
              </Button>
            ))}
            <Button variant="muted" onClick={scatter} aria-label="Scatter mixed shapes">
              <Shuffle className="size-4" strokeWidth={1.75} />
              <span>Scatter</span>
            </Button>
            <Button
              variant={weldMode ? "solid" : "muted"}
              onClick={() => setWeldMode(!weldMode)}
              aria-pressed={weldMode}
              aria-label={weldMode ? "Exit weld mode" : "Enter weld mode"}
              title="Select two nearby bodies to weld them together"
            >
              <Link2 className="size-4" strokeWidth={1.75} />
              <span>{weldMode ? "Welding…" : "Weld"}</span>
            </Button>
            <Button
              variant={demolitionMode ? "solid" : "muted"}
              onClick={() => setDemolitionMode(!demolitionMode)}
              aria-pressed={demolitionMode}
              aria-label={demolitionMode ? "Exit demolition mode" : "Enter demolition mode"}
              title="Select two connected bodies to break their weld"
            >
              <Unlink2 className="size-4" strokeWidth={1.75} />
              <span>{demolitionMode ? "Demolishing…" : "Demolish"}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={clear}
              className="sm:ml-auto"
              aria-label="Clear the world"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              <span>Clear</span>
              </Button>
            <Button variant="muted" onClick={handleSave} aria-label="Save structure">
              <Save className="size-4" strokeWidth={1.75} />
              <span>Save</span>
            </Button>
            <Button variant="muted" onClick={handleLoad} aria-label="Load saved structure">
              <FolderOpen className="size-4" strokeWidth={1.75} />
              <span>Load</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-5">
            <Slider
              label="Gravity"
              value={gravity}
              min={0}
              max={20}
              step={0.1}
              display={gravity.toFixed(1)}
              onValueChange={setGravity}
            />
            <Slider
              label="Bounce"
              value={restitution}
              min={0}
              max={1}
              step={0.01}
              display={restitution.toFixed(2)}
              onValueChange={setRestitution}
            />
          </div>
          {(weldMode || demolitionMode) && (
            <p className="text-xs text-muted" role="status">
              {demolitionMode
                ? selectedBodyId
                  ? "Now click the connected body to break their weld."
                  : "Click one body, then the connected body whose weld you want to break."
                : selectedBodyId
                  ? "Now click a nearby body to snap and weld it."
                  : "Click one body, then another nearby body to weld them together."}
            </p>
          )}
          {status && <p className="text-xs text-muted" role="status">{status}</p>}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="mr-1 text-xs font-medium text-muted">Piece tools</span>
            <Button
              variant="muted"
              disabled={!selected}
              onClick={() => transformSelected(Math.PI / 12, 1)}
              aria-label="Rotate selected piece clockwise"
            >
              <RotateCw className="size-4" strokeWidth={1.75} />
              <span>Rotate</span>
            </Button>
            <Button
              variant="muted"
              disabled={!selected}
              onClick={() => transformSelected(0, 1.15)}
              aria-label="Scale selected piece up"
            >
              <Maximize2 className="size-4" strokeWidth={1.75} />
              <span>Grow</span>
            </Button>
            <Button
              variant="muted"
              disabled={!selected}
              onClick={() => transformSelected(0, 0.87)}
              aria-label="Scale selected piece down"
            >
              <Maximize2 className="size-4 rotate-180" strokeWidth={1.75} />
              <span>Shrink</span>
            </Button>
            {(["wall", "floor", "pillar"] as PresetKind[]).map((preset) => (
              <Button key={preset} variant="ghost" onClick={() => spawnPreset(preset)}>
                <span>{preset[0].toUpperCase() + preset.slice(1)}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
