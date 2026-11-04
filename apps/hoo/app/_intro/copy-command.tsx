"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies text to the clipboard; `copied` stays true for 1.6s after. */
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  // One timer at a time, so a second copy restarts the 1.6s instead of being cut short by the first.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // The clipboard is blocked: the text stays selectable.
    }
  }

  return { copied, copy };
}

/** A ghost icon button that copies `text`; `label` names it for screen readers until it says 복사됨. */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const { copied, copy } = useCopy(text);
  return (
    <Button
      aria-label={copied ? "복사됨" : label}
      className={className}
      onClick={copy}
      size="icon-sm"
      variant="ghost"
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

/** Commands in a code box with a copy button. */
export function CopyCommand({ lines }: { lines: string[] }) {
  const text = lines.join("\n");
  return (
    <div className="flex items-start rounded-lg border border-border bg-muted">
      <pre className="min-w-0 flex-1 overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
        {text}
      </pre>
      <CopyButton className="m-1.5 shrink-0" label="명령 복사" text={text} />
    </div>
  );
}
