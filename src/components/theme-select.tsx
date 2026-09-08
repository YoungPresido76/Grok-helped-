import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/contexts/theme";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSelect() {
  const { mode, setMode } = useTheme();
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <label className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-sm border border-border bg-surface/90 px-2.5 text-xs font-semibold text-muted shadow-toolbar backdrop-blur-sm">
      <Icon className="size-4 text-accent" aria-hidden="true" />
      <span className="sr-only">Color theme</span>
      <select
        value={mode}
        onChange={(event) => setMode(event.target.value as ThemeMode)}
        className="bg-transparent text-fg outline-none"
        aria-label="Color theme"
      >
        {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
