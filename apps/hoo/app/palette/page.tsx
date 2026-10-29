import type { Metadata } from "next";
import { PaletteDemo } from "./palette-demo";

export const metadata: Metadata = { title: "팔레트" };

export default function PalettePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <h1 className="break-keep text-[22px] font-bold tracking-tight">
        팔레트
      </h1>
      <PaletteDemo />
    </main>
  );
}
