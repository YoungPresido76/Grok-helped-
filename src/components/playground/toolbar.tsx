import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Circle, CircleHelp, Cuboid, Cylinder, FolderOpen, Hammer, Link2, Maximize2, Menu, Pause, Play, RotateCw, Save, Shuffle, Trash2, Unlink2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayground, type ConstructionTool, type PresetKind, type ShapeKind } from "./store";

const TOOLS: { id: ConstructionTool; label: string; icon: typeof Hammer; hint: string }[] = [
  { id: "spawn", label: "Spawn", icon: Hammer, hint: "Add pieces and presets" },
  { id: "select", label: "Select", icon: Maximize2, hint: "Move and rotate a piece" },
  { id: "weld", label: "Weld", icon: Link2, hint: "Join nearby pieces" },
  { id: "demolish", label: "Demolish", icon: Unlink2, hint: "Break a connection" },
  { id: "scale", label: "Scale", icon: Maximize2, hint: "Select and resize" },
];
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
  const activeTool = usePlayground((s) => s.activeTool);
  const setActiveTool = usePlayground((s) => s.setActiveTool);
  const saveStructure = usePlayground((s) => s.saveStructure);
  const loadStructure = usePlayground((s) => s.loadStructure);
  const transformSelected = usePlayground((s) => s.transformSelected);
  const moveSelected = usePlayground((s) => s.moveSelected);
  const rotateSelected = usePlayground((s) => s.rotateSelected);
  const spawnPreset = usePlayground((s) => s.spawnPreset);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { if (loadStructure()) setStatus("Loaded saved structure"); }, [loadStructure]);
  const selectTool = (tool: ConstructionTool) => { setActiveTool(tool); setOpen(true); };
  const handleSave = () => setStatus(saveStructure() ? "Structure saved on this device" : "Could not save structure");
  const handleLoad = () => setStatus(loadStructure() ? "Structure loaded" : "No saved structure found");
  const selected = selectedBodyId !== null;

  return (
    <div className="pointer-events-none absolute inset-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
      <header className="pointer-events-none flex items-start justify-between gap-3">
        <div><h1 className="font-sans text-xl font-semibold tracking-tight text-fg sm:text-2xl">Dropyard</h1><p className="mt-0.5 text-xs text-muted sm:text-sm">Physics playground</p></div>
        <div className="pointer-events-auto flex items-center gap-2"><p className="rounded-sm border border-border bg-surface/90 px-3 py-2 text-xs font-medium tabular-nums text-muted backdrop-blur-sm"><span className="text-fg">{count}</span> bodies</p><Button variant="muted" size="icon" onClick={togglePaused} aria-label={paused ? "Resume simulation" : "Pause simulation"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button></div>
      </header>
      {open && <div className="pointer-events-auto absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mx-auto max-h-[min(70dvh,34rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-toolbar border border-border bg-surface/95 p-3 shadow-toolbar backdrop-blur-md sm:inset-x-5 sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:w-[calc(100%-2.5rem)] sm:p-4">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3"><div><p className="text-sm font-semibold">Construction tools</p><p className="text-xs text-muted">Choose a mode, then use its tools.</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close tools menu"><X className="size-4" /></Button></div>
        <div className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-surface-2 p-1 sm:grid-cols-4">{TOOLS.map(({ id, label, icon: Icon, hint }) => <button key={id} type="button" className={cn("flex min-h-11 items-center justify-center gap-2 rounded-sm px-2 py-2 text-xs font-semibold transition-colors", activeTool === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")} onClick={() => selectTool(id)} aria-pressed={activeTool === id} title={hint}><Icon className="size-4" strokeWidth={1.75} /><span>{label}</span></button>)}</div>
        {activeTool === "spawn" && <div className="mt-3 flex flex-wrap gap-2">{SHAPES.map(({ kind, label, icon: Icon }) => <Button key={kind} variant="muted" onClick={() => spawn(kind)} aria-label={`Drop ${label.toLowerCase()}`}><Icon className="size-4" strokeWidth={1.75} /><span>{label}</span></Button>)}<Button variant="muted" onClick={scatter}><Shuffle className="size-4" /><span>Scatter</span></Button>{(["wall", "floor", "pillar", "room", "bridge"] as PresetKind[]).map((preset) => <Button key={preset} variant="ghost" onClick={() => spawnPreset(preset)}>{preset[0].toUpperCase() + preset.slice(1)}</Button>)}</div>}
        {(weldMode || demolitionMode) && <p className="mt-3 text-xs text-muted" role="status">{demolitionMode ? selectedBodyId ? "Now click the connected body to break their weld." : "Click one body, then the connected body whose weld you want to break." : selectedBodyId ? "Now click a nearby body to snap and weld it." : "Click one body, then another nearby body to weld them together."}</p>}
        {(activeTool === "select" || activeTool === "scale") && <div className="mt-3 space-y-3 border-t border-border pt-3"><div className="flex flex-wrap gap-2"><span className="self-center text-xs font-semibold text-muted">Move</span><Button variant="muted" disabled={!selected} onClick={() => moveSelected("x", -0.25)}><ArrowLeft className="size-4" />X−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("x", 0.25)}><ArrowRight className="size-4" />X+</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("y", 0.25)}><ArrowUp className="size-4" />Y+</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("y", -0.25)}><ArrowDown className="size-4" />Y−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("z", -0.25)}>Z−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("z", 0.25)}>Z+</Button></div><div className="flex flex-wrap gap-2"><span className="self-center text-xs font-semibold text-muted">Rotate</span>{(["x", "y", "z"] as const).map((axis) => <><Button key={`${axis}-minus`} variant="muted" disabled={!selected} onClick={() => rotateSelected(axis, -15)}>{axis.toUpperCase()}−</Button><Button key={`${axis}-plus`} variant="muted" disabled={!selected} onClick={() => rotateSelected(axis, 15)}>{axis.toUpperCase()}+</Button></>)}<Button variant="muted" disabled={!selected} onClick={() => transformSelected(Math.PI / 12, 1)}><RotateCw className="size-4" />Scale rotate</Button><Button variant="muted" disabled={!selected} onClick={() => transformSelected(0, 1.15)}><Maximize2 className="size-4" />Grow</Button><Button variant="muted" disabled={!selected} onClick={() => transformSelected(0, 0.87)}><Maximize2 className="size-4 rotate-180" />Shrink</Button></div>{!selected && <span className="text-xs text-muted">Click an object in the scene first.</span>}</div>}
        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2 sm:gap-5"><Slider label="Gravity" value={gravity} min={0} max={20} step={0.1} display={gravity.toFixed(1)} onValueChange={setGravity} /><Slider label="Bounce" value={restitution} min={0} max={1} step={0.01} display={restitution.toFixed(2)} onValueChange={setRestitution} /></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"><Button variant="muted" onClick={handleSave}><Save className="size-4" />Save</Button><Button variant="muted" onClick={handleLoad}><FolderOpen className="size-4" />Load</Button><Button variant="ghost" onClick={clear}><Trash2 className="size-4" />Clear</Button><Link to="/tutorial" className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-muted hover:text-fg"><BookOpen className="size-4" />Guide</Link><Link to="/faq" className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-muted hover:text-fg"><CircleHelp className="size-4" />FAQ</Link></div>{status && <p className="mt-2 text-xs text-muted" role="status">{status}</p>}
      </div>}
      <nav className="pointer-events-auto absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto flex max-w-3xl items-center gap-1 rounded-toolbar border border-border bg-surface/95 p-1.5 shadow-toolbar backdrop-blur-md sm:inset-x-5 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-2"><button type="button" onClick={() => selectTool("spawn")} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-2 text-xs font-semibold", activeTool === "spawn" && open ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")}><Hammer className="size-4" /><span>Spawn</span></button><button type="button" onClick={() => selectTool("weld")} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-2 text-xs font-semibold", activeTool === "weld" ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")}><Link2 className="size-4" /><span>Weld</span></button><button type="button" onClick={() => selectTool("demolish")} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-2 text-xs font-semibold", activeTool === "demolish" ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")}><Unlink2 className="size-4" /><span>Break</span></button><button type="button" onClick={() => selectTool("scale")} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-2 text-xs font-semibold", activeTool === "scale" ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")}><Maximize2 className="size-4" /><span>Scale</span></button><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close tools menu" : "Open tools menu"} className={cn("flex min-h-11 min-w-11 items-center justify-center rounded-sm", open ? "bg-surface-2 text-fg" : "text-muted hover:bg-border hover:text-fg")}><Menu className="size-5" /></button></nav>
    </div>
  );
}
