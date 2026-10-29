"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCopy } from "./copy-command";

/** Milliseconds per character, and the pause before the next line. */
const CHAR_MS = 28;
const LINE_MS = 420;

/**
 * Commands in a terminal: a black window with neon green text that types itself out, line by line after a
 * `>` prompt, once the window comes into view, and then a blinking cursor. The full text, unseen, holds the
 * height so the card doesn't grow while it types; screen readers get the full text, and reduced motion
 * shows it all at once.
 */
export function Terminal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const { copied, copy } = useCopy(lines.join("\n"));

  const starts = lineStarts(lines);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const total = lines.join("").length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(total);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A line's last character is followed by the pause before the next line.
    const ends = new Set(lineStarts(lines).slice(1));
    const step = (count: number) => {
      setTyped(count);
      if (count >= total) return;
      timer = setTimeout(
        () => step(count + 1),
        ends.has(count) ? LINE_MS : CHAR_MS,
      );
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = setTimeout(() => step(1), LINE_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [lines]);

  // The line being typed: the last one whose first character is out.
  const current = Math.max(
    0,
    starts.findLastIndex((start) => typed > start),
  );

  return (
    <div
      className="overflow-hidden rounded-lg border border-black bg-[#0b0d0c] shadow-sm dark:border-white/12"
      ref={ref}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 py-1.5 pr-1.5 pl-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11px] text-white/45">claude</span>
        <button
          aria-label={copied ? "복사됨" : "명령 복사"}
          className="ml-auto flex size-7 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white [&_svg]:size-3.5"
          onClick={copy}
          type="button"
        >
          {copied ? <Check /> : <Copy />}
        </button>
      </div>
      <div className="grid p-3 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap text-[#39ff14] [text-shadow:0_0_6px_rgb(57_255_20/0.45)]">
        <span className="sr-only">{lines.join("\n")}</span>
        <span aria-hidden className="invisible [grid-area:1/1]">
          {lines.map((line) => `> ${line}`).join("\n")}
        </span>
        <span aria-hidden className="[grid-area:1/1]">
          {lines.map((line, i) =>
            i > current ? null : (
              <span className="block" key={line}>
                <span className="text-white/50 [text-shadow:none]">&gt; </span>
                {line.slice(0, Math.max(0, typed - starts[i]))}
                {i === current && (
                  <span className="ml-px inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] animate-caret-blink bg-[#39ff14] shadow-[0_0_6px_rgb(57_255_20/0.6)]" />
                )}
              </span>
            ),
          )}
        </span>
      </div>
    </div>
  );
}

/** Where each line starts in the lines' characters run together. */
function lineStarts(lines: string[]) {
  return lines.map((_, i) =>
    lines.slice(0, i).reduce((sum, line) => sum + line.length, 0),
  );
}
