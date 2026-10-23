import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { DemoPageRenderer } from "../components/demo-page-renderer";

export const dynamic = "force-dynamic";

export default async function DemoHomePage() {
  const { page } = await resolvePageBySlugOrIdAction("/");
  return <DemoPageRenderer page={page as any} />;
}
