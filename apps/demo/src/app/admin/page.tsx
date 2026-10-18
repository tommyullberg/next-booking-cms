import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  authOptions,
  getPagesAction,
  getSectionsAction,
  getMediaFilesAction,
  getMailTemplatesAction,
} from "@next-booking/cms-core/server";
import { AdminApp } from "@next-booking/cms-core";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  let pages: any[] = [];
  let sections: any[] = [];
  let media: any[] = [];
  let mailTemplates: any[] = [];

  try {
    [pages, sections, media, mailTemplates] = await Promise.all([
      getPagesAction(),
      getSectionsAction(),
      getMediaFilesAction(),
      getMailTemplatesAction(),
    ]);
  } catch (err) {
    pages = [];
    sections = [];
    media = [];
    mailTemplates = [];
  }

  return (
    <AdminApp
      initialPages={pages}
      initialSections={sections}
      initialMedia={media}
      initialMailTemplates={mailTemplates as any}
      adminName={session.user.name || session.user.email || "Admin"}
      frontendUrl="/"
    />
  );
}
