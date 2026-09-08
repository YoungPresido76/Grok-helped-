import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Circle,
  CircleHelp,
  CircleDot,
  Copy,
  Cuboid,
  Cylinder,
  FolderOpen,
  Hammer,
  Link2,
  Lock,
  Maximize2,
  Menu,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Shuffle,
  Triangle,
  Trash2,
  Unlock,
  Undo2,
  Redo2,
  Unlink2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ThemeSelect } from "@/components/theme-select";
import { cn } from "@/lib/utils";
import {
  usePlayground,
  type ConstructionTool,
  type MaterialKind,
  type PresetKind,
  type ShapeKind,
} from "./store";

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
  { kind: "cone", label: "Cone", icon: Triangle },
  { kind: "torus", label: "Torus", icon: CircleDot },
  { kind: "capsule", label: "Capsule", icon: Cylinder },
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
  const newPlayground = usePlayground((s) => s.newPlayground);
  const renameBody = usePlayground((s) => s.renameBody);
  const undo = usePlayground((s) => s.undo);
  const redo = usePlayground((s) => s.redo);
  const canUndo = usePlayground((s) => s.historyPast.length > 0);
  const canRedo = usePlayground((s) => s.historyFuture.length > 0);
  const selectedBodyId = usePlayground((s) => s.selectedBodyId);
  const setSelectedBodyId = usePlayground((s) => s.setSelectedBodyId);
  const activeTool = usePlayground((s) => s.activeTool);
  const setActiveTool = usePlayground((s) => s.setActiveTool);
  const saveStructure = usePlayground((s) => s.saveStructure);
  const saveNamed = usePlayground((s) => s.saveNamed);
  const loadNamed = usePlayground((s) => s.loadNamed);
  const deleteNamed = usePlayground((s) => s.deleteNamed);
  const hydrateSavedPlaygrounds = usePlayground((s) => s.hydrateSavedPlaygrounds);
  const savedPlaygrounds = usePlayground((s) => s.savedPlaygrounds);
  const remove = usePlayground((s) => s.remove);
  const duplicateSelected = usePlayground((s) => s.duplicateSelected);
  const loadStructure = usePlayground((s) => s.loadStructure);
  const setSelectedMaterial = usePlayground((s) => s.setSelectedMaterial);
  const toggleSelectedLock = usePlayground((s) => s.toggleSelectedLock);
  const uprightSelected = usePlayground((s) => s.uprightSelected);
  const spawnCount = usePlayground((s) => s.spawnCount);
  const setSpawnCount = usePlayground((s) => s.setSpawnCount);
  const selectedLocked = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId)?.locked ?? false);
  const selectedMaterial = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId)?.material ?? "wood");
  const selectedBody = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId));
  const [nameDraft, setNameDraft] = useState("");
  const moveSelected = usePlayground((s) => s.moveSelected);
  const spawnPreset = usePlayground((s) => s.spawnPreset);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const selected = selectedBodyId !== null;

  useEffect(() => setNameDraft(selectedBody?.name ?? ""), [selectedBody?.id, selectedBody?.name]);

  useEffect(() => {
    if (loadStructure()) setStatus("Loaded saved structure");
    hydrateSavedPlaygrounds();
  }, [hydrateSavedPlaygrounds, loadStructure]);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("dropyard:scene-touch", close);
    return () => window.removeEventListener("dropyard:scene-touch", close);
  }, []);

  const selectTool = (tool: ConstructionTool) => {
    setActiveTool(activeTool === tool ? "none" : tool);
  };
  const handleSave = () => setStatus(saveStructure() ? "Structure saved on this device" : "Could not save structure");
  const handleLoad = () => setStatus(loadStructure() ? "Structure loaded" : "No saved structure found");
  const handleNamedSave = () => {
    if (saveNamed(saveName)) {
      setStatus(`Saved playground “${saveName.trim()}”`);
      setSaveName("");
    } else setStatus("Enter a name before saving");
  };

  return (
    <div className="pointer-events-none absolute inset-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
      <header className="pointer-events-none flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex items-start gap-3">
          <Button variant={open ? "solid" : "muted"} size="icon" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close plan menu" : "Open plan menu"}><Menu className="size-5" /></Button>
          <div>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-fg sm:text-2xl">Dropyard</h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">Physics playground</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <p className="rounded-sm border border-border bg-surface/90 px-3 py-2 text-xs font-medium tabular-nums text-muted backdrop-blur-sm"><span className="text-fg">{count}</span> bodies</p>
          <ThemeSelect />
          <Button variant="muted" size="icon" onClick={togglePaused} aria-label={paused ? "Resume simulation" : "Pause simulation"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button>
        </div>
      </header>

      <div className="pointer-events-auto absolute left-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-10 flex items-center gap-1"><Button variant="muted" size="icon" className="size-9 rounded-full" disabled={!canUndo} onClick={undo} title="Undo" aria-label="Undo"><Undo2 className="size-4" /></Button><Button variant="muted" size="icon" className="size-9 rounded-full" disabled={!canRedo} onClick={redo} title="Redo" aria-label="Redo"><Redo2 className="size-4" /></Button></div>

      {open && <button type="button" aria-label="Close plan drawer" className="pointer-events-auto absolute inset-0 z-20 bg-black/35" onClick={() => setOpen(false)} />}
      <div className={cn("pointer-events-auto absolute left-0 top-0 z-30 h-full w-[min(92vw,25rem)] overflow-y-auto rounded-r-toolbar border-y border-r border-border/80 bg-surface/95 p-4 shadow-toolbar backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[min(24rem,85vw)]", open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]")}>
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
            <div><p className="text-sm font-semibold">Plan mode</p><p className="text-xs text-muted">Build, save, and manage your playground.</p></div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close tools menu"><X className="size-4" /></Button>
          </div>

          <div className="mb-3 flex flex-col gap-2 border-b border-border pb-3">
            <Link to="/tutorial" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-surface-2 px-3 text-xs font-semibold text-fg hover:bg-border"><BookOpen className="size-4" /> Guide</Link>
            <Link to="/faq" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-surface-2 px-3 text-xs font-semibold text-fg hover:bg-border"><CircleHelp className="size-4" /> FAQs</Link>
          </div>
          <div className="mb-3 border-b border-border pb-3">
            <Button variant="solid" className="w-full justify-center" onClick={() => { if (window.confirm("Create a new blank playground? Save this one first if you need it later.")) { newPlayground(); setStatus("New blank playground created"); setOpen(false); } }}><Plus className="size-4" /> New Playground</Button>
          </div>

          <div className="mb-3 border-b border-border pb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Saved playgrounds</p>
            {savedPlaygrounds.length === 0 ? <p className="text-xs text-muted">No named playgrounds yet.</p> : <div className="space-y-1">{savedPlaygrounds.slice().reverse().map((entry) => <div key={entry.name} className="flex items-center gap-2 rounded-sm bg-surface-2 px-2 py-1.5"><button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-fg hover:text-accent" onClick={() => setStatus(loadNamed(entry.name) ? `Loaded “${entry.name}”` : "Could not load playground")}>{entry.name}</button><button type="button" className="rounded-sm p-1 text-muted hover:bg-border hover:text-danger" onClick={() => deleteNamed(entry.name)} aria-label={`Delete saved playground ${entry.name}`}><Trash2 className="size-3.5" /></button></div>)}</div>}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2 sm:gap-5"><Slider label="Gravity" value={gravity} min={0} max={20} step={0.1} display={gravity.toFixed(1)} onValueChange={setGravity} /><Slider label="Bounce" value={restitution} min={0} max={1} step={0.01} display={restitution.toFixed(2)} onValueChange={setRestitution} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"><input value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Name playground" className="h-10 min-w-40 flex-1 rounded-sm border border-border bg-surface-2 px-3 text-xs text-fg outline-none placeholder:text-subtle" onKeyDown={(event) => { if (event.key === "Enter") handleNamedSave(); }} /><Button variant="solid" onClick={handleNamedSave}><Save className="size-4" />Save named</Button><Button variant="muted" onClick={handleSave} title="Quick save"><Save className="size-4" /></Button><Button variant="muted" onClick={handleLoad}><FolderOpen className="size-4" />Load quick</Button><Button variant="ghost" onClick={clear}><Trash2 className="size-4" />Clear</Button></div>
          {status && <p className="mt-2 text-xs text-muted" role="status">{status}</p>}
        </div>

      {activeTool === "spawn" && <section className="pointer-events-auto absolute bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-10 h-[6.5rem] w-[min(94vw,42rem)] -translate-x-1/2 overflow-x-auto overflow-y-hidden rounded-toolbar border border-border/80 bg-surface/95 p-2 shadow-toolbar backdrop-blur-xl sm:bottom-[calc(6.75rem+env(safe-area-inset-bottom))] sm:p-3" aria-label="Spawn controls">
        <div className="flex h-full min-w-max items-center gap-1.5"><label className="flex h-10 items-center justify-center gap-1 rounded-sm bg-surface-2 px-2 text-[11px] font-semibold text-muted">Count<select value={spawnCount} onChange={(event) => setSpawnCount(Number(event.target.value))} className="h-8 rounded-sm border border-border bg-surface px-1 text-fg">{[1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{SHAPES.map(({ kind, label, icon: Icon }) => <Button key={kind} variant="muted" className="h-10 px-2 text-[11px]" onClick={() => Array.from({ length: spawnCount }, () => spawn(kind))}><Icon className="size-3.5" /><span>{label}</span></Button>)}<Button variant="muted" className="h-10 px-2 text-[11px]" onClick={scatter}><Shuffle className="size-3.5" /> Scatter</Button>{(["wall", "floor", "pillar", "room", "bridge"] as PresetKind[]).map((preset) => <Button key={preset} variant="ghost" className="h-10 px-2 text-[11px]" onClick={() => spawnPreset(preset)}>{preset[0].toUpperCase() + preset.slice(1)}</Button>)}</div>
      </section>}

      <section className={cn("pointer-events-auto absolute bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-40 h-[6.5rem] w-[min(94vw,42rem)] -translate-x-1/2 overflow-x-auto overflow-y-hidden rounded-toolbar border border-border/80 bg-surface/95 p-2 shadow-toolbar backdrop-blur-xl transition-all duration-300 ease-out sm:bottom-[calc(6.75rem+env(safe-area-inset-bottom))] sm:p-3", activeTool === "select" && selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} aria-label="Selected object controls">
        <div className="flex h-full min-w-max items-center gap-2"><div className="mr-1 shrink-0"><p className="text-sm font-semibold">Selected object</p><p className="text-[11px] text-muted">Drag the X / Y / Z handles.</p></div><Button variant={selectedLocked ? "solid" : "muted"} onClick={toggleSelectedLock}>{selectedLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}{selectedLocked ? "Release" : "Lock"}</Button><Button variant="muted" onClick={() => { duplicateSelected(); setStatus("Copied exact object and spawned it nearby"); }}><Copy className="size-4" /> Duplicate</Button><Button variant="ghost" className="text-danger" onClick={() => { if (selectedBodyId) remove(selectedBodyId); setStatus("Object deleted"); }}><Trash2 className="size-4" /> Delete</Button><label className="flex items-center gap-2 text-xs font-semibold text-muted">Material<select value={selectedMaterial} onChange={(event) => setSelectedMaterial(event.target.value as MaterialKind)} className="h-9 rounded-sm border border-border bg-surface-2 px-2 text-xs font-semibold text-fg"><option value="wood">Wood</option><option value="steel">Steel</option><option value="glass">Glass</option></select></label><label className="flex items-center gap-2 text-xs font-semibold text-muted">Name<input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onBlur={() => selectedBodyId && renameBody(selectedBodyId, nameDraft)} className="h-9 w-28 rounded-sm border border-border bg-surface-2 px-2 text-xs text-fg" /></label>{selectedBody && <div className="flex items-center gap-1 rounded-sm border border-border bg-surface-2 p-1">{(["x", "y", "z"] as const).map((axis) => <span key={axis} className="inline-flex gap-0.5"><Button variant="ghost" className="h-8 px-2" onClick={() => moveSelected(axis, -0.25)}>{axis.toUpperCase()}−</Button><Button variant="ghost" className="h-8 px-2" onClick={() => moveSelected(axis, 0.25)}>{axis.toUpperCase()}+</Button></span>)}</div>}<Button variant="muted" onClick={uprightSelected}><RotateCcw className="size-4" /> Upright</Button><Button variant="ghost" size="icon" onClick={() => setSelectedBodyId(null)} aria-label="Close object controls"><X className="size-4" /></Button></div>
      </section>

      <section className={cn("pointer-events-auto absolute bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-[6.5rem] w-[min(94vw,42rem)] -translate-x-1/2 items-center justify-center rounded-toolbar border border-border/80 bg-surface/95 p-3 shadow-toolbar backdrop-blur-xl transition-all duration-300 ease-out sm:bottom-[calc(6.75rem+env(safe-area-inset-bottom))]", activeTool === "scale" && selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} aria-label="Scale controls"><div className="flex items-center gap-3"><div><p className="text-sm font-semibold">Scale object</p><p className="text-[11px] text-muted">Tap to resize evenly</p></div><Button variant="muted" size="icon" className="size-11" onClick={() => usePlayground.getState().transformSelected(0, 0.9)} aria-label="Decrease scale"><Minus className="size-5" /></Button><span className="min-w-12 text-center text-xs font-semibold text-muted">{selectedBody ? `${selectedBody.scale[0].toFixed(1)}×` : "—"}</span><Button variant="solid" size="icon" className="size-11" onClick={() => usePlayground.getState().transformSelected(0, 1.1)} aria-label="Increase scale"><Plus className="size-5" /></Button></div></section>

      <nav className="pointer-events-auto absolute inset-x-3 bottom-[max(0.35rem,env(safe-area-inset-bottom))] mx-auto flex max-w-4xl items-center gap-1 rounded-toolbar border border-border bg-surface/95 p-1.5 shadow-toolbar backdrop-blur-md sm:inset-x-5 sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-2">
        {(["spawn", "select", "weld", "demolish", "scale"] as ConstructionTool[]).map((tool) => {
          const entry = TOOLS.find((item) => item.id === tool);
          if (!entry) return null;
          const Icon = entry.icon;
          return <button key={tool} type="button" onClick={() => selectTool(tool)} className={cn("flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm px-1 text-[10px] font-semibold sm:text-xs", activeTool === tool ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")} title={entry.hint} aria-pressed={activeTool === tool}><Icon className="size-4" /><span>{tool === "demolish" ? "Break" : entry.label}</span></button>;
        })}
      </nav>
    </div>
  );
}
