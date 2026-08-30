import { storage } from "@wxt-dev/storage";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "local:diffy:theme:v1";

class ThemeStore {
  mode = $state<ThemeMode>("system");
  private systemPrefersDark = $state(false);

  resolvedTheme = $derived.by<ResolvedTheme>(() => {
    if (this.mode === "dark") return "dark";
    if (this.mode === "light") return "light";
    return this.systemPrefersDark ? "dark" : "light";
  });

  isDark = $derived(this.resolvedTheme === "dark");

  private mediaQuery: MediaQueryList | null = null;

  async init() {
    if (typeof window === "undefined") return;

    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.systemPrefersDark = this.mediaQuery.matches;

    this.mediaQuery.addEventListener("change", (e) => {
      this.systemPrefersDark = e.matches;
      this.applyTheme();
    });

    try {
      const saved = await storage.getItem<ThemeMode>(STORAGE_KEY);
      if (saved && ["system", "light", "dark"].includes(saved)) {
        this.mode = saved;
      }
    } catch (e) {
      console.error("Failed to load theme from storage:", e);
    }

    this.applyTheme();
  }

  async setMode(newMode: ThemeMode) {
    this.mode = newMode;
    this.applyTheme();
    try {
      await storage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.error("Failed to save theme to storage:", e);
    }
  }

  private applyTheme() {
    if (typeof document === "undefined") return;
    const dark = this.isDark;
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }
}

export const themeStore = new ThemeStore();
