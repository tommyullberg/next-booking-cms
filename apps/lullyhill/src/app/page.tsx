import { notFound } from "next/navigation";
import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { LullyhillTemplateRenderer } from "../templates";

export const dynamic = "force-dynamic";

export default async function LullyhillHomePage() {
  const { page, isHiddenFromVisitor } = await resolvePageBySlugOrIdAction("/");
  if (isHiddenFromVisitor) {
    notFound();
  }
  return <LullyhillTemplateRenderer page={page as any} />;
}
