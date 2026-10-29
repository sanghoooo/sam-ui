import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-8 px-3 text-[13px]",
  icon: "size-8",
  "icon-sm": "size-7",
} as const;

const VARIANTS = {
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost:
    "text-muted-foreground hover:bg-raised hover:text-foreground hover:ring-1 hover:ring-border",
  text: "px-1 text-muted-foreground hover:text-foreground",
} as const;

export type ButtonSize = keyof typeof SIZES;
export type ButtonVariant = keyof typeof VARIANTS;

type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** The button classes, so a Link can look like a Button. */
export function buttonClass({
  variant = "outline",
  size = "md",
  className,
}: ButtonStyle = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return (
    <button
      className={buttonClass({ variant, size, className })}
      type={type}
      {...props}
    />
  );
}
