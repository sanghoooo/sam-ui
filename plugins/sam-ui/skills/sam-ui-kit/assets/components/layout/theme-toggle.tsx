"use client";

import { Moon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/switch";
import { subscribeToTheme, THEME_STORAGE_ITEM } from "@/lib/theme";

const isDark = () => document.documentElement.classList.contains("dark");
// The server renders the light default; THEME_SCRIPT applies a saved dark choice before paint.
const isDarkOnServer = () => false;

/** The sidebar's 다크 모드 row. Light is the default; the choice is kept in localStorage. */
export function ThemeToggle({ label = "다크 모드" }: { label?: string }) {
  const dark = useSyncExternalStore(subscribeToTheme, isDark, isDarkOnServer);

  function setDark(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_ITEM, next ? "dark" : "light");
    } catch {
      // Storage is blocked: the choice lasts until the page reloads.
    }
  }

  return (
    <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Moon className="size-4" />
      <span className="flex-1">{label}</span>
      <Switch checked={dark} onCheckedChange={setDark} />
    </label>
  );
}
