"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Commands in a code box with a copy button. */
export function CopyCommand({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = lines.join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // The clipboard is blocked: the commands stay selectable.
    }
  }

  return (
    <div className="flex items-start rounded-lg border border-border bg-muted">
      <pre className="min-w-0 flex-1 overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
        {text}
      </pre>
      <Button
        aria-label={copied ? "Copied" : "Copy the commands"}
        className="m-1.5 shrink-0"
        onClick={copy}
        size="icon-sm"
        variant="ghost"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
