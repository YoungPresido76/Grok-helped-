import { Link } from "@tanstack/react-router";
import { ArrowLeft, Box, CircleHelp, Hammer, Link2, RotateCcw, Save, Unlink2 } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSelect } from "@/components/theme-select";

export const Route = createFileRoute("/tutorial")({ component: TutorialPage });

const steps = [
  {
    icon: Hammer,
    title: "Choose a tool",
    body: "Use the floating HUD at the bottom of the playground. Spawn adds pieces, Select edits a piece, Weld joins nearby pieces, Demolish breaks a connection, and Scale helps you resize a selected piece.",
  },
  {
    icon: Box,
    title: "Build a foundation",
    body: "Start in Spawn mode and choose Floor, Wall, or Pillar. These presets give you useful construction shapes immediately. You can also add individual boxes, cylinders, and spheres.",
  },
  {
    icon: RotateCcw,
    title: "Select, rotate, and straighten",
    body: "Choose Select and click a piece. The selected piece is held stable while you edit it. The red X, green Y, and blue Z rings are labeled on the gizmo; drag a ring for continuous 360-degree gesture rotation. Use Upright to reset X and Z tilt while keeping the piece's Y heading.",
  },
  {
    icon: Link2,
    title: "Weld pieces together",
    body: "Choose Weld, click the first body, then click a nearby body. The second piece snaps into place and a fixed physics joint keeps the connection together.",
  },
  {
    icon: Save,
    title: "Save your creation",
    body: "Click Save to store the current structure in this browser. Positions, rotations, scales, welds, gravity, and bounce are included. Load restores the latest saved version after a refresh.",
  },
  {
    icon: Unlink2,
    title: "Remodel safely",
    body: "Choose Demolish, select two connected bodies, and their shared weld is removed. The pieces stay in the scene, so you can reuse them instead of starting over.",
  },
  {
    icon: Save,
    title: "Use shortcuts and themes",
    body: "For a Blender-like flow, press G or R for Select, S for Scale, U for Upright, and X/Y/Z to rotate the selected piece around an axis. Use the theme selector to choose System, Light, or Dark; your preference is saved on this device.",
  },
];

function TutorialPage() {
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl pb-10">
        <nav className="mb-12 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Back to playground
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><CircleHelp className="size-4" /> FAQ</Link>
          </div>
        </nav>
        <header className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Dropyard guide</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Build something that holds together.</h1>
          <p className="mt-5 text-base leading-7 text-muted sm:text-lg">A short tour of the tools that turn a physics playground into a small construction site.</p>
        </header>
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <article key={title} className="rounded-toolbar border border-border bg-surface p-5 shadow-toolbar sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-sm bg-accent text-accent-fg text-sm font-bold">{index + 1}</span>
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h2 className="font-semibold">{title}</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 rounded-toolbar border border-accent/30 bg-accent/10 p-6">
          <h2 className="font-semibold">A realistic first build</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Load the playground, choose Spawn → Floor, add a Wall, switch to Select to position and rotate pieces with the X / Y / Z controls, press Upright when a rectangle is lying down, then Weld the sections together. Save before experimenting with Demolish.</p>
        </section>
      </div>
    </main>
  );
}
