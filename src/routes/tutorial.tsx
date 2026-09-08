import { Link } from "@tanstack/react-router";
import { ArrowLeft, Box, CircleHelp, Hammer, Link2, Menu, Move3d, RotateCcw, Ruler, Save, Scaling, Unlink2 } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSelect } from "@/components/theme-select";

export const Route = createFileRoute("/tutorial")({ component: TutorialPage });

const steps = [
  { icon: Hammer, title: "Spawn: add objects", body: "Choose Spawn in the bottom toolbar. Pick a count, then tap Sphere, Box, Cylinder, Cone, Torus, or Capsule. Use Floor, Wall, Pillar, Room, or Bridge to add a preset structure. The drawer scrolls horizontally on small screens." },
  { icon: Move3d, title: "Move: select and reposition", body: "Choose Select, then single-tap an object. It becomes selected and enters Move mode. Drag the object to reposition it, or use the X−/X+, Y−/Y+, and Z−/Z+ controls in the Select drawer. Tap empty playground space to deselect in Move mode." },
  { icon: RotateCcw, title: "Rotate: double-tap an object", body: "Single-tap an object first, then double-tap that same selected object. Rotate mode opens the X, Y, and Z handles. Drag a colored line or its letter to rotate around that local axis. Empty-space taps do not deselect in Rotate mode. Double-tap the object again to return to Move mode while keeping it selected." },
  { icon: Link2, title: "Weld: make a rigid structure", body: "Choose Weld, tap the first object, then tap a nearby second object. The connection preserves the objects' relative angle and behaves as a rigid joint. Welded pieces can form angled structures. Objects must be close enough to connect." },
  { icon: Unlink2, title: "Demolish: remove a weld", body: "Choose Demolish, then tap the two connected objects. Their weld is removed without deleting either object. Other welds and objects remain in place." },
  { icon: Scaling, title: "Scale: resize or shape", body: "Choose Scale while an object is selected. Use − and + to resize it evenly. Use the X, Y, and Z sliders to make it thin, fat, flat, slim, thick, tall, or wide along one axis. The displayed value shows the current uniform scale reference." },
  { icon: Ruler, title: "Measure with axis values", body: "The X, Y, and Z controls identify the object's three local directions while it moves, rotates, or is shaped. Use the corresponding scale slider and axis label to compare and adjust its dimensions precisely." },
  { icon: Box, title: "Bounded construction space", body: "The floor grid marks the base and side grids show the construction limits. Physical side walls keep objects inside the current playground size. The top remains open so objects can be viewed from above and dropped into the workspace." },
  { icon: Menu, title: "Plan menu and object actions", body: "Open the top-left menu for Guide, FAQs, New Playground, saved playgrounds, gravity, bounce, and save/load actions. In the Select drawer you can rename, change material, duplicate, lock, delete, or make an object upright." },
  { icon: Save, title: "Save, undo, and redo", body: "Use the plan menu to save a quick structure or save a named playground. Saved data includes positions, rotations, scales, materials, locks, welds, gravity, and bounce. Use Undo/Redo in the top-left, or Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl/Cmd+Y." },
];

function TutorialPage() {
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl pb-10">
        <nav className="mb-12 flex items-center justify-between"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" /> Back to playground</Link><div className="flex items-center gap-3"><ThemeSelect /><Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><CircleHelp className="size-4" /> FAQ</Link></div></nav>
        <header className="max-w-2xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Dropyard guide</p><h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Every tool, clearly explained.</h1><p className="mt-5 text-base leading-7 text-muted sm:text-lg">Use the bottom toolbar to build, select, move, rotate, weld, shape, and protect your physics construction.</p></header>
        <section className="mt-12 grid gap-4 sm:grid-cols-2">{steps.map(({ icon: Icon, title, body }, index) => <article key={title} className="rounded-toolbar border border-border bg-surface p-5 shadow-toolbar sm:p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-sm bg-accent text-accent-fg text-sm font-bold">{index + 1}</span><Icon className="size-5 text-accent" strokeWidth={1.75} /><h2 className="font-semibold">{title}</h2></div><p className="mt-4 text-sm leading-6 text-muted">{body}</p></article>)}</section>
        <section className="mt-6 rounded-toolbar border border-accent/30 bg-accent/10 p-6"><h2 className="font-semibold">A reliable first build</h2><p className="mt-2 text-sm leading-6 text-muted">Spawn a Floor, add Walls, single-tap a piece to move it, double-tap it to rotate, shape it in Scale, then switch to Weld and connect nearby pieces. Tap empty space to clear selection only when you are in Move mode. Save before using Demolish.</p></section>
      </div>
    </main>
  );
}
