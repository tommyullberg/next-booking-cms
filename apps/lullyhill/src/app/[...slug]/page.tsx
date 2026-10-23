import { redirect, notFound } from "next/navigation";
import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { LullyhillPageRenderer } from "../../components/lullyhill-page-renderer";

export const dynamic = "force-dynamic";

export default async function LullyhillDynamicPage({
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

  return <LullyhillPageRenderer page={page as any} />;
}
