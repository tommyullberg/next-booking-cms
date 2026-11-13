import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPageUrl,
  parsePublicRoutePath,
  formatInternalLink,
  parseInternalLink,
} from "../url";

describe("Central URL Generator - getPageUrl", () => {
  describe("Default Language = Swedish (sv)", () => {
    it("should generate root '/' for homepage with without-prefix", () => {
      const url = getPageUrl({
        isHomepage: true,
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/");
    });

    it("should generate '/sv' for homepage with with-prefix", () => {
      const url = getPageUrl({
        isHomepage: true,
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      });
      assert.strictEqual(url, "/sv");
    });

    it("should generate '/en' and '/de' for other languages on homepage regardless of prefix mode", () => {
      const enUrl = getPageUrl({
        isHomepage: true,
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      const deUrl = getPageUrl({
        isHomepage: true,
        locale: "de",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      });
      assert.strictEqual(enUrl, "/en");
      assert.strictEqual(deUrl, "/de");
    });

    it("should generate subpage URL without prefix for default language when without-prefix is set", () => {
      const url = getPageUrl({
        slug: "om-oss",
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/om-oss");
    });

    it("should generate subpage URL with prefix for default language when with-prefix is set", () => {
      const url = getPageUrl({
        slug: "om-oss",
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      });
      assert.strictEqual(url, "/sv/om-oss");
    });

    it("should generate subpage URL with language prefix for other languages", () => {
      const enUrl = getPageUrl({
        slug: "about-us",
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      const deUrl = getPageUrl({
        slug: "uber-uns",
        locale: "de",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      });
      assert.strictEqual(enUrl, "/en/about-us");
      assert.strictEqual(deUrl, "/de/uber-uns");
    });
  });

  describe("Dynamic Default Language = English (en)", () => {
    it("should generate root '/' for homepage in English without-prefix", () => {
      const url = getPageUrl({
        isHomepage: true,
        locale: "en",
        defaultLanguage: "en",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/");
    });

    it("should generate '/en' for homepage in English with-prefix", () => {
      const url = getPageUrl({
        isHomepage: true,
        locale: "en",
        defaultLanguage: "en",
        urlPrefixMode: "with-prefix",
      });
      assert.strictEqual(url, "/en");
    });

    it("should generate '/sv' for homepage in Swedish when English is default", () => {
      const url = getPageUrl({
        isHomepage: true,
        locale: "sv",
        defaultLanguage: "en",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/sv");
    });

    it("should generate '/about-us' for English subpage without-prefix", () => {
      const url = getPageUrl({
        slug: "about-us",
        locale: "en",
        defaultLanguage: "en",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/about-us");
    });

    it("should generate '/sv/om-oss' for Swedish subpage when English is default", () => {
      const url = getPageUrl({
        slug: "om-oss",
        locale: "sv",
        defaultLanguage: "en",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/sv/om-oss");
    });
  });

  describe("Slug Mode & Per-Page Translations", () => {
    const mockPage = {
      id: 1002,
      slug: "stugor",
      slug_mode: "separate",
      translations: [
        { locale: "en", slug: "cabins", page_title: "Cabins" },
        { locale: "de", slug: "ferienhauser", page_title: "Ferienhäuser" },
      ],
    };

    it("should resolve separate localized slugs per language when slug_mode is separate", () => {
      const svUrl = getPageUrl({
        page: mockPage,
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      const enUrl = getPageUrl({
        page: mockPage,
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      const deUrl = getPageUrl({
        page: mockPage,
        locale: "de",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });

      assert.strictEqual(svUrl, "/stugor");
      assert.strictEqual(enUrl, "/en/cabins");
      assert.strictEqual(deUrl, "/de/ferienhauser");
    });

    it("should fall back to common slug when translation slug is empty in separate mode", () => {
      const pageWithEmptyTransSlug = {
        id: 1003,
        slug: "kontakt",
        slug_mode: "separate",
        translations: [{ locale: "en", slug: "", page_title: "Contact" }],
      };

      const enUrl = getPageUrl({
        page: pageWithEmptyTransSlug,
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(enUrl, "/en/kontakt");
    });

    it("should fall back to numeric page ID when slug is empty", () => {
      const pageWithoutSlug = {
        id: 1004,
        slug: "",
        slug_mode: "same",
      };

      const svUrl = getPageUrl({
        page: pageWithoutSlug,
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      const enUrl = getPageUrl({
        page: pageWithoutSlug,
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });

      assert.strictEqual(svUrl, "/1004");
      assert.strictEqual(enUrl, "/en/1004");
    });

    it("should normalize leading and trailing slashes", () => {
      const url = getPageUrl({
        slug: "///boka/stuga///",
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/boka/stuga");
    });

    it("should detect page ID 1001 as homepage automatically", () => {
      const url = getPageUrl({
        page: { id: 1001, slug: "/" },
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      });
      assert.strictEqual(url, "/");
    });
  });

  describe("Four Core Matrix Combinations (Prompt Spec)", () => {
    const pageWithSeparate = {
      id: 2001,
      slug: "sommarstugan",
      slug_mode: "separate",
      translations: [
        { locale: "sv", slug: "sommarstugan", page_title: "Sommarstugan" },
        { locale: "en", slug: "summer-cottage", page_title: "Summer Cottage" },
        { locale: "de", slug: "sommerhaus", page_title: "Sommerhaus" },
      ],
    };

    const pageWithSame = {
      id: 2002,
      slug: "sommarstugan",
      slug_mode: "same",
      translations: [
        { locale: "en", slug: "", page_title: "Summer Cottage" },
        { locale: "de", slug: "", page_title: "Sommerhaus" },
      ],
    };

    it("Combination 1: WITH PREFIX + SAME SLUG", () => {
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/sv/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "en", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/en/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "de", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/de/sommarstugan"
      );
    });

    it("Combination 2: WITH PREFIX + SEPARATE SLUGS", () => {
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/sv/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "en", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/en/summer-cottage"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "de", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/de/sommerhaus"
      );
    });

    it("Combination 3: WITHOUT PREFIX + SAME SLUG", () => {
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "en", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/en/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSame, locale: "de", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/de/sommarstugan"
      );
    });

    it("Combination 4: WITHOUT PREFIX + SEPARATE SLUGS", () => {
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/sommarstugan"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "en", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/en/summer-cottage"
      );
      assert.strictEqual(
        getPageUrl({ page: pageWithSeparate, locale: "de", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/de/sommerhaus"
      );
    });

    it("User Exact Example: 'stugor' with Swedish as default", () => {
      const pageStugorSame = {
        id: 2003,
        slug: "stugor",
        slug_mode: "same",
      };

      // With prefix + Same slug
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/sv/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "en", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/en/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "de", defaultLanguage: "sv", urlPrefixMode: "with-prefix" }),
        "/de/stugor"
      );

      // Without prefix + Same slug
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "sv", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "en", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/en/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "de", defaultLanguage: "sv", urlPrefixMode: "without-prefix" }),
        "/de/stugor"
      );
    });

    it("User Exact Example: 'stugor' with English as default (verifying dynamic site language)", () => {
      const pageStugorSame = {
        id: 2003,
        slug: "stugor",
        slug_mode: "same",
      };

      // With prefix + Same slug (English default)
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "en", defaultLanguage: "en", urlPrefixMode: "with-prefix" }),
        "/en/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "sv", defaultLanguage: "en", urlPrefixMode: "with-prefix" }),
        "/sv/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "de", defaultLanguage: "en", urlPrefixMode: "with-prefix" }),
        "/de/stugor"
      );

      // Without prefix + Same slug (English default gets no prefix, Swedish & German get prefixes)
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "en", defaultLanguage: "en", urlPrefixMode: "without-prefix" }),
        "/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "sv", defaultLanguage: "en", urlPrefixMode: "without-prefix" }),
        "/sv/stugor"
      );
      assert.strictEqual(
        getPageUrl({ page: pageStugorSame, locale: "de", defaultLanguage: "en", urlPrefixMode: "without-prefix" }),
        "/de/stugor"
      );
    });
  });
});

describe("Public Route Parser - parsePublicRoutePath", () => {
  it("should parse empty path as root homepage in default language", () => {
    const res = parsePublicRoutePath("", {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
    });
    assert.strictEqual(res.isHomepage, true);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.slug, "/");
    assert.strictEqual(res.hasPrefix, false);
    assert.strictEqual(res.shouldRedirectToRoot, false);
    assert.strictEqual(res.canonicalUrl, "/");
  });

  it("should parse '/en' as homepage in English", () => {
    const res = parsePublicRoutePath(["en"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, true);
    assert.strictEqual(res.locale, "en");
    assert.strictEqual(res.slug, "/");
    assert.strictEqual(res.hasPrefix, true);
    assert.strictEqual(res.shouldRedirectToRoot, false);
    assert.strictEqual(res.canonicalUrl, "/en");
  });

  it("should signal redirect to root when visiting '/sv' if without-prefix is configured", () => {
    const res = parsePublicRoutePath(["sv"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, true);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.shouldRedirectToRoot, true);
    assert.strictEqual(res.canonicalUrl, "/");
  });

  it("should allow '/sv' as valid homepage when with-prefix is configured", () => {
    const res = parsePublicRoutePath(["sv"], {
      defaultLanguage: "sv",
      urlPrefixMode: "with-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, true);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.shouldRedirectToRoot, false);
    assert.strictEqual(res.canonicalUrl, "/sv");
  });

  it("should parse subpage in default language without prefix", () => {
    const res = parsePublicRoutePath(["om-oss"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, false);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.slug, "om-oss");
    assert.strictEqual(res.hasPrefix, false);
  });

  it("should parse subpage with language prefix '/en/about-us'", () => {
    const res = parsePublicRoutePath(["en", "about-us"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, false);
    assert.strictEqual(res.locale, "en");
    assert.strictEqual(res.slug, "about-us");
    assert.strictEqual(res.hasPrefix, true);
    assert.strictEqual(res.canonicalUrl, "/en/about-us");
  });

  it("should redirect numeric startpage '/1001' to root", () => {
    const res = parsePublicRoutePath(["1001"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
    });
    assert.strictEqual(res.isHomepage, true);
    assert.strictEqual(res.shouldRedirectToRoot, true);
  });

  it("should treat unknown language prefix (e.g. 'fr') as part of the slug if not active", () => {
    const res = parsePublicRoutePath(["fr", "bonjour"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, false);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.slug, "fr/bonjour");
    assert.strictEqual(res.hasPrefix, false);
  });

  it("should treat single unknown prefix segment (e.g. 'fr') as a regular slug in default language", () => {
    const res = parsePublicRoutePath(["fr"], {
      defaultLanguage: "sv",
      urlPrefixMode: "without-prefix",
      activeLanguages: ["sv", "en", "de"],
    });
    assert.strictEqual(res.isHomepage, false);
    assert.strictEqual(res.locale, "sv");
    assert.strictEqual(res.slug, "fr");
    assert.strictEqual(res.hasPrefix, false);
  });

  describe("Bidirectional Round-Trip Consistency", () => {
    const activeLanguages = ["sv", "en", "de"];

    it("should round-trip WITH PREFIX generated URLs correctly through parser", () => {
      const svUrl = getPageUrl({
        slug: "boka",
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      }); // "/sv/boka"
      const parsedSv = parsePublicRoutePath(svUrl, {
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
        activeLanguages,
      });
      assert.strictEqual(parsedSv.locale, "sv");
      assert.strictEqual(parsedSv.slug, "boka");
      assert.strictEqual(parsedSv.canonicalUrl, "/sv/boka");

      const enUrl = getPageUrl({
        slug: "book",
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
      }); // "/en/book"
      const parsedEn = parsePublicRoutePath(enUrl, {
        defaultLanguage: "sv",
        urlPrefixMode: "with-prefix",
        activeLanguages,
      });
      assert.strictEqual(parsedEn.locale, "en");
      assert.strictEqual(parsedEn.slug, "book");
      assert.strictEqual(parsedEn.canonicalUrl, "/en/book");
    });

    it("should round-trip WITHOUT PREFIX generated URLs correctly through parser", () => {
      const svUrl = getPageUrl({
        slug: "boka",
        locale: "sv",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      }); // "/boka"
      const parsedSv = parsePublicRoutePath(svUrl, {
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
        activeLanguages,
      });
      assert.strictEqual(parsedSv.locale, "sv");
      assert.strictEqual(parsedSv.slug, "boka");
      assert.strictEqual(parsedSv.canonicalUrl, "/boka");

      const enUrl = getPageUrl({
        slug: "book",
        locale: "en",
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
      }); // "/en/book"
      const parsedEn = parsePublicRoutePath(enUrl, {
        defaultLanguage: "sv",
        urlPrefixMode: "without-prefix",
        activeLanguages,
      });
      assert.strictEqual(parsedEn.locale, "en");
      assert.strictEqual(parsedEn.slug, "book");
      assert.strictEqual(parsedEn.canonicalUrl, "/en/book");
    });
  });
});

describe("Internal Links Helpers", () => {
  it("should format and parse internal link references correctly", () => {
    const formatted = formatInternalLink(1005, "en");
    assert.ok(typeof formatted === "string");

    const parsed = parseInternalLink(formatted);
    assert.ok(parsed);
    assert.strictEqual(parsed?.type, "internal");
    assert.strictEqual(parsed?.pageId, 1005);
    assert.strictEqual(parsed?.locale, "en");
  });

  it("should return null for non-JSON or invalid strings", () => {
    assert.strictEqual(parseInternalLink(""), null);
    assert.strictEqual(parseInternalLink("not-a-link"), null);
    assert.strictEqual(parseInternalLink('{"type":"external","url":"https://example.com"}'), null);
  });
});

