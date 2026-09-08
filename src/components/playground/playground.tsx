import { useEffect } from "react";
import { PlaygroundCanvas } from "./scene";
import { usePlayground, type ShapeKind } from "./store";
import { Toolbar } from "./toolbar";

export function Playground() {
  const spawn = usePlayground((s) => s.spawn);
  const scatter = usePlayground((s) => s.scatter);
  const clear = usePlayground((s) => s.clear);
  const togglePaused = usePlayground((s) => s.togglePaused);

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
      if (event.code === "Digit4" || event.code === "KeyR") {
        event.preventDefault();
        scatter();
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
  }, [clear, scatter, spawn, togglePaused]);

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
