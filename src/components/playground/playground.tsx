import { useEffect } from "react";
import { PlaygroundCanvas } from "./scene";
import { usePlayground, type ShapeKind } from "./store";
import { Toolbar } from "./toolbar";

export function Playground() {
  const spawn = usePlayground((s) => s.spawn);
  const scatter = usePlayground((s) => s.scatter);
  const clear = usePlayground((s) => s.clear);
  const togglePaused = usePlayground((s) => s.togglePaused);
  const setActiveTool = usePlayground((s) => s.setActiveTool);
  const uprightSelected = usePlayground((s) => s.uprightSelected);
  const rotateSelected = usePlayground((s) => s.rotateSelected);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const map: Record<string, ShapeKind> = {
        Digit1: "sphere",
        Digit2: "box",
        Digit3: "cylinder",
      };
      const kind = map[event.code];
      if (kind) {
        event.preventDefault();
        spawn(kind);
        return;
      }
      if (event.code === "Digit4") {
        event.preventDefault();
        scatter();
        return;
      }
      if (event.code === "KeyG" || event.code === "KeyR") {
        event.preventDefault();
        setActiveTool("select");
        return;
      }
      if (event.code === "KeyS") {
        event.preventDefault();
        setActiveTool("scale");
        return;
      }
      if (event.code === "KeyU") {
        event.preventDefault();
        uprightSelected();
        return;
      }
      const axis = event.code === "KeyX" ? "x" : event.code === "KeyY" ? "y" : event.code === "KeyZ" ? "z" : null;
      if (axis) {
        event.preventDefault();
        rotateSelected(axis, 15);
        return;
      }
      if (event.code === "KeyC" || event.code === "Delete" || event.code === "Backspace") {
        event.preventDefault();
        clear();
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        togglePaused();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear, rotateSelected, scatter, setActiveTool, spawn, togglePaused, uprightSelected]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <PlaygroundCanvas />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 48%, color-mix(in oklab, var(--color-bg) 58%, transparent) 100%)",
        }}
      />
      <Toolbar />
    </main>
  );
}
