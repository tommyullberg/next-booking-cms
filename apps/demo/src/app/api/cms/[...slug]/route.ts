import { NextRequest, NextResponse } from "next/server";
import {
  handleSaveTextField,
  handleSaveImageField,
  handleUploadMedia,
  handleTranslate,
  getPageByIdAction,
  savePageAction,
  deletePageAction,
  saveSectionAction,
  deleteSectionAction,
  deleteMediaAction,
  saveMailTemplateAction,
  syncICalBackgroundJob,
  generateICalFeed,
  prisma,
} from "@next-booking/cms-core";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = params.slug.join("/");

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

  return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = params.slug.join("/");

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

  return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = params.slug.join("/");

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

  return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}
