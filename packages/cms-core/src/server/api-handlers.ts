import { NextRequest, NextResponse } from "next/server";
import { saveTextFieldAction, saveImageFieldAction } from "../actions/fields";
import { uploadMediaAction, deleteMediaAction } from "../actions/media";
import { translateText } from "../ai";
import { getPageByIdAction, savePageAction, deletePageAction } from "../actions/pages";
import { saveSectionAction, deleteSectionAction } from "../actions/sections";
import { saveMailTemplateAction } from "../mail";
import { syncICalBackgroundJob } from "../ical";
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
  params: { slug: string[] }
) {
  const path = params.slug.join("/");
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
  }

  if (method === "GET") {
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

    if (path === "ical/sync") {
      try {
        const results = await syncICalBackgroundJob();
        return NextResponse.json({ success: true, results });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
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
        return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
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

    if (path.startsWith("media/")) {
      const mediaId = path.replace("media/", "");
      await deleteMediaAction(mediaId);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}
