import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "dropyard.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const nextMode: ThemeMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setMode(nextMode);

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const nextTheme = nextMode === "system" ? (media.matches ? "light" : "dark") : nextMode;
      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle("light", nextTheme === "light");
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.dataset.theme = nextTheme;
    };
    apply();
    const onChange = () => {
      if (nextMode === "system") apply();
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const nextTheme = mode === "system" ? (media.matches ? "light" : "dark") : mode;
    setResolvedTheme(nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const nextTheme = media.matches ? "light" : "dark";
      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle("light", nextTheme === "light");
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.dataset.theme = nextTheme;
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [mode]);

  const value = useMemo(() => ({ mode, resolvedTheme, setMode }), [mode, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

export function getInitialTheme(): ResolvedTheme {
  return systemTheme();
}
