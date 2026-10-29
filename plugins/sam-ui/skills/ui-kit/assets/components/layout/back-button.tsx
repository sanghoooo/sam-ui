"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Goes back in history, or to fallbackHref when the page was opened directly. */
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <Button
      aria-label="뒤로"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      size="icon"
    >
      <ChevronLeft />
    </Button>
  );
}
