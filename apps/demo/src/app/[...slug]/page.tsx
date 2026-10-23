import { redirect, notFound } from "next/navigation";
import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { DemoPageRenderer } from "../../components/demo-page-renderer";

export const dynamic = "force-dynamic";

export default async function DemoDynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const { page, shouldRedirectToRoot } = await resolvePageBySlugOrIdAction(slug);

  if (shouldRedirectToRoot) {
    redirect("/");
  }

  if (!page) {
    notFound();
  }

  return <DemoPageRenderer page={page as any} />;
}
