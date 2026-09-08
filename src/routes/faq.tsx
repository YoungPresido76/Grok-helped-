import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CircleHelp } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSelect } from "@/components/theme-select";

export const Route = createFileRoute("/faq")({ component: FaqPage });

const questions = [
  ["How do I spawn an object?", "Choose Spawn in the bottom toolbar. Select a count, then choose Sphere, Box, Cylinder, Cone, Torus, or Capsule. Presets add Floor, Wall, Pillar, Room, or Bridge structures."],
  ["How does Move mode work?", "Choose Select and single-tap an object. The object is selected in Move mode. Drag it to reposition it, or use the X−/X+, Y−/Y+, and Z−/Z+ buttons. Tap empty playground space to deselect."],
  ["How do I enter Rotate mode?", "Single-tap an object to select it, then double-tap the same selected object. Rotate mode appears with X, Y, and Z axis handles. Drag a colored axis line or its letter to rotate around that local axis."],
  ["How do I leave Rotate mode?", "Double-tap the selected object again. Rotate mode closes, the object stays selected, and the interaction returns to Move mode."],
  ["Does empty-space tapping deselect in Rotate mode?", "No. While Rotate mode is active, tapping the playground does not deselect the object or exit rotation. Deselecting by tapping empty space only applies to Move mode."],
  ["What do the axis colors mean?", "X is red, Y is green, and Z is blue. When Rotate mode is active, the three handles are visible. While one axis is being dragged, the other axis handles are hidden so the active control is easier to use. Selecting the object again restores all three."],
  ["How do I shape an object?", "Choose Scale with an object selected. The − and + buttons resize all axes evenly. The separate X, Y, and Z sliders resize one axis at a time, allowing thin, fat, flat, slim, thick, tall, and wide forms."],
  ["How do I measure an object's position and size?", "The axis labels identify the object's local X, Y, and Z directions while it is moved, rotated, or scaled. Use the individual axis sliders and displayed scale value to make controlled dimensional changes. The scene units are used consistently for object transforms."],
  ["How do I weld objects into a rigid angled structure?", "Choose Weld, tap the first object, and tap a nearby second object. The fixed joint preserves their relative orientation, so welded pieces can form any angle rather than being forced upright or parallel."],
  ["Why can objects not weld?", "The two objects must be close enough, roughly 2.4 scene units apart. Move them nearer in Move mode, choose Weld, and tap both objects again."],
  ["How do I remove a weld?", "Choose Demolish and tap the two connected objects. Only their shared weld is removed; neither object is deleted and other welds remain."],
  ["What keeps objects from passing through the floor?", "The playground has a physical base collider plus a safety correction that clamps an object back above the floor if fast motion, scaling, or a physics edge case takes it below the ground level. Side walls also keep objects inside the arena."],
  ["Are there playground boundaries?", "Yes. The current playground size is unchanged. A base grid and side grids show the construction limits, physical side walls contain objects, and the top remains open for an unobstructed top view."],
  ["How do I lock an object?", "Select an object, then choose Lock in the Select drawer. A locked object stays fixed until you choose Release. This is useful as an anchor before welding."],
  ["How do I duplicate or delete an object?", "Select the object, then choose Duplicate or Delete in the Select drawer. Duplicate creates a nearby copy with the same shape, transform, and material. Delete removes only that object and its weld connections."],
  ["How do I change material or rename an object?", "Select the object and use the Material dropdown or Name field in the Select drawer. The available materials are Wood, Steel, and Glass."],
  ["What does Upright do?", "Upright resets the selected object's X and Z tilt while keeping its Y heading. It is useful for returning a box or wall to a level construction orientation."],
  ["How do I use Weld and Demolish without losing selection?", "Weld and Demolish use a two-object workflow. Tap the first object, then the second. The tool tracks the first selection until the connection is created or removed."],
  ["How do I change gravity and bounce?", "Open the top-left plan menu. Gravity controls how strongly objects fall. Bounce controls impact restitution; lower values feel grounded and higher values create more energetic impacts."],
  ["How do I save a playground?", "Open the top-left plan menu. Use quick Save or enter a name and choose Save named. Named playgrounds can be loaded later from the same menu on this device."],
  ["What is included in a save?", "Saves include object shapes, colors, materials, positions, rotations, scales, locks, welds, gravity, and bounce. Saves are stored locally in this browser and are not an online account backup."],
  ["How do I undo or redo?", "Use Undo and Redo near the top-left of the playground. Keyboard shortcuts are Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl/Cmd+Y."],
  ["What shortcuts are available?", "G or R switches to Select, S switches to Scale, U applies Upright, and X/Y/Z rotates the selected object by 15 degrees. Touch controls remain available."],
  ["How do I start over?", "Open the top-left plan menu and choose New Playground. Confirm the reset. Save the current plan first if you want to keep it in the named list."],
  ["How do I change the theme?", "Use the theme selector in the top HUD, Guide, or FAQ. Choose System, Light, or Dark; the preference is saved on this device."],
];

function FaqPage() {
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10"><div className="mx-auto max-w-4xl pb-10"><nav className="mb-12 flex items-center justify-between"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" /> Back to playground</Link><div className="flex items-center gap-3"><ThemeSelect /><Link to="/tutorial" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><BookOpen className="size-4" /> Tutorial</Link></div></nav><header className="max-w-2xl"><p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"><CircleHelp className="size-4" /> Help center</p><h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Frequently asked questions.</h1><p className="mt-5 text-base leading-7 text-muted sm:text-lg">Clear answers for every construction tool, interaction mode, boundary, and save function.</p></header><section className="mt-12 divide-y divide-border rounded-toolbar border border-border bg-surface px-5 sm:px-8">{questions.map(([question, answer]) => <article key={question} className="py-6"><h2 className="font-semibold">{question}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{answer}</p></article>)}</section></div></main>
  );
}
