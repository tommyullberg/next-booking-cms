import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function revalidateBookingCaches() {
  try {
    revalidatePath("/admin");
    revalidatePath("/admin", "layout");
    revalidatePath("/");
    revalidatePath("/", "layout");
  } catch {
    // Non-fatal if invoked outside Next.js request boundary
  }
}
import { saveTextFieldAction, saveImageFieldAction } from "../actions/fields";
import {
  getMediaFilesAction,
  uploadMediaAction,
  deleteMediaAction,
} from "../actions/media";
import { translateText } from "../ai";
import {
  getPageByIdAction,
  savePageAction,
  deletePageAction,
  loadAdminInitialData,
} from "../actions/pages";
import {
  saveSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
  updateNavigationMenuItemAction,
  reorderNavigationMenuItemsAction,
} from "../actions/sections";
import {
  getCategoryTypesAction,
  saveCategoryTypeAction,
  deleteCategoryTypeAction,
  reorderCategoryTypesAction,
  saveCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "../actions/categories";
import {
  getAdministratorsAction,
  createAdministratorAction,
  updateAdministratorAction,
  deleteAdministratorAction,
} from "../actions/administrators";
import {
  getLandlordsAction,
  createLandlordAction,
  updateLandlordAction,
  deleteLandlordAction,
} from "../actions/landlords";
import {
  getBookingObjectsAction,
  createBookingObjectAction,
  updateBookingObjectAction,
  deleteBookingObjectAction,
} from "../actions/booking-objects";
import {
  getBookingOptionalsAction,
  createBookingOptionalAction,
  updateBookingOptionalAction,
  deleteBookingOptionalAction,
} from "../actions/optionals";
import {
  getAmenitiesAction,
  createAmenityAction,
  updateAmenityAction,
  deleteAmenityAction,
  reorderAmenitiesAction,
} from "../actions/amenities";
import {
  getCmsSettingsAction,
  saveCmsSettingsAction,
} from "../actions/settings";
import { saveMailTemplateAction } from "../mail";
import { syncICalBackgroundJob, syncAllBookingObjects } from "../ical";
import { generateICalFeed } from "../ical/generator";
import {
  getBookingsAction,
  searchAvailabilityAction,
  createBookingRequestAction,
} from "../actions/bookings";
import { prisma } from "../db";

export async function handleSaveTextField(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveTextFieldAction(body);
    return NextResponse.json({ success: true, field: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save text field" },
      { status: 500 }
    );
  }
}

export async function handleSaveImageField(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveImageFieldAction(body);
    return NextResponse.json({ success: true, field: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save image field" },
      { status: 500 }
    );
  }
}

export async function handleUploadMedia(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadMediaAction(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      fileUrl: result.file_url,
      fileName: result.file_name,
      id: result.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function handleTranslate(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await translateText(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Translation failed" },
      { status: 500 }
    );
  }
}

/**
 * Universal CMS API dispatcher handler for Next.js App Router catch-all routes.
 */
export async function handleCmsApiRoute(
  req: NextRequest,
  params: { slug: string[] } | Promise<{ slug: string[] }>
) {
  const resolvedParams = await params;
  const path = resolvedParams.slug.join("/");
  const method = req.method.toUpperCase();

  if (method === "POST") {
    if (path === "fields/text") {
      return handleSaveTextField(req);
    }
    if (path === "fields/image") {
      return handleSaveImageField(req);
    }
    if (path === "upload") {
      return handleUploadMedia(req);
    }
    if (path === "translate") {
      return handleTranslate(req);
    }
    if (path === "mail-templates") {
      const body = await req.json();
      const result = await saveMailTemplateAction(
        body.templateType,
        body.subject,
        body.body
      );
      return NextResponse.json(result);
    }
    if (path === "bookings/request") {
      try {
        const body = await req.json();
        const result = await createBookingRequestAction(body);
        return NextResponse.json(result);
      } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 400 });
      }
    }
    if (path === "pages" || path.startsWith("pages/")) {
      const body = await req.json();
      const result = await savePageAction(body);
      return NextResponse.json(result);
    }
    if (path === "sections") {
      const body = await req.json();
      const result = await saveSectionAction(body);
      return NextResponse.json(result);
    }
    if (path === "sections/reorder") {
      const body = await req.json();
      const result = await reorderSectionsAction(body.orderedIds || []);
      return NextResponse.json(result);
    }
    if (path === "navigation-menus/item") {
      const body = await req.json();
      const result = await updateNavigationMenuItemAction(body);
      return NextResponse.json(result);
    }
    if (path === "navigation-menus/reorder") {
      const body = await req.json();
      const result = await reorderNavigationMenuItemsAction(body.items || []);
      return NextResponse.json(result);
    }
    if (path === "categories/types") {
      const body = await req.json();
      const result = await saveCategoryTypeAction(body);
      return NextResponse.json(result);
    }
    if (path === "categories/types/reorder") {
      const body = await req.json();
      const result = await reorderCategoryTypesAction(body.orderedIds || []);
      return NextResponse.json(result);
    }
    if (path === "categories/items") {
      const body = await req.json();
      const result = await saveCategoryAction(body);
      return NextResponse.json(result);
    }
    if (path === "categories/items/reorder") {
      const body = await req.json();
      const result = await reorderCategoriesAction(body.items || []);
      return NextResponse.json(result);
    }
    if (path === "administrators") {
      try {
        const body = await req.json();
        if (body.id) {
          await updateAdministratorAction(body);
        } else {
          await createAdministratorAction(body);
        }
        const admins = await getAdministratorsAction();
        return NextResponse.json(admins);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to save administrator" },
          { status: 400 }
        );
      }
    }
    if (path === "landlords") {
      try {
        const body = await req.json();
        if (body.id) {
          await updateLandlordAction(body);
        } else {
          await createLandlordAction(body);
        }
        revalidateBookingCaches();
        const landlords = await getLandlordsAction();
        return NextResponse.json(landlords);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to save landlord" },
          { status: 400 }
        );
      }
    }
    if (path === "booking-objects") {
      try {
        const body = await req.json();
        if (body.id) {
          await updateBookingObjectAction(body);
        } else {
          await createBookingObjectAction(body);
        }
        revalidateBookingCaches();
        const objects = await getBookingObjectsAction();
        return NextResponse.json(objects);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to save booking object" },
          { status: 400 }
        );
      }
    }
    if (path === "optionals") {
      try {
        const body = await req.json();
        if (body.id) {
          await updateBookingOptionalAction(body);
        } else {
          await createBookingOptionalAction(body);
        }
        revalidateBookingCaches();
        const optionals = await getBookingOptionalsAction();
        return NextResponse.json(optionals);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to save optional" },
          { status: 400 }
        );
      }
    }
    if (path === "amenities") {
      try {
        const body = await req.json();
        if (body.id) {
          await updateAmenityAction(body);
        } else {
          await createAmenityAction(body);
        }
        revalidateBookingCaches();
        const amenities = await getAmenitiesAction();
        return NextResponse.json(amenities);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to save amenity" },
          { status: 400 }
        );
      }
    }
    if (path === "amenities/reorder") {
      try {
        const body = await req.json();
        await reorderAmenitiesAction(body.orderedIds || []);
        revalidateBookingCaches();
        const amenities = await getAmenitiesAction();
        return NextResponse.json(amenities);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to reorder amenities" },
          { status: 400 }
        );
      }
    }
    if (path === "settings") {
      const body = await req.json();
      const result = await saveCmsSettingsAction(body);
      return NextResponse.json(result);
    }
    if (path === "ical/sync" || path === "ical/sync-all") {
      try {
        let force = true;
        try {
          const body = await req.json();
          if (body && typeof body.force === "boolean") force = body.force;
        } catch {}
        const results = await syncAllBookingObjects({ force });
        revalidateBookingCaches();
        return NextResponse.json(results, { headers: NO_CACHE_HEADERS });
      } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
      }
    }
  }

  if (method === "GET") {
    if (path === "optionals") {
      const objectId = req.nextUrl.searchParams.get("objectId") || undefined;
      const optionals = await getBookingOptionalsAction(objectId);
      return NextResponse.json(optionals, { headers: NO_CACHE_HEADERS });
    }
    if (path === "booking-objects") {
      const objects = await getBookingObjectsAction();
      return NextResponse.json(objects, { headers: NO_CACHE_HEADERS });
    }
    if (path === "landlords") {
      const landlords = await getLandlordsAction();
      return NextResponse.json(landlords, { headers: NO_CACHE_HEADERS });
    }
    if (path === "administrators") {
      const admins = await getAdministratorsAction();
      return NextResponse.json(admins, { headers: NO_CACHE_HEADERS });
    }
    if (path === "categories") {
      const types = await getCategoryTypesAction();
      return NextResponse.json(types, { headers: NO_CACHE_HEADERS });
    }
    if (path === "amenities") {
      const amenities = await getAmenitiesAction();
      return NextResponse.json(amenities, { headers: NO_CACHE_HEADERS });
    }
    if (path === "settings") {
      const settings = await getCmsSettingsAction();
      return NextResponse.json(settings, { headers: NO_CACHE_HEADERS });
    }
    if (path === "media") {
      const media = await getMediaFilesAction();
      return NextResponse.json(media, { headers: NO_CACHE_HEADERS });
    }
    if (path === "admin-init") {
      try {
        const data = await loadAdminInitialData();
        return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
      } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
      }
    }

    if (path === "bookings") {
      try {
        const objectId = req.nextUrl.searchParams.get("objectId") || undefined;
        const bookings = await getBookingsAction({ objectId });
        return NextResponse.json(bookings);
      } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
      }
    }

    if (path === "bookings/search") {
      try {
        const startDate = req.nextUrl.searchParams.get("startDate") || "";
        const endDate = req.nextUrl.searchParams.get("endDate") || "";
        const guests = Number(req.nextUrl.searchParams.get("guests") || "1");
        const pets = Number(req.nextUrl.searchParams.get("pets") || "0");
        const flexDays = Number(req.nextUrl.searchParams.get("flexDays") || "0");

        const result = await searchAvailabilityAction({
          startDate,
          endDate,
          guests,
          pets,
          flexDays,
        });
        return NextResponse.json(result);
      } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
      }
    }

    if (path === "ical/sync" || path === "ical/sync-all") {
      try {
        const force = req.nextUrl.searchParams.get("force") === "true";
        const results = await syncAllBookingObjects({ force });
        return NextResponse.json(results, { headers: NO_CACHE_HEADERS });
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message },
          { status: 500, headers: NO_CACHE_HEADERS }
        );
      }
    }

    if (path === "ical/export") {
      try {
        const objectId = req.nextUrl.searchParams.get("objectId");
        const bookings = await prisma.booking.findMany({
          where: objectId ? { object_id: objectId } : {},
        });
        const ics = generateICalFeed(
          bookings.map((b) => ({
            id: b.id,
            startDate: b.start_date,
            endDate: b.end_date,
            status: b.status,
            customerName: b.customer_name,
          }))
        );
        return new NextResponse(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="calendar.ics"',
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: err?.message },
          { status: 500 }
        );
      }
    }

    if (path.startsWith("pages/")) {
      const pageId = path.replace("pages/", "");
      const page = await getPageByIdAction(pageId);
      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      return NextResponse.json(page);
    }
  }

  if (method === "DELETE") {
    if (path.startsWith("pages/")) {
      const pageId = path.replace("pages/", "");
      await deletePageAction(pageId);
      return NextResponse.json({ success: true });
    }

    if (path.startsWith("sections/")) {
      const secId = path.replace("sections/", "");
      await deleteSectionAction(secId);
      return NextResponse.json({ success: true });
    }

    if (path.startsWith("categories/types/")) {
      const typeId = path.replace("categories/types/", "");
      const updated = await deleteCategoryTypeAction(typeId);
      return NextResponse.json(updated);
    }

    if (path.startsWith("categories/items/")) {
      const itemId = path.replace("categories/items/", "");
      const updated = await deleteCategoryAction(itemId);
      return NextResponse.json(updated);
    }

    if (path.startsWith("administrators/")) {
      try {
        const adminId = path.replace("administrators/", "");
        await deleteAdministratorAction(adminId);
        const admins = await getAdministratorsAction();
        return NextResponse.json(admins);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to delete administrator" },
          { status: 400 }
        );
      }
    }

    if (path.startsWith("landlords/")) {
      try {
        const landlordId = path.replace("landlords/", "");
        await deleteLandlordAction(landlordId);
        const landlords = await getLandlordsAction();
        return NextResponse.json(landlords);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to delete landlord" },
          { status: 400 }
        );
      }
    }

    if (path.startsWith("booking-objects/")) {
      try {
        const objId = path.replace("booking-objects/", "");
        await deleteBookingObjectAction(objId);
        revalidateBookingCaches();
        const objects = await getBookingObjectsAction();
        return NextResponse.json(objects);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to delete booking object" },
          { status: 400 }
        );
      }
    }

    if (path.startsWith("optionals/")) {
      try {
        const optId = path.replace("optionals/", "");
        await deleteBookingOptionalAction(optId);
        revalidateBookingCaches();
        const optionals = await getBookingOptionalsAction();
        return NextResponse.json(optionals);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to delete optional" },
          { status: 400 }
        );
      }
    }

    if (path.startsWith("amenities/")) {
      try {
        const amenityId = path.replace("amenities/", "");
        await deleteAmenityAction(amenityId);
        revalidateBookingCaches();
        const amenities = await getAmenitiesAction();
        return NextResponse.json(amenities);
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Failed to delete amenity" },
          { status: 400 }
        );
      }
    }

    if (path.startsWith("media/")) {
      const mediaId = path.replace("media/", "");
      await deleteMediaAction(mediaId);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}
