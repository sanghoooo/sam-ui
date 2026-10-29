import type { Metadata } from "next";
import { ChartsDemo } from "./charts-demo";

export const metadata: Metadata = { title: "차트" };

export default function ChartsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <h1 className="break-keep text-[22px] font-bold tracking-tight">차트</h1>
      <ChartsDemo />
    </main>
  );
}
