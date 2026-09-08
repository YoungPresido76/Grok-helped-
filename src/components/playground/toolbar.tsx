import { Circle, Cuboid, Cylinder, Link2, Pause, Play, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayground, type ShapeKind } from "./store";

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
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const setWeldMode = usePlayground((s) => s.setWeldMode);

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
              variant="ghost"
              onClick={clear}
              className="sm:ml-auto"
              aria-label="Clear the world"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              <span>Clear</span>
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
          {weldMode && (
            <p className="text-xs text-muted" role="status">
              {selectedBodyId
                ? "Now click a nearby body to snap and weld it."
                : "Click one body, then another nearby body to weld them together."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
