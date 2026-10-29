import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManualButton, PageHeader } from "@/components/layout/page-header";
import { StatePanel } from "@/components/ui/card";
import { BUILT_PAGES, findPage, PAGES } from "@/lib/nav";

// Every sidebar and header link resolves here until its screen is built (BUILT_PAGES). Other paths get
// notFound() below; no `dynamicParams = false`, which Next.js Cache Components rejects.
export function generateStaticParams() {
  return PAGES.filter((page) => !BUILT_PAGES.has(page.href)).map((page) => ({
    slug: page.href.slice(1).split("/"),
  }));
}

async function pageFor(params: PageProps<"/[...slug]">["params"]) {
  const { slug } = await params;
  return findPage(`/${slug.join("/")}`);
}

export async function generateMetadata({
  params,
}: PageProps<"/[...slug]">): Promise<Metadata> {
  const page = await pageFor(params);
  return { title: page?.label };
}

export default async function PlaceholderPage({
  params,
}: PageProps<"/[...slug]">) {
  const page = await pageFor(params);
  if (!page) notFound();
  return (
    <>
      <PageHeader
        actions={page.href === "/manual" ? undefined : <ManualButton />}
        title={page.label}
      />
      <main className="flex-1 p-4 lg:p-6">
        <StatePanel>준비 중인 화면입니다.</StatePanel>
      </main>
    </>
  );
}
