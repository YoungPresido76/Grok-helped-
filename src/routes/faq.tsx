import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CircleHelp } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSelect } from "@/components/theme-select";

export const Route = createFileRoute("/faq")({ component: FaqPage });

const questions = [
  ["What is Dropyard?", "Dropyard is a small 3D physics construction sandbox. Add pieces, let gravity act on them, join them with welds, and experiment with structures that behave like physical objects."],
  ["How do I select and edit a piece?", "Choose Select from the floating HUD, then click a body. The selected piece stays stable while you edit it instead of falling away under gravity. Use the labeled X, Y, and Z move buttons or drag the matching red, green, and blue rotation rings around the piece."],
  ["What do the X, Y, and Z gizmo labels mean?", "X is the red axis, Y is the green axis, and Z is the blue axis. The labels are attached to the selected piece, so they rotate with it and show which local axis each ring controls."],
  ["How do I rotate something with a gesture?", "With a piece selected, drag one of the colored axis rings. Horizontal or vertical pointer movement turns the piece continuously, giving you a full 360-degree rotation gesture. Orbit the camera by dragging outside the gizmo."],
  ["How do I make a rectangle upright again?", "Open Select and press Upright. This resets the selected piece's X and Z tilt while keeping its Y heading, so a rectangle lying on its side returns to a normal upright construction orientation."],
  ["Does Dropyard have Blender-style shortcuts?", "Yes, in a simplified form. G or R switches to Select, S switches to Scale, U applies Upright, and X, Y, or Z rotates the selected piece 15 degrees around that axis. The on-screen controls remain available when you prefer clicking or touch gestures."],
  ["How do I change the theme?", "Use the theme selector in the top HUD or on the guide and FAQ pages. System follows your device preference, Light uses a bright workspace, and Dark uses the original low-light workspace. Your choice is saved on this device."],
  ["Where did the hamburger menu go?", "The plan menu is now in the top-left. It contains the Guide and FAQs, your named playground list, save controls, the expanded object library, and the construction tools."],
  ["How do I save and name a playground?", "Open the top-left plan menu, type a name in the Save named field, and choose Save named. The complete scene, materials, transforms, locks, welds, gravity, and bounce are stored in a list on this device. Choose a saved name later to load it."],
  ["What can I do from the selected object's three-dot menu?", "In Select mode, click a piece and open the three-dot Selected object menu. Copy and spawn exact object creates a nearby copy with the same shape, scale, rotation, material, and color. Delete object removes only that piece and its welds."],
  ["How do I lock an object before merging it?", "Select the object, choose Lock in place, and then use the camera or other controls to position nearby pieces. A locked piece remains fixed until you choose Release lock, so it is a reliable anchor for welding."],
  ["What objects can I spawn?", "The object library includes Sphere, Box, Cylinder, Cone, Torus, and Capsule, along with Floor, Wall, Pillar, Room, and Bridge presets. New objects use the same selection, transform, material, lock, copy, and weld workflows."],
  ["Why did an object used to fall when I moved or rotated it?", "Earlier editing handed the body back to dynamic physics as soon as the pointer was released. The current editor keeps the selected body kinematic during editing; use Lock in place when you want it to remain fixed even after you select another piece."],
  ["Why did my weld not work?", "Welding requires the two pieces to be close enough—roughly 2.4 world units. Move them nearer, switch to Weld, and try again. Weld mode also snaps the second piece into a stable position."],
  ["What does Demolish remove?", "Demolish removes only the fixed joint between the two selected bodies. It does not delete either body or any other welds, so the rest of your structure remains intact."],
  ["Where are my saved structures?", "Save data is kept in this browser's local storage on this device. It is not an online account backup. Use Save before major experiments and Load to restore the latest saved version."],
  ["What is saved?", "The save includes body types, colors, live positions, rotations, scales, weld connections, gravity, and bounce. Older saves without scale data are upgraded to normal size when loaded."],
  ["How do I make a house-like starting point?", "Use Floor for a base, Wall for a side, and Pillar for supports. Rotate and scale pieces, then weld them after they are positioned. Repeat the pattern for additional walls and a roof."],
  ["Can I change the physics feel?", "Yes. Gravity controls how strongly pieces fall, while Bounce controls impact restitution. Lower bounce creates more grounded behavior; higher values make impacts more energetic."],
];

function FaqPage() {
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl pb-10">
        <nav className="mb-12 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Back to playground
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Link to="/tutorial" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><BookOpen className="size-4" /> Tutorial</Link>
          </div>
        </nav>
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"><CircleHelp className="size-4" /> Help center</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Frequently asked questions.</h1>
          <p className="mt-5 text-base leading-7 text-muted sm:text-lg">Everything you need to start building, saving, and taking structures apart.</p>
        </header>
        <section className="mt-12 divide-y divide-border rounded-toolbar border border-border bg-surface px-5 sm:px-8">
          {questions.map(([question, answer]) => (
            <article key={question} className="py-6">
              <h2 className="font-semibold">{question}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{answer}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
