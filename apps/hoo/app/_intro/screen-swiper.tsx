"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StaticImageData } from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Slide = { image: StaticImageData; alt: string; caption: ReactNode };

/**
 * Screens in a row that swipes: each snaps into place with the next one peeking at the edge, and the dots
 * and arrows below step through them. Touch and trackpads swipe natively (scroll snap); the dots and arrows
 * scroll smoothly, or at once with reduced motion. Each screen opens full size.
 */
export function ScreenSwiper({
  label,
  slides,
}: {
  label: string;
  slides: Slide[];
}) {
  const track = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(0);
  const last = slides.length - 1;

  // The current screen is the one the track has scrolled to; at the far end that is the last one, which
  // can't reach the left edge.
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const onScroll = () => {
      const end = node.scrollWidth - node.clientWidth;
      setCurrent(
        node.scrollLeft >= end - 2
          ? last
          : Math.round(node.scrollLeft / step(node)),
      );
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [last]);

  function goTo(index: number) {
    const node = track.current;
    if (!node) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    node.scrollTo({
      behavior: reduce ? "auto" : "smooth",
      left: index * step(node),
    });
  }

  return (
    <section aria-label={label} aria-roledescription="carousel">
      <ol
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={track}
      >
        {slides.map(({ image, alt, caption }, i) => (
          <li
            className="w-[85%] shrink-0 snap-start sm:w-[70%] lg:w-[62%]"
            key={image.src}
          >
            <a
              className="block overflow-hidden rounded-xl border border-border bg-muted transition-opacity hover:opacity-90"
              href={image.src}
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt={alt}
                className="h-auto w-full"
                height={image.height}
                loading="lazy"
                src={image.src}
                width={image.width}
              />
            </a>
            <p className="mt-2.5 flex gap-1.5 break-keep text-[13px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">{i + 1}</span>
              <span>{caption}</span>
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          {slides.map(({ image }, i) => (
            <button
              aria-current={i === current ? "step" : undefined}
              aria-label={`${i + 1}번 화면`}
              className="group flex h-6 cursor-pointer items-center px-1"
              key={image.src}
              onClick={() => goTo(i)}
              type="button"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current
                    ? "w-5 bg-foreground"
                    : "w-1.5 bg-border group-hover:bg-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button
            aria-label="이전 화면"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
            size="icon-sm"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="다음 화면"
            disabled={current === last}
            onClick={() => goTo(current + 1)}
            size="icon-sm"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}

/** The distance from one screen to the next: its width and the gap. */
function step(track: HTMLElement) {
  const [first, second] = track.children as HTMLCollectionOf<HTMLElement>;
  return second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
}
