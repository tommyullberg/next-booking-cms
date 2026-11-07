import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  seedLandlords,
  seedAmenities,
  seedBookingObjects,
  seedBookingOptionals,
  seedPricePeriods,
  seedBookings,
  seedBookingBundle,
  SeedBookingBundleInput,
} from "../booking-seed-helpers";

describe("Booking Seed Helpers & Idempotency", () => {
  it("1. seedLandlords should create landlord if absent and retain if existing", async () => {
    const store = new Map<string, any>();

    const mockPrisma: any = {
      landlord: {
        findFirst: async ({ where }: any) => {
          if (where.email) {
            for (const item of store.values()) {
              if (item.email === where.email) return item;
            }
          }
          if (where.first_name && where.last_name) {
            for (const item of store.values()) {
              if (item.first_name === where.first_name && item.last_name === where.last_name) {
                return item;
              }
            }
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `ll-${Date.now()}`, ...data };
          store.set(record.id, record);
          return record;
        },
        update: async ({ where, data }: any) => {
          const existing = store.get(where.id);
          const updated = { ...existing, ...data };
          store.set(where.id, updated);
          return updated;
        },
      },
    };

    // First run: should create
    const map1 = await seedLandlords(mockPrisma, [
      { first_name: "Demo", last_name: "Host", email: "demo@example.com", address: "Original Address" },
    ]);
    assert.equal(store.size, 1);
    const firstId = map1.get("Demo Host");
    assert.ok(firstId);

    // Second run with different address and overwrite: false (default): should RETAIN original address
    const map2 = await seedLandlords(mockPrisma, [
      { first_name: "Demo", last_name: "Host", email: "demo@example.com", address: "Modified In Seed Address" },
    ]);
    assert.equal(store.size, 1);
    assert.equal(map2.get("Demo Host"), firstId);
    assert.equal(store.get(firstId).address, "Original Address"); // Verified not overwritten!

    // Third run with overwrite: true: should update
    await seedLandlords(mockPrisma, [
      { first_name: "Demo", last_name: "Host", email: "demo@example.com", address: "Explicitly Overwritten" },
    ], { overwrite: true });
    assert.equal(store.get(firstId).address, "Explicitly Overwritten");
  });

  it("2. seedAmenities should create new amenities and avoid duplicates on rerun", async () => {
    const store = new Map<string, any>();

    const mockPrisma: any = {
      amenity: {
        findUnique: async ({ where }: any) => {
          for (const item of store.values()) {
            if (item.name === where.name) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `am-${Date.now()}-${Math.random()}`, ...data };
          store.set(record.name, record);
          return record;
        },
        update: async ({ where, data }: any) => {
          const existing = store.get(where.id);
          const updated = { ...existing, ...data };
          store.set(where.id, updated);
          return updated;
        },
      },
    };

    // First run
    const map1 = await seedAmenities(mockPrisma, ["WiFi", "Bastu", "Kök"]);
    assert.equal(store.size, 3);
    assert.ok(map1.has("WiFi"));

    // Second run: duplicate call should not add any rows
    const map2 = await seedAmenities(mockPrisma, ["WiFi", "Bastu", "Kök"]);
    assert.equal(store.size, 3);
    assert.equal(map2.get("WiFi"), map1.get("WiFi"));
  });

  it("3. seedBookingObjects should create objects, link landlords, and retain manual edits on rerun", async () => {
    const store = new Map<string, any>();

    const mockPrisma: any = {
      page: {
        findFirst: async () => null,
      },
      bookingObject: {
        findUnique: async ({ where }: any) => store.get(where.id) || null,
        findFirst: async ({ where }: any) => {
          for (const item of store.values()) {
            if (item.name === where.name) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: data.id || `obj-${Math.random()}`, ...data };
          store.set(record.id, record);
          return record;
        },
        update: async ({ where, data }: any) => {
          const existing = store.get(where.id);
          const updated = { ...existing, ...data };
          store.set(where.id, updated);
          return updated;
        },
      },
    };

    const landlordsMap = new Map([["demo@example.com", "ll-101"]]);

    // First run: create Strandvillan
    const map1 = await seedBookingObjects(mockPrisma, [
      { name: "Strandvillan", type: "Villa", bed_count: 6, landlord_email: "demo@example.com" },
    ], landlordsMap);

    assert.equal(store.size, 1);
    const objId = map1.get("Strandvillan")!;
    assert.equal(store.get(objId).landlord_id, "ll-101");
    assert.equal(store.get(objId).bed_count, 6);

    // Simulate user manually editing beds in Admin UI to 8
    store.get(objId).bed_count = 8;

    // Second run: default overwrite=false must retain user's manual change
    await seedBookingObjects(mockPrisma, [
      { name: "Strandvillan", type: "Villa", bed_count: 6, landlord_email: "demo@example.com" },
    ], landlordsMap);

    assert.equal(store.get(objId).bed_count, 8); // Retained!
  });

  it("4. seedBookingBundle should execute end-to-end idempotently", async () => {
    const landlordsStore = new Map<string, any>();
    const amenitiesStore = new Map<string, any>();
    const objectsStore = new Map<string, any>();
    const optionalsStore = new Map<string, any>();
    const periodsStore = new Map<string, any>();
    const bookingsStore = new Map<string, any>();

    const mockPrisma: any = {
      page: { findFirst: async () => null },
      landlord: {
        findFirst: async ({ where }: any) => {
          for (const item of landlordsStore.values()) {
            if (item.email === where.email) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `ll-${Math.random()}`, ...data };
          landlordsStore.set(record.id, record);
          return record;
        },
      },
      amenity: {
        findUnique: async ({ where }: any) => amenitiesStore.get(where.name) || null,
        create: async ({ data }: any) => {
          const record = { id: `am-${Math.random()}`, ...data };
          amenitiesStore.set(record.name, record);
          return record;
        },
      },
      bookingObject: {
        findUnique: async ({ where }: any) => objectsStore.get(where.id) || null,
        findFirst: async ({ where }: any) => {
          for (const item of objectsStore.values()) {
            if (item.name === where.name) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `obj-${Math.random()}`, ...data };
          objectsStore.set(record.id, record);
          return record;
        },
      },
      bookingOptional: {
        findFirst: async ({ where }: any) => {
          for (const item of optionalsStore.values()) {
            if (item.name === where.name && item.object_id === where.object_id) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `opt-${Math.random()}`, ...data };
          optionalsStore.set(record.id, record);
          return record;
        },
      },
      objectPricePeriod: {
        findFirst: async ({ where }: any) => {
          for (const item of periodsStore.values()) {
            if (item.object_id === where.object_id && item.name === where.name) return item;
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `pp-${Math.random()}`, ...data };
          periodsStore.set(record.id, record);
          return record;
        },
      },
      booking: {
        findFirst: async ({ where }: any) => {
          for (const item of bookingsStore.values()) {
            if (
              item.object_id === where.object_id &&
              item.start_date.getTime() === where.start_date.getTime() &&
              item.end_date.getTime() === where.end_date.getTime()
            ) {
              return item;
            }
          }
          return null;
        },
        create: async ({ data }: any) => {
          const record = { id: `bk-${Math.random()}`, ...data };
          bookingsStore.set(record.id, record);
          return record;
        },
      },
    };

    const bundle: SeedBookingBundleInput = {
      landlords: [{ first_name: "Demo", last_name: "Host", email: "demo@host.se" }],
      amenities: ["WiFi", "Bastu"],
      objects: [{ name: "Sjöstugan", landlord_email: "demo@host.se" }],
      optionals: [{ name: "Barnstol", price_day: 15 }],
      price_periods: [{
        object_name: "Sjöstugan",
        name: "Sommar 2026",
        start_date: "2026-06-01",
        end_date: "2026-08-31",
        price_week: 15000,
      }],
      bookings: [{
        object_name: "Sjöstugan",
        customer_name: "Test Person",
        customer_email: "test@example.com",
        start_date: "2026-07-01",
        end_date: "2026-07-08",
      }],
    };

    // First execution
    const res1 = await seedBookingBundle(mockPrisma, bundle);
    assert.equal(landlordsStore.size, 1);
    assert.equal(amenitiesStore.size, 2);
    assert.equal(objectsStore.size, 1);
    assert.equal(optionalsStore.size, 1);
    assert.equal(periodsStore.size, 1);
    assert.equal(bookingsStore.size, 1);

    // Second execution: must be completely idempotent, count must remain identical
    const res2 = await seedBookingBundle(mockPrisma, bundle);
    assert.equal(landlordsStore.size, 1);
    assert.equal(amenitiesStore.size, 2);
    assert.equal(objectsStore.size, 1);
    assert.equal(optionalsStore.size, 1);
    assert.equal(periodsStore.size, 1);
    assert.equal(bookingsStore.size, 1);
  });
});
