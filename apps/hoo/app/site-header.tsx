"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "소개" },
  { href: "/palette", label: "팔레트" },
];

/** The site's header, pinned to the top: its name, the two pages and the dark mode switch. */
export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/55 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <nav aria-label="페이지" className="flex items-center gap-1">
          <Link
            className="mr-3 text-[17px] font-extrabold tracking-tight"
            href="/"
          >
            SAM UI
          </Link>
          {LINKS.map(({ href, label }) => (
            <Link
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                buttonClass({ size: "sm", variant: "ghost" }),
                pathname === href &&
                  "bg-raised text-foreground ring-1 ring-border",
              )}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="whitespace-nowrap">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
