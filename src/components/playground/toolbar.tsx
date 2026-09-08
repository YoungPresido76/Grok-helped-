import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Circle,
  CircleHelp,
  CircleDot,
  Copy,
  Cuboid,
  Cylinder,
  FolderOpen,
  Eye,
  EyeOff,
  Hammer,
  Link2,
  Lock,
  Maximize2,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
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
  const bodies = usePlayground((s) => s.bodies);
  const newPlayground = usePlayground((s) => s.newPlayground);
  const renameBody = usePlayground((s) => s.renameBody);
  const toggleBodyVisibility = usePlayground((s) => s.toggleBodyVisibility);
  const snapEnabled = usePlayground((s) => s.snapEnabled);
  const snapStep = usePlayground((s) => s.snapStep);
  const setSnap = usePlayground((s) => s.setSnap);
  const undo = usePlayground((s) => s.undo);
  const redo = usePlayground((s) => s.redo);
  const canUndo = usePlayground((s) => s.historyPast.length > 0);
  const canRedo = usePlayground((s) => s.historyFuture.length > 0);
  const weldMode = usePlayground((s) => s.weldMode);
  const demolitionMode = usePlayground((s) => s.demolitionMode);
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
  const transformSelected = usePlayground((s) => s.transformSelected);
  const setSelectedMaterial = usePlayground((s) => s.setSelectedMaterial);
  const toggleSelectedLock = usePlayground((s) => s.toggleSelectedLock);
  const uprightSelected = usePlayground((s) => s.uprightSelected);
  const spawnCount = usePlayground((s) => s.spawnCount);
  const setSpawnCount = usePlayground((s) => s.setSpawnCount);
  const selectedLocked = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId)?.locked ?? false);
  const selectedMaterial = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId)?.material ?? "wood");
  const selectedBody = usePlayground((s) => s.bodies.find((body) => body.id === s.selectedBodyId));
  const setSelectedTransform = usePlayground((s) => s.setSelectedTransform);
  const [nameDraft, setNameDraft] = useState("");
  const moveSelected = usePlayground((s) => s.moveSelected);
  const rotateSelected = usePlayground((s) => s.rotateSelected);
  const spawnPreset = usePlayground((s) => s.spawnPreset);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [objectMenuOpen, setObjectMenuOpen] = useState(false);
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
    setActiveTool(tool);
    setOpen(true);
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

      {open && (
        <div className="pointer-events-auto absolute left-3 top-[calc(4.25rem+env(safe-area-inset-top))] z-30 max-h-[min(78dvh,42rem)] w-[min(94vw,28rem)] overflow-y-auto rounded-toolbar border border-border/80 bg-surface/90 p-3 shadow-toolbar backdrop-blur-xl sm:left-5 sm:top-[calc(4.75rem+env(safe-area-inset-top))] sm:p-4">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
            <div><p className="text-sm font-semibold">Plan mode</p><p className="text-xs text-muted">Build, save, and manage your playground.</p></div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close tools menu"><X className="size-4" /></Button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 border-b border-border pb-3">
            <Link to="/tutorial" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-surface-2 px-3 text-xs font-semibold text-fg hover:bg-border"><BookOpen className="size-4" /> Guide</Link>
            <Link to="/faq" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-surface-2 px-3 text-xs font-semibold text-fg hover:bg-border"><CircleHelp className="size-4" /> FAQs</Link>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 border-b border-border pb-3">
            <Button variant="solid" onClick={() => { if (window.confirm("Create a new blank playground? Save this one first if you need it later.")) { newPlayground(); setStatus("New blank playground created"); } }}><Plus className="size-4" /> New Playground</Button>
            <Button variant="muted" disabled={!canUndo} onClick={undo} title="Undo last edit"><Undo2 className="size-4" /> Undo</Button>
            <Button variant="muted" disabled={!canRedo} onClick={redo} title="Redo last edit"><Redo2 className="size-4" /> Redo</Button>
          </div>

          <div className="mb-3 border-b border-border pb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Saved playgrounds</p>
            {savedPlaygrounds.length === 0 ? <p className="text-xs text-muted">No named playgrounds yet.</p> : <div className="space-y-1">{savedPlaygrounds.slice().reverse().map((entry) => <div key={entry.name} className="flex items-center gap-2 rounded-sm bg-surface-2 px-2 py-1.5"><button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-fg hover:text-accent" onClick={() => setStatus(loadNamed(entry.name) ? `Loaded “${entry.name}”` : "Could not load playground")}>{entry.name}</button><button type="button" className="rounded-sm p-1 text-muted hover:bg-border hover:text-danger" onClick={() => deleteNamed(entry.name)} aria-label={`Delete saved playground ${entry.name}`}><Trash2 className="size-3.5" /></button></div>)}</div>}
          </div>

          <div className="mb-3 border-b border-border pb-3">
            <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Outliner</p><label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted"><input type="checkbox" checked={snapEnabled} onChange={(event) => setSnap(event.target.checked)} /> Snap <select value={snapStep} onChange={(event) => setSnap(snapEnabled, Number(event.target.value))} className="rounded-sm border border-border bg-surface-2 px-1 py-0.5 text-fg"><option value="0.1">0.1</option><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1">1</option></select></label></div>
            <div className="max-h-40 space-y-1 overflow-y-auto">{bodies.length === 0 ? <p className="text-xs text-muted">Empty playground.</p> : bodies.slice().reverse().map((body) => <div key={body.id} className={cn("flex items-center gap-1 rounded-sm px-1.5 py-1", selectedBodyId === body.id ? "bg-accent/15" : "bg-surface-2")}><button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-fg hover:text-accent" onClick={() => { setSelectedBodyId(body.id); setActiveTool("select"); }}>{body.name}</button><button type="button" className="rounded-sm p-1 text-muted hover:bg-border" onClick={() => toggleBodyVisibility(body.id)} aria-label={`${body.visible ? "Hide" : "Show"} ${body.name}`}>{body.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</button><button type="button" className="rounded-sm p-1 text-muted hover:bg-border hover:text-danger" onClick={() => remove(body.id)} aria-label={`Delete ${body.name}`}><Trash2 className="size-3.5" /></button></div>)}</div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-surface-2 p-1 sm:grid-cols-5">
            {TOOLS.map(({ id, label, icon: Icon, hint }) => (
              <button key={id} type="button" className={cn("flex min-h-11 items-center justify-center gap-2 rounded-sm px-2 py-2 text-xs font-semibold transition-colors", activeTool === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")} onClick={() => selectTool(id)} aria-pressed={activeTool === id} title={hint}>
                <Icon className="size-4" strokeWidth={1.75} /><span>{label}</span>
              </button>
            ))}
          </div>

          {activeTool === "spawn" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">Count<select value={spawnCount} onChange={(event) => setSpawnCount(Number(event.target.value))} className="h-11 rounded-sm border border-border bg-surface-2 px-2 text-fg">{[1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              {SHAPES.map(({ kind, label, icon: Icon }) => <Button key={kind} variant="muted" onClick={() => Array.from({ length: spawnCount }, () => spawn(kind))} aria-label={`Drop ${spawnCount} ${label.toLowerCase()}${spawnCount > 1 ? "s" : ""}`}><Icon className="size-4" strokeWidth={1.75} /><span>{label} ×{spawnCount}</span></Button>)}
              <Button variant="muted" onClick={scatter}><Shuffle className="size-4" /><span>Scatter</span></Button>
              {(["wall", "floor", "pillar", "room", "bridge"] as PresetKind[]).map((preset) => <Button key={preset} variant="ghost" onClick={() => spawnPreset(preset)}>{preset[0].toUpperCase() + preset.slice(1)}</Button>)}
            </div>
          )}

          {(weldMode || demolitionMode) && <p className="mt-3 text-xs text-muted" role="status">{demolitionMode ? selectedBodyId ? "Now click the connected body to break their weld." : "Click one body, then the connected body whose weld you want to break." : selectedBodyId ? "Now click a nearby body to snap and weld it." : "Click one body, then another nearby body to weld them together."}</p>}

          {activeTool === "select" && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div className="flex flex-wrap gap-2"><span className="self-center text-xs font-semibold text-muted">Move</span><Button variant="muted" disabled={!selected} onClick={() => moveSelected("x", -0.25)}><ArrowLeft className="size-4" />X−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("x", 0.25)}><ArrowRight className="size-4" />X+</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("y", 0.25)}><ArrowUp className="size-4" />Y+</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("y", -0.25)}><ArrowDown className="size-4" />Y−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("z", -0.25)}>Z−</Button><Button variant="muted" disabled={!selected} onClick={() => moveSelected("z", 0.25)}>Z+</Button></div>
              <div className="flex flex-wrap gap-2"><span className="self-center text-xs font-semibold text-muted">Rotate</span>{(["x", "y", "z"] as const).map((axis) => <span key={axis} className="inline-flex gap-1 rounded-sm border border-border bg-surface-2 p-1"><Button variant="ghost" disabled={!selected} onClick={() => rotateSelected(axis, -15)} aria-label={`Rotate selected around ${axis.toUpperCase()} by minus 15 degrees`}>{axis.toUpperCase()}−</Button><Button variant="ghost" disabled={!selected} onClick={() => rotateSelected(axis, 15)} aria-label={`Rotate selected around ${axis.toUpperCase()} by plus 15 degrees`}>{axis.toUpperCase()}+</Button></span>)}<Button variant="muted" disabled={!selected} onClick={uprightSelected}><RotateCcw className="size-4" />Upright</Button><Button variant="muted" disabled={!selected} onClick={() => transformSelected(Math.PI / 12, 1)}><RotateCw className="size-4" />Turn 15°</Button><Button variant="muted" disabled={!selected} onClick={() => transformSelected(0, 1.15)}><Maximize2 className="size-4" />Grow</Button><Button variant="muted" disabled={!selected} onClick={() => transformSelected(0, 0.87)}><Maximize2 className="size-4 rotate-180" />Shrink</Button></div>
              <p className="text-xs leading-5 text-muted">Drag the red X, green Y, or blue Z ring around the selected piece for free 360° rotation. Selection stays held in place while you edit.</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Shortcuts: G move · R rotate · S scale · U upright · X / Y / Z rotate axis</p>
              {!selected && <p className="text-xs text-muted">Click an object in the scene first.</p>}
            </div>
          )}

          {activeTool === "scale" && <p className="mt-3 text-xs leading-5 text-muted">Click a piece to select it, then switch to Select for axis movement, ring gestures, and the Upright action.</p>}

          {activeTool === "select" && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"><span className="text-xs font-semibold text-muted">Material</span><select disabled={!selected} value={selectedMaterial} onChange={(event) => setSelectedMaterial(event.target.value as MaterialKind)} className="h-10 rounded-sm border border-border bg-surface-2 px-3 text-xs font-semibold text-fg"><option value="wood">Wood</option><option value="steel">Steel</option><option value="glass">Glass</option></select></div>}
          {activeTool === "select" && <div className="relative mt-3 flex items-center gap-2 border-t border-border pt-3"><span className="text-xs font-semibold text-muted">Selected object</span><Button variant="muted" size="icon" disabled={!selected} onClick={() => setObjectMenuOpen((value) => !value)} aria-label="Open selected object menu"><MoreHorizontal className="size-4" /></Button>{objectMenuOpen && selected && <div className="absolute left-28 top-10 z-10 flex min-w-44 flex-col gap-1 rounded-sm border border-border bg-surface p-1.5 shadow-toolbar"><button type="button" className="flex items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-semibold text-fg hover:bg-surface-2" onClick={() => { duplicateSelected(); setObjectMenuOpen(false); setStatus("Copied exact object and spawned it nearby"); }}><Copy className="size-4" /> Copy and spawn exact object</button><button type="button" className="flex items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-semibold text-danger hover:bg-surface-2" onClick={() => { if (selectedBodyId) remove(selectedBodyId); setObjectMenuOpen(false); setStatus("Object deleted"); }}><Trash2 className="size-4" /> Delete object</button></div>}</div>}
          {activeTool === "select" && <div className="mt-3 grid gap-2 border-t border-border pt-3"><label className="text-xs font-semibold text-muted">Object name<input disabled={!selected} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onBlur={() => selectedBodyId && renameBody(selectedBodyId, nameDraft)} className="mt-1 h-9 w-full rounded-sm border border-border bg-surface-2 px-2 text-xs text-fg" /></label>{selectedBody && <div className="grid grid-cols-3 gap-2">{(["position", "rotation", "scale"] as const).map((field) => <fieldset key={field} className="rounded-sm border border-border p-2"><legend className="px-1 text-[10px] font-semibold uppercase text-subtle">{field === "rotation" ? "Rotation °" : field}</legend>{[0, 1, 2].map((axis) => <input key={axis} type="number" step={field === "scale" ? "0.1" : "0.25"} value={field === "rotation" ? Number((selectedBody[field][axis] * 180 / Math.PI).toFixed(2)) : selectedBody[field][axis]} onChange={(event) => setSelectedTransform(field, axis as 0 | 1 | 2, Number(event.target.value))} className="mb-1 h-8 w-full rounded-sm border border-border bg-surface-2 px-1.5 text-xs text-fg" aria-label={`${field} ${axis === 0 ? "X" : axis === 1 ? "Y" : "Z"}`} />)}</fieldset>)}</div>}</div>}
          {activeTool === "select" && <div className="mt-3 flex flex-wrap items-center gap-2"><Button variant={selectedLocked ? "solid" : "muted"} disabled={!selected} onClick={toggleSelectedLock}>{selectedLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}{selectedLocked ? "Release lock" : "Lock in place"}</Button>{selected && <span className="text-xs text-muted">{selectedLocked ? "Locked mid-air or on the ground." : "Selection is stable while you edit; lock it to keep it fixed after deselection."}</span>}</div>}

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2 sm:gap-5"><Slider label="Gravity" value={gravity} min={0} max={20} step={0.1} display={gravity.toFixed(1)} onValueChange={setGravity} /><Slider label="Bounce" value={restitution} min={0} max={1} step={0.01} display={restitution.toFixed(2)} onValueChange={setRestitution} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"><input value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Name playground" className="h-10 min-w-40 flex-1 rounded-sm border border-border bg-surface-2 px-3 text-xs text-fg outline-none placeholder:text-subtle" onKeyDown={(event) => { if (event.key === "Enter") handleNamedSave(); }} /><Button variant="solid" onClick={handleNamedSave}><Save className="size-4" />Save named</Button><Button variant="muted" onClick={handleSave} title="Quick save"><Save className="size-4" /></Button><Button variant="muted" onClick={handleLoad}><FolderOpen className="size-4" />Load quick</Button><Button variant="ghost" onClick={clear}><Trash2 className="size-4" />Clear</Button></div>
          {status && <p className="mt-2 text-xs text-muted" role="status">{status}</p>}
        </div>
      )}

      <nav className="pointer-events-auto absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto flex max-w-4xl items-center gap-1 rounded-toolbar border border-border bg-surface/95 p-1.5 shadow-toolbar backdrop-blur-md sm:inset-x-5 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-2">
        {(["spawn", "select", "weld", "demolish", "scale"] as ConstructionTool[]).map((tool) => {
          const entry = TOOLS.find((item) => item.id === tool);
          if (!entry) return null;
          const Icon = entry.icon;
          return <button key={tool} type="button" onClick={() => selectTool(tool)} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-2 text-xs font-semibold", activeTool === tool ? "bg-accent text-accent-fg" : "text-muted hover:bg-border hover:text-fg")} title={entry.hint}><Icon className="size-4" /><span className="hidden sm:inline">{tool === "demolish" ? "Break" : entry.label}</span></button>;
        })}
      </nav>
    </div>
  );
}
