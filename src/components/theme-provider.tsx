"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeSetting = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEMES: ThemeSetting[] = ["light", "dark", "system"];

type ThemeContextValue = {
  theme?: ThemeSetting;
  resolvedTheme?: ResolvedTheme;
  setTheme: (theme: ThemeSetting) => void;
  themes: ThemeSetting[];
};

const ThemeContext = createContext<ThemeContextValue>({
  setTheme: () => undefined,
  themes: THEMES,
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: ThemeSetting): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: ThemeSetting) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
    const initial =
      stored && THEMES.includes(stored) ? stored : ("light" as ThemeSetting);
    setThemeState(initial);
    setResolvedTheme(resolveTheme(initial));
    applyTheme(initial);
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setThemeState((current) => {
        if (current === "system") {
          const nextResolved = resolveTheme("system");
          setResolvedTheme(nextResolved);
          applyTheme("system");
        }
        return current;
      });
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeState(next);
    setResolvedTheme(resolveTheme(next));
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const value = useMemo(
    () => ({
      theme: mounted ? theme : undefined,
      resolvedTheme: mounted ? resolvedTheme : undefined,
      setTheme,
      themes: THEMES,
    }),
    [mounted, theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
