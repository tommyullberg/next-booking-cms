import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveSeedConfig, seedTenant } from "../loader";

describe("Seed Config Loader & Tenant Runner", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SEED_CONFIG_JSON;
    delete process.env.SEED_CONFIG_FILE;
    delete process.env.APP_NAME;
    delete process.env.SEED_SECTION_NAME;
    delete process.env.SEED_PAGE_TITLE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("1. should return defaults when no overrides are provided", () => {
    const { config, source } = resolveSeedConfig();
    assert.equal(source, "cms-core defaults");
    assert.equal(config.section.name, "Hem");
    assert.equal(config.page.page_title, "Startsida");
    assert.equal(config.page.id, 1001);
  });

  it("2. should parse SEED_CONFIG_JSON from environment variable (cloud deployment)", () => {
    process.env.SEED_CONFIG_JSON = JSON.stringify({
      section: { name: "Cloud Production Menu" },
      page: {
        page_title: "Cloud Luxury Villa",
        slug: "/",
        template_name: "booking",
        fields: [],
      },
      bundle: {
        landlords: [{ first_name: "Cloud", last_name: "Owner", email: "owner@cloud.se" }],
      },
    });

    const { config, source } = resolveSeedConfig();
    assert.equal(source, "environment variable: SEED_CONFIG_JSON");
    assert.equal(config.section.name, "Cloud Production Menu");
    assert.equal(config.page.page_title, "Cloud Luxury Villa");
    assert.ok(config.bundle);
    assert.equal(config.bundle.landlords?.[0].first_name, "Cloud");
  });

  it("3. seedTenant should execute system setup and bundle idempotently", async () => {
    const actions: string[] = [];

    const mockPool: any = {
      query: async (sql: string) => {
        actions.push("pool.query");
        if (sql.includes("information_schema")) {
          return { rows: [{ data_type: "integer" }] };
        }
        return { rows: [] };
      },
    };

    const mockPrisma: any = {
      administrator: {
        findUnique: async () => ({ id: "admin-1", email: "admin@test.com" }),
      },
      section: {
        findFirst: async () => ({ id: "sec-1", name: "Hem" }),
      },
      page: {
        findUnique: async () => ({ id: 1001, page_title: "Startsida" }),
      },
      pageField: {
        findUnique: async () => ({ id: "pf-1" }),
      },
      landlord: {
        findFirst: async () => null,
        create: async ({ data }: any) => {
          actions.push(`landlord.create:${data.first_name}`);
          return { id: "ll-1", ...data };
        },
      },
    };

    process.env.SEED_CONFIG_JSON = JSON.stringify({
      section: { name: "Tenant Menu" },
      page: { page_title: "Tenant Villa", slug: "/", template_name: "booking", fields: [] },
      bundle: {
        landlords: [{ first_name: "Tenant", last_name: "Landlord", email: "landlord@tenant.se" }],
      },
    });

    const result = await seedTenant(mockPrisma, mockPool);
    assert.equal(result.config.section.name, "Tenant Menu");
    assert.ok(actions.includes("landlord.create:Tenant"));
  });
});
