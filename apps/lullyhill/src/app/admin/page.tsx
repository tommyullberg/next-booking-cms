import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, loadAdminInitialData } from "@next-booking/cms-core/server";
import { AdminApp } from "@next-booking/cms-core";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const { pages, sections, media, mailTemplates, settings } = await loadAdminInitialData();

  return (
    <AdminApp
      initialPages={pages}
      initialSections={sections}
      initialMedia={media}
      initialMailTemplates={mailTemplates as any}
      initialSettings={settings}
      adminName={session.user.name || session.user.email || "Admin"}
      frontendUrl="/"
    />
  );
}
