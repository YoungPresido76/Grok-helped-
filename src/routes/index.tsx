import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { Toolbar } from "@/components/playground/toolbar";

export const Route = createFileRoute("/")({ component: Home });

const playgroundPromise =
  typeof window !== "undefined" ? import("@/components/playground/playground") : null;

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pending = playgroundPromise ?? import("@/components/playground/playground");
    pending
      .then((mod) => {
        if (!cancelled) setApp(() => mod.Playground);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load playground");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="flex h-dvh items-center justify-center bg-bg px-6 text-center">
        <p className="max-w-md text-sm text-muted">{error}</p>
      </main>
    );
  }

  if (!App) {
    return (
      <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
        <Toolbar />
      </main>
    );
  }

  return <App />;
}
