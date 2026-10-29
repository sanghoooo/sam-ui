import { type ReactNode, Suspense } from "react";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

/** The sidebar and the main column. Each page renders its own PageHeader and <main>. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh">
        {/* The sidebar reads the pathname. With Next.js Cache Components on, a route with a dynamic
            param suspends there, so the sidebar waits in its own boundary behind a same-width stand-in
            instead of failing the build. */}
        <Suspense
          fallback={
            <div className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:block" />
          }
        >
          <Sidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarProvider>
  );
}
