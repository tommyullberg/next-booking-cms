import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, loadAdminInitialData } from "@next-booking/cms-core/server";
import { AdminApp } from "@next-booking/cms-core";
import { CMS_PAGE_TEMPLATE_OPTIONS } from "../../templates";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const {
    pages,
    sections,
    categoryTypes,
    administrators,
    media,
    mediaFolders,
    mailTemplates,
    settings,
    landlords,
    bookingObjects,
    optionals,
    amenities,
  } = await loadAdminInitialData();

  return (
    <AdminApp
      initialPages={pages}
      initialSections={sections}
      initialCategoryTypes={categoryTypes}
      initialAdministrators={administrators}
      initialLandlords={landlords}
      initialBookingObjects={bookingObjects}
      initialOptionals={optionals}
      initialAmenities={amenities}
      initialMedia={media}
      initialMediaFolders={mediaFolders}
      initialMailTemplates={mailTemplates as any}
      initialSettings={settings}
      availableTemplates={CMS_PAGE_TEMPLATE_OPTIONS}
      adminName={session.user.name || session.user.email || "Admin"}
      frontendUrl="/"
    />
  );
}
