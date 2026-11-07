import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  recordBookingDiscrepancy,
  getBookingDiscrepanciesAction,
  acknowledgeBookingDiscrepancyAction,
  clearBookingDiscrepanciesAction,
  BookingDiscrepancy,
} from "../discrepancies";
import { prisma } from "../../db";
import { verifyAdminAuth } from "../../server/api-handlers";
import { NextRequest } from "next/server";

describe("Discrepancy Logging & Lifecycle", () => {
  it("1. should record a new discrepancy and retrieve it", async () => {
    let mockStore: string | null = null;
    const origFindUnique = prisma.setting.findUnique;
    const origUpsert = prisma.setting.upsert;
    const origTransaction = prisma.$transaction;

    (prisma.setting.findUnique as any) = async () => (mockStore ? { setting_value: mockStore } : null);
    (prisma.setting.upsert as any) = async ({ create, update }: any) => {
      mockStore = update?.setting_value || create?.setting_value;
      return { id: "1", setting_key: "system_booking_discrepancies", setting_value: mockStore };
    };
    (prisma.$transaction as any) = async (cb: any) => cb({
      $queryRaw: async () => [],
      setting: {
        findUnique: async () => (mockStore ? { setting_value: mockStore } : null),
        upsert: async ({ create, update }: any) => {
          mockStore = update?.setting_value || create?.setting_value;
          return { id: "1", setting_key: "system_booking_discrepancies", setting_value: mockStore };
        },
      },
    });

    try {
      await recordBookingDiscrepancy({
        type: "OBJECT_NOT_FOUND",
        objectId: "unit-999",
        objectName: "Stuga 999",
        period: { startDate: "2026-06-01", endDate: "2026-06-05" },
        message: "Booking object 'unit-999' was not found.",
      });

      const list = await getBookingDiscrepanciesAction();
      assert.equal(list.length, 1);
      assert.equal(list[0].type, "OBJECT_NOT_FOUND");
      assert.equal(list[0].objectId, "unit-999");
      assert.equal(list[0].occurrences, 1);
      assert.equal(list[0].acknowledged, false);
    } finally {
      prisma.setting.findUnique = origFindUnique;
      prisma.setting.upsert = origUpsert;
      prisma.$transaction = origTransaction;
    }
  });

  it("2. should deduplicate matching discrepancy and increment occurrences", async () => {
    let mockStore: string | null = null;
    const origFindUnique = prisma.setting.findUnique;
    const origTransaction = prisma.$transaction;

    (prisma.setting.findUnique as any) = async () => (mockStore ? { setting_value: mockStore } : null);
    (prisma.$transaction as any) = async (cb: any) => cb({
      $queryRaw: async () => [],
      setting: {
        findUnique: async () => (mockStore ? { setting_value: mockStore } : null),
        upsert: async ({ update, create }: any) => {
          mockStore = update?.setting_value || create?.setting_value;
          return { setting_value: mockStore };
        },
      },
    });

    try {
      // First occurrence
      await recordBookingDiscrepancy({
        type: "OBJECT_MISSING_PRICE",
        objectId: "unit-abc",
        objectName: "Stuga ABC",
        message: "Object lacks pricing.",
      });

      // Second occurrence of same type and object
      await recordBookingDiscrepancy({
        type: "OBJECT_MISSING_PRICE",
        objectId: "unit-abc",
        objectName: "Stuga ABC",
        message: "Object lacks pricing again.",
      });

      const list = await getBookingDiscrepanciesAction();
      assert.equal(list.length, 1);
      assert.equal(list[0].occurrences, 2);
      assert.equal(list[0].message, "Object lacks pricing again.");
    } finally {
      prisma.setting.findUnique = origFindUnique;
      prisma.$transaction = origTransaction;
    }
  });

  it("3. should acknowledge and reopen a discrepancy", async () => {
    let mockStore = JSON.stringify([
      {
        id: "disc-1",
        type: "PERIOD_MISSING_PRICE",
        objectId: "unit-10",
        message: "Missing price",
        occurrences: 1,
        acknowledged: false,
        timestamp: "2026-06-01T10:00:00.000Z",
        lastOccurredAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    const origFindUnique = prisma.setting.findUnique;
    const origTransaction = prisma.$transaction;

    (prisma.setting.findUnique as any) = async () => ({ setting_value: mockStore });
    (prisma.$transaction as any) = async (cb: any) => cb({
      $queryRaw: async () => [],
      setting: {
        findUnique: async () => ({ setting_value: mockStore }),
        update: async ({ data }: any) => {
          mockStore = data.setting_value;
          return { setting_value: mockStore };
        },
      },
    });

    try {
      // Acknowledge
      const ackRes = await acknowledgeBookingDiscrepancyAction({
        id: "disc-1",
        acknowledged: true,
        adminEmail: "admin@test.se",
      });
      assert.equal(ackRes.success, true);
      assert.equal(ackRes.count, 1);

      const acknowledgedList = await getBookingDiscrepanciesAction();
      assert.equal(acknowledgedList[0].acknowledged, true);
      assert.equal(acknowledgedList[0].acknowledgedBy, "admin@test.se");
      assert.ok(acknowledgedList[0].acknowledgedAt);

      // Reopen
      const reopenRes = await acknowledgeBookingDiscrepancyAction({
        id: "disc-1",
        acknowledged: false,
      });
      assert.equal(reopenRes.success, true);

      const reopenedList = await getBookingDiscrepanciesAction();
      assert.equal(reopenedList[0].acknowledged, false);
      assert.equal(reopenedList[0].acknowledgedBy, undefined);
    } finally {
      prisma.setting.findUnique = origFindUnique;
      prisma.$transaction = origTransaction;
    }
  });

  it("4. should re-activate a previously acknowledged discrepancy if it recurs", async () => {
    let mockStore = JSON.stringify([
      {
        id: "disc-recurring",
        type: "TECHNICAL_DATABASE_ERROR",
        objectId: "unit-50",
        message: "Database timeout",
        occurrences: 1,
        acknowledged: true,
        acknowledgedAt: "2026-06-01T12:00:00.000Z",
        acknowledgedBy: "admin@test.se",
        timestamp: "2026-06-01T10:00:00.000Z",
        lastOccurredAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    const origFindUnique = prisma.setting.findUnique;
    const origTransaction = prisma.$transaction;

    (prisma.setting.findUnique as any) = async () => ({ setting_value: mockStore });
    (prisma.$transaction as any) = async (cb: any) => cb({
      $queryRaw: async () => [],
      setting: {
        findUnique: async () => ({ setting_value: mockStore }),
        upsert: async ({ update }: any) => {
          mockStore = update.setting_value;
          return { setting_value: mockStore };
        },
      },
    });

    try {
      // Recur
      await recordBookingDiscrepancy({
        type: "TECHNICAL_DATABASE_ERROR",
        objectId: "unit-50",
        message: "Database timeout again",
      });

      const list = await getBookingDiscrepanciesAction();
      assert.equal(list.length, 1);
      assert.equal(list[0].occurrences, 2);
      assert.equal(list[0].acknowledged, false); // Re-flagged as active!
      assert.equal(list[0].acknowledgedAt, undefined);
      assert.equal(list[0].acknowledgedBy, undefined);
    } finally {
      prisma.setting.findUnique = origFindUnique;
      prisma.$transaction = origTransaction;
    }
  });

  it("5. should handle concurrent registrations without lost updates", async () => {
    let mockStore: string | null = null;
    const origFindUnique = prisma.setting.findUnique;
    const origTransaction = prisma.$transaction;

    (prisma.setting.findUnique as any) = async () => (mockStore ? { setting_value: mockStore } : null);
    (prisma.$transaction as any) = async (cb: any) => cb({
      $queryRaw: async () => [],
      setting: {
        findUnique: async () => (mockStore ? { setting_value: mockStore } : null),
        upsert: async ({ create, update }: any) => {
          // Simulate non-zero async delay
          await new Promise((r) => setTimeout(r, 10));
          mockStore = update?.setting_value || create?.setting_value;
          return { setting_value: mockStore };
        },
      },
    });

    try {
      // 5 concurrent registrations for 5 different objects starting from an empty database
      await Promise.all([
        recordBookingDiscrepancy({ type: "OBJECT_NOT_FOUND", objectId: "c-1", message: "Error 1" }),
        recordBookingDiscrepancy({ type: "OBJECT_NOT_FOUND", objectId: "c-2", message: "Error 2" }),
        recordBookingDiscrepancy({ type: "OBJECT_NOT_FOUND", objectId: "c-3", message: "Error 3" }),
        recordBookingDiscrepancy({ type: "OBJECT_NOT_FOUND", objectId: "c-4", message: "Error 4" }),
        recordBookingDiscrepancy({ type: "OBJECT_NOT_FOUND", objectId: "c-5", message: "Error 5" }),
      ]);

      const list = await getBookingDiscrepanciesAction();
      assert.equal(list.length, 5); // None lost!
    } finally {
      prisma.setting.findUnique = origFindUnique;
      prisma.$transaction = origTransaction;
    }
  });

  it("6. should never throw when database fails, preserving caller stability", async () => {
    const origTransaction = prisma.$transaction;
    (prisma.$transaction as any) = async () => {
      throw new Error("Simulated critical DB failure");
    };

    try {
      // Must not throw error
      await assert.doesNotReject(async () => {
        await recordBookingDiscrepancy({
          type: "TECHNICAL_DATABASE_ERROR",
          objectId: "test-unit",
          message: "Original booking error",
        });
      });
    } finally {
      prisma.$transaction = origTransaction;
    }
  });

  it("7. should reject unauthorized requests and verify administrator identity", async () => {
    // Test that verifyAdminAuth rejects requests without a valid session token
    const unauthenticatedReq = new NextRequest("http://localhost:3000/api/cms/bookings/discrepancies");
    const unauthResult = await verifyAdminAuth(unauthenticatedReq);
    assert.equal(unauthResult.authorized, false);
    assert.equal(unauthResult.identity, undefined);
  });
});
