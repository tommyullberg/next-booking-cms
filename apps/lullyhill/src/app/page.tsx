import { resolvePageBySlugOrIdAction } from "@next-booking/cms-core/server";
import { LullyhillPageRenderer } from "../components/lullyhill-page-renderer";

export const dynamic = "force-dynamic";

export default async function LullyhillHomePage() {
  const { page } = await resolvePageBySlugOrIdAction("/");
  return <LullyhillPageRenderer page={page as any} />;
}
