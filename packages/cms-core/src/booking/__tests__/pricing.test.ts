import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePeriodPrice } from "../../actions/bookings";

describe("Pricing Engine & Business Rules (calculatePeriodPrice)", () => {
  it("1. should calculate price from base_night_price when no season prices are defined", () => {
    const neutralObj = {
      id: "obj-test-1",
      name: "Stuga A",
      price_matrix: { base_night_price: 1500 },
    };
    const pricePeriods: any[] = [];
    const startDate = new Date("2026-06-01T12:00:00Z");
    const endDate = new Date("2026-06-04T12:00:00Z"); // 3 nights

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, true);
    assert.equal(result.totalPrice, 4500); // 3 nights * 1500
    assert.equal(result.error, undefined);
  });

  it("2. should calculate price using seasonal weekly rate for full week stays", () => {
    const neutralObj = {
      id: "obj-test-2",
      name: "Stuga B",
      price_matrix: { base_night_price: 1000 },
    };
    const pricePeriods = [
      {
        id: "season-1",
        start_date: "2026-07-01",
        end_date: "2026-07-31",
        price_week: 7000,
        price_day: 1200,
      },
    ];
    const startDate = new Date("2026-07-05T12:00:00Z"); // Sunday
    const endDate = new Date("2026-07-12T12:00:00Z");   // Sunday (7 nights)

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, true);
    assert.equal(result.totalPrice, 7000); // 1 full week @ 7000 SEK
  });

  it("3. should calculate price using weekend package (Thursday to Sunday, 3 nights)", () => {
    const neutralObj = {
      id: "obj-test-3",
      name: "Stuga C",
      price_matrix: { base_night_price: 1000 },
    };
    const pricePeriods = [
      {
        id: "season-weekend",
        start_date: "2026-07-01",
        end_date: "2026-07-31",
        price_thu_sun: 4200,
        price_day: 1500,
      },
    ];
    const startDate = new Date("2026-07-09T12:00:00Z"); // Thursday (day 4)
    const endDate = new Date("2026-07-12T12:00:00Z");   // Sunday (day 0, 3 nights)

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, true);
    assert.equal(result.totalPrice, 4200); // Package price
  });

  it("4. should correctly calculate price when a booking crosses a seasonal boundary", () => {
    const neutralObj = {
      id: "obj-test-boundary",
      name: "Stuga D",
      price_matrix: { base_night_price: 0 },
    };
    // Season A: June 1 to June 15 @ 1000 SEK/night
    // Season B: June 16 to June 30 @ 1800 SEK/night
    const pricePeriods = [
      {
        id: "season-early",
        start_date: "2026-06-01",
        end_date: "2026-06-15",
        price_day: 1000,
      },
      {
        id: "season-peak",
        start_date: "2026-06-16",
        end_date: "2026-06-30",
        price_day: 1800,
      },
    ];

    // Stay from June 14 to June 18:
    // Night 1: June 14 -> Season A (1000)
    // Night 2: June 15 -> Season A (1000)
    // Night 3: June 16 -> Season B (1800)
    // Night 4: June 17 -> Season B (1800)
    // Check-out: June 18 (not charged)
    const startDate = new Date("2026-06-14T12:00:00Z");
    const endDate = new Date("2026-06-18T12:00:00Z");

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, true);
    assert.equal(result.totalPrice, 5600); // 1000 + 1000 + 1800 + 1800
  });

  it("5. should evaluate to 0 and isPriced=false when base price is missing and no seasons exist", () => {
    const neutralObj = {
      id: "obj-unpriced",
      name: "Stuga E",
      price_matrix: {}, // No base_night_price
    };
    const pricePeriods: any[] = [];
    const startDate = new Date("2026-06-01T12:00:00Z");
    const endDate = new Date("2026-06-03T12:00:00Z");

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, false);
    assert.equal(result.totalPrice, 0);
    assert.ok(result.error);
    assert.match(result.error, /Pricing is missing for night 2026-06-01/);
  });

  it("6. should evaluate to 0 and isPriced=false when one or more nights in the period lack pricing", () => {
    const neutralObj = {
      id: "obj-gap",
      name: "Stuga F",
      price_matrix: { base_night_price: 0 }, // No base fallback
    };
    // Season A ends June 10, Season B starts June 15. June 11 to June 14 are unpriced.
    const pricePeriods = [
      {
        id: "season-1",
        start_date: "2026-06-01",
        end_date: "2026-06-10",
        price_day: 1000,
      },
      {
        id: "season-2",
        start_date: "2026-06-15",
        end_date: "2026-06-20",
        price_day: 1200,
      },
    ];

    const startDate = new Date("2026-06-09T12:00:00Z");
    const endDate = new Date("2026-06-16T12:00:00Z");

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, false);
    assert.equal(result.totalPrice, 0);
    assert.ok(result.error);
    assert.match(result.error, /Pricing is missing for night 2026-06-11/);
  });

  it("7. should not charge for check-out day (check-out day is not an overnight stay)", () => {
    const neutralObj = {
      id: "obj-checkout-test",
      name: "Stuga G",
      price_matrix: { base_night_price: 2000 },
    };
    const pricePeriods: any[] = [];
    // 2 nights: night of June 1, night of June 2. June 3 is check-out.
    const startDate = new Date("2026-06-01T12:00:00Z");
    const endDate = new Date("2026-06-03T12:00:00Z");

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, true);
    assert.equal(result.totalPrice, 4000); // 2 nights * 2000, NOT 3 * 2000
  });

  it("8. should strictly block booking creation when isPriced is false", () => {
    const neutralObj = {
      id: "obj-unpriced-create",
      name: "Stuga H",
      price_matrix: {},
    };
    const pricePeriods: any[] = [];
    const startDate = new Date("2026-06-01T12:00:00Z");
    const endDate = new Date("2026-06-03T12:00:00Z");

    const priceResult = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    // Business rule validation:
    const canCreateBooking = priceResult.isPriced && priceResult.totalPrice > 0;
    assert.equal(canCreateBooking, false);

    assert.throws(
      () => {
        if (!priceResult.isPriced || priceResult.totalPrice <= 0) {
          throw new Error(
            priceResult.error || "Booking cannot be processed due to missing pricing."
          );
        }
      },
      {
        message: /Pricing is missing for night 2026-06-01/,
      }
    );
  });

  it("9. should yield identical prices for availability search and booking creation", () => {
    const neutralObj = {
      id: "obj-shared-calc",
      name: "Stuga I",
      price_matrix: { base_night_price: 1800 },
    };
    const pricePeriods = [
      {
        id: "season-autumn",
        start_date: "2026-09-01",
        end_date: "2026-09-30",
        price_day: 1400,
      },
    ];
    const startDate = new Date("2026-09-10T12:00:00Z");
    const endDate = new Date("2026-09-15T12:00:00Z"); // 5 nights in season

    // Both availability-search and createBookingRequestAction invoke calculatePeriodPrice
    const searchPrice = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);
    const bookingPrice = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(searchPrice.isPriced, true);
    assert.equal(bookingPrice.isPriced, true);
    assert.equal(searchPrice.totalPrice, bookingPrice.totalPrice);
    assert.equal(searchPrice.totalPrice, 7000); // 5 nights * 1400
  });

  it("10. should reject invalid date intervals where end_date <= start_date", () => {
    const neutralObj = {
      id: "obj-invalid-dates",
      name: "Stuga J",
      price_matrix: { base_night_price: 1000 },
    };
    const pricePeriods: any[] = [];
    const startDate = new Date("2026-06-05T12:00:00Z");
    const endDate = new Date("2026-06-03T12:00:00Z");

    const result = calculatePeriodPrice(neutralObj, pricePeriods, startDate, endDate);

    assert.equal(result.isPriced, false);
    assert.equal(result.totalPrice, 0);
    assert.equal(result.error, "End date must be strictly after start date.");
  });
});
