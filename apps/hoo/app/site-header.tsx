"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "소개" },
  { href: "/palette", label: "팔레트" },
  { href: "/charts", label: "차트" },
];

/**
 * The site's header, pinned to the top: its name, the pages and the dark mode switch. It keeps its height
 * in --header-height, which changes when it wraps on a narrow screen, so linked sections can stop just below.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`,
      );
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return (
    <header
      className="sticky top-0 z-30 border-b border-border/60 bg-background/55 backdrop-blur-xl backdrop-saturate-150"
      ref={ref}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <nav aria-label="페이지" className="flex items-center gap-2">
          <Link aria-label="SAM UI" className="mr-5 flex" href="/">
            <SiteName />
          </Link>
          {LINKS.map(({ href, label }) => (
            <Link
              aria-current={pathname === href ? "page" : undefined}
              className={buttonClass({
                className: cn(
                  "h-9 px-3 text-[14px] font-normal hover:bg-foreground/6 hover:ring-0",
                  pathname === href && "text-foreground",
                ),
                variant: "ghost",
              })}
              href={href}
              key={href}
            >
              {/* Bold when current; the bold copy, unseen, holds the width so the links never shift. */}
              <span className="inline-grid justify-items-center">
                <span
                  aria-hidden
                  className="invisible font-bold [grid-area:1/1]"
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "[grid-area:1/1]",
                    pathname === href && "font-bold",
                  )}
                >
                  {label}
                </span>
              </span>
            </Link>
          ))}
        </nav>
        {/* The hover fill is see-through, so it sits as softly on the intro's blue wash as on gray. */}
        <div className="whitespace-nowrap [&>label:hover]:bg-foreground/6">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/**
 * The site's name, spelled out and folded in turn: "Sales and Marketing 본부" folds into "SAM UI", its "a"
 * turning into "A" and "본부" into "UI", and back, over and over; once folded, a light crosses "SAM UI". It has
 * the still AI Insight title's look, bold italic in the primary color, with "본부" and "UI" in regular weight.
 * The full name, unseen, holds the width, so the links beside it stay put. Reduced motion shows "SAM UI" only.
 */
function SiteName() {
  return (
    <span className="inline-grid whitespace-nowrap text-[17px] font-extrabold tracking-tight text-primary italic">
      <span aria-hidden className="invisible pr-[0.25em] [grid-area:1/1]">
        Sales and Marketing <span className="font-normal">본부</span>
      </span>
      <span className="[grid-area:1/1]">
        <FoldingName />
      </span>
      {/* The light: the same name again, folding alike, in white seen only through a slanted band. */}
      <span
        aria-hidden
        className="pointer-events-none animate-name-glint [grid-area:1/1]"
      >
        <FoldingName />
      </span>
    </span>
  );
}

function FoldingName() {
  return (
    <>
      S<Fold delay={0}>ales </Fold>
      <Fold delay={15}>a</Fold>
      <Fold delay={15} in>
        A
      </Fold>
      <Fold delay={30}>nd </Fold>M<Fold delay={60}>arketing</Fold>
      <span className="font-normal">
        {" "}
        <Fold delay={75}>본부</Fold>
        <Fold delay={75} in>
          UI
        </Fold>
      </span>
    </>
  );
}

/**
 * Letters that narrow away from their own width while they fade, and come back; `in` letters do the opposite,
 * there only while the name is folded. They are cut on the sides alone, and the cut reaches 0.25em past their
 * width for the italic's lean, with the margin giving the room back.
 */
function Fold({
  children,
  delay,
  in: arrive = false,
}: {
  children: ReactNode;
  delay: number;
  in?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-grid",
        arrive ? "animate-name-fold-in" : "animate-name-fold-out",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="-mr-[0.25em] min-w-0 overflow-x-clip whitespace-pre pr-[0.25em]">
        {children}
      </span>
    </span>
  );
}
