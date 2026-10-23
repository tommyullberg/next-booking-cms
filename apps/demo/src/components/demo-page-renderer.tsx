"use client";

import React from "react";
import {
  CMSPageProvider,
  CMSField,
  InlineEditor,
  CMSQueryProvider,
  AvailabilitySearch,
  CMSPageData,
} from "@next-booking/cms-core";
import { Layers, ShieldCheck } from "lucide-react";

export const fallbackDemoHomePage: CMSPageData = {
  id: 1001,
  template_name: "startpage",
  page_title: "Startsida",
  slug: "/",
  status: "PUBLISHED",
  page_fields: [
    {
      id: "f-1",
      page_id: 1001,
      nbr: 1,
      field_type: "TEXT",
      content: "Framtidens bokningsmotor & headless CMS",
      type: "plain",
    },
    {
      id: "f-2",
      page_id: 1001,
      nbr: 2,
      field_type: "TEXT",
      content:
        "Ett professionellt, WCAG-anpassat och blixtsnabbt system byggt för moderna hotell, villor och exklusiva semesterboenden. Integrerar flexibel bokningskalender och sömlös iCal-synk.",
      type: "plain",
    },
    {
      id: "f-3",
      page_id: 1001,
      nbr: 3,
      field_type: "TEXT",
      content: "Hitta ditt drömboende med flexibla datum",
      type: "plain",
    },
    {
      id: "f-img-1",
      page_id: 1001,
      nbr: 1,
      field_type: "IMAGE",
      image: {
        id: "img-1",
        file_name: "modern-starter-villa.jpg",
        file_url:
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80",
      },
      ratio: "16/9",
      max_width: 1200,
    },
    {
      id: "f-nav-1",
      page_id: 1001,
      nbr: 1,
      field_type: "NAVIGATION",
      navigation: {
        id: "nav-main",
        name: "Huvudmeny",
        type: "HEADER",
        navigation_links: [
          { id: "l1", link_url: "/", link_text: "Hem", sort_order: 1 },
          { id: "l2", link_url: "/#booking", link_text: "Boka", sort_order: 2 },
        ],
      },
    },
  ],
};

export function DemoPageRenderer({ page }: { page?: CMSPageData | null }) {
  const activePage = page || fallbackDemoHomePage;

  return (
    <CMSQueryProvider>
      <CMSPageProvider page={activePage} locale="sv">
        <div
          data-page-id={activePage.id}
          data-template={activePage.template_name}
          className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200"
        >
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-base font-bold tracking-tight">
                  NextBooking{" "}
                  <span className="font-normal text-muted-foreground">
                    Starter
                  </span>
                </span>
              </a>

              {/* Navigation Field via Render Props */}
              <CMSField.Navigation nbr={1}>
                {(links) => (
                  <nav aria-label="Huvudnavigation">
                    <ul className="flex items-center gap-6 text-xs font-semibold">
                      {links.map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.link_url}
                            className="text-muted-foreground hover:text-foreground transition focus:outline-none focus:ring-2 focus:ring-ring rounded-lg px-2 py-1"
                          >
                            {link.link_text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </CMSField.Navigation>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-16">
            <section className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Page #{activePage.id} · Template: {activePage.template_name}
                </span>
              </div>

              {/* Text Field #1 */}
              <CMSField.Text
                nbr={1}
                as="h1"
                className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              />

              {/* Text Field #2 */}
              <CMSField.Text
                nbr={2}
                as="p"
                className="text-base text-muted-foreground leading-relaxed"
              />
            </section>

            {/* Image Field #1 */}
            <section className="overflow-hidden rounded-3xl border border-border shadow-2xl">
              <CMSField.Image
                nbr={1}
                alt="NextBooking Starter Miljö"
                className="w-full h-auto object-cover max-h-[480px]"
              />
            </section>

            {/* Booking & Availability Search */}
            <section id="booking" className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <CMSField.Text
                  nbr={3}
                  as="h2"
                  className="text-2xl font-bold tracking-tight mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Testa vår flexibla sökmotor med stöd för +- datum, sällskap och
                  husdjur.
                </p>
              </div>

              <AvailabilitySearch />
            </section>
          </main>

          {/* Footer */}
          <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>NextBooking CMS Monorepo · apps/demo</span>
              <span>Uppfyller WCAG-kontrast och semantiska standarder</span>
            </div>
          </footer>

          {/* Floating Inline Editor Toolbar */}
          <InlineEditor adminUrl="/admin" />
        </div>
      </CMSPageProvider>
    </CMSQueryProvider>
  );
}
