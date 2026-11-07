import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveBookingObjectId } from "@cms/actions/bookings";
import { prisma } from "@cms/db";

describe("Booking Object Resolution Rules (resolveBookingObjectId)", () => {
  it("1. should return undefined for undefined, null, or empty string input", async () => {
    assert.equal(await resolveBookingObjectId(undefined), undefined);
    assert.equal(await resolveBookingObjectId(""), undefined);
    assert.equal(await resolveBookingObjectId("   "), undefined);
  });

  it("2. should not do fuzzy string matching for words like 'villa' or 'huset'", async () => {
    // Temporarily mock prisma.bookingObject
    const origFindUnique = prisma.bookingObject.findUnique;
    const origFindFirst = prisma.bookingObject.findFirst;

    (prisma.bookingObject.findUnique as any) = async () => null;
    (prisma.bookingObject.findFirst as any) = async () => null;

    try {
      // In the legacy code, "villa" or "huset" triggered fuzzy substring matching.
      // Now it must return undefined if no exact primary key or slug matches.
      const resVilla = await resolveBookingObjectId("villa");
      const resHuset = await resolveBookingObjectId("huset");
      const resUnknown = await resolveBookingObjectId("unknown-object-id");

      assert.equal(resVilla, undefined);
      assert.equal(resHuset, undefined);
      assert.equal(resUnknown, undefined);
    } finally {
      prisma.bookingObject.findUnique = origFindUnique;
      prisma.bookingObject.findFirst = origFindFirst;
    }
  });

  it("3. should match exact BookingObject ID", async () => {
    const origFindUnique = prisma.bookingObject.findUnique;
    (prisma.bookingObject.findUnique as any) = async ({ where }: any) => {
      if (where.id === "exact-cuid-123") {
        return { id: "exact-cuid-123" };
      }
      return null;
    };

    try {
      const res = await resolveBookingObjectId("exact-cuid-123");
      assert.equal(res, "exact-cuid-123");
    } finally {
      prisma.bookingObject.findUnique = origFindUnique;
    }
  });

  it("4. should match strictly via associated page slug", async () => {
    const origFindUnique = prisma.bookingObject.findUnique;
    const origFindFirst = prisma.bookingObject.findFirst;

    (prisma.bookingObject.findUnique as any) = async () => null;
    (prisma.bookingObject.findFirst as any) = async ({ where }: any) => {
      if (where?.page?.slug?.in?.includes("stuga-1")) {
        return { id: "obj-from-slug-stuga-1" };
      }
      return null;
    };

    try {
      const resWithoutSlash = await resolveBookingObjectId("stuga-1");
      const resWithSlash = await resolveBookingObjectId("/stuga-1");

      assert.equal(resWithoutSlash, "obj-from-slug-stuga-1");
      assert.equal(resWithSlash, "obj-from-slug-stuga-1");
    } finally {
      prisma.bookingObject.findUnique = origFindUnique;
      prisma.bookingObject.findFirst = origFindFirst;
    }
  });

  it("5. should distinguish multiple objects linked to different pages", async () => {
    const origFindUnique = prisma.bookingObject.findUnique;
    const origFindFirst = prisma.bookingObject.findFirst;

    (prisma.bookingObject.findUnique as any) = async ({ where }: any) => {
      if (where.id === "cabin-1") return { id: "cabin-1" };
      if (where.id === "cabin-2") return { id: "cabin-2" };
      return null;
    };

    (prisma.bookingObject.findFirst as any) = async ({ where }: any) => {
      if (where?.page?.slug?.in?.includes("cabin-1-page")) return { id: "cabin-1" };
      if (where?.page?.slug?.in?.includes("cabin-2-page")) return { id: "cabin-2" };
      return null;
    };

    try {
      const obj1ById = await resolveBookingObjectId("cabin-1");
      const obj2ById = await resolveBookingObjectId("cabin-2");
      const obj1BySlug = await resolveBookingObjectId("cabin-1-page");
      const obj2BySlug = await resolveBookingObjectId("cabin-2-page");

      assert.equal(obj1ById, "cabin-1");
      assert.equal(obj2ById, "cabin-2");
      assert.equal(obj1BySlug, "cabin-1");
      assert.equal(obj2BySlug, "cabin-2");
    } finally {
      prisma.bookingObject.findUnique = origFindUnique;
      prisma.bookingObject.findFirst = origFindFirst;
    }
  });
});
