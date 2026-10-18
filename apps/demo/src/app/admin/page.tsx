import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  authOptions,
  getPagesAction,
  getSectionsAction,
  getMediaFilesAction,
  AdminApp,
} from "@next-booking/cms-core";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  let pages: any[] = [];
  let sections: any[] = [];
  let media: any[] = [];

  try {
    [pages, sections, media] = await Promise.all([
      getPagesAction(),
      getSectionsAction(),
      getMediaFilesAction(),
    ]);
  } catch (err) {
    // If database connection is not yet initialized, handle gracefully
    pages = [];
    sections = [];
    media = [];
  }

  return (
    <AdminApp
      initialPages={pages}
      initialSections={sections}
      initialMedia={media}
      adminName={session.user.name || session.user.email || "Admin"}
      frontendUrl="/"
    />
  );
}
