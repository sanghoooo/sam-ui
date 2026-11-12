"use client";

import { Menu } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

type SidebarState = { open: boolean; setOpen: (open: boolean) => void };

const SidebarContext = createContext<SidebarState | null>(null);

/** Whether the sidebar drawer is open. Below lg the sidebar is a drawer; from lg it always shows. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const state = useMemo(() => ({ open, setOpen }), [open]);
  return <SidebarContext value={state}>{children}</SidebarContext>;
}

export function useSidebar() {
  const state = useContext(SidebarContext);
  if (!state)
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  return state;
}

/** Opens the sidebar drawer. Hidden from lg, where the sidebar always shows. */
export function SidebarTrigger() {
  const { open, setOpen } = useSidebar();
  return (
    <Button
      aria-controls="app-sidebar"
      aria-expanded={open}
      aria-label="메뉴 열기"
      className="lg:hidden"
      onClick={() => setOpen(true)}
      size="icon"
      variant="ghost"
    >
      <Menu />
    </Button>
  );
}
