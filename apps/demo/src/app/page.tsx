import { notFound } from "next/navigation";
import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { DemoTemplateRenderer } from "../templates";

export const dynamic = "force-dynamic";

export default async function DemoHomePage() {
  const { page, isHiddenFromVisitor } = await resolvePageBySlugOrIdAction("/");
  if (isHiddenFromVisitor) {
    notFound();
  }
  return <DemoTemplateRenderer page={page as any} />;
}
