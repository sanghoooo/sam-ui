"use client";

import { useSyncExternalStore } from "react";
import { THEME_SCRIPT } from "@/lib/theme";

const subscribe = () => () => {};

/**
 * THEME_SCRIPT for the root layout's <head>, in the server HTML only, where it applies a saved dark choice
 * before the first paint. A <script> React creates in the browser (when the root layout mounts again, as
 * on a Fast Refresh) never runs and makes React warn, so after hydration and on a browser mount it renders
 * nothing.
 */
export function ThemeScript() {
  const fromServer = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return fromServer ? (
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  ) : null;
}
