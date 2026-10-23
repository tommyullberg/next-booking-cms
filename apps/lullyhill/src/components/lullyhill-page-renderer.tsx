"use client";

import React from "react";
import {
  CMSPageProvider,
  CMSField,
  InlineEditor,
  CMSQueryProvider,
  BookingCalendar,
  AvailabilitySearch,
  CMSPageData,
} from "@next-booking/cms-core";
import { Compass, Waves, Sparkles } from "lucide-react";

export const fallbackLullyhillHomePage: CMSPageData = {
  id: 1001,
  template_name: "startpage",
  page_title: "Villa Lullyhill – Gotlandic Luxury",
  slug: "/",
  status: "PUBLISHED",
  page_fields: [
    {
      id: "lh-f-1",
      page_id: 1001,
      nbr: 1,
      field_type: "TEXT",
      content: "Villa Lullyhill",
      type: "plain",
    },
    {
      id: "lh-f-2",
      page_id: 1001,
      nbr: 2,
      field_type: "TEXT",
      content:
        "Gotlandic Luxury vid Toftas kust. Minimalistisk arkitektur i harmoni med gotländsk kalksten, vindpinad tallskog och öppet hav.",
      type: "plain",
    },
    {
      id: "lh-f-3",
      page_id: 1001,
      nbr: 3,
      field_type: "TEXT",
      content: "Välj din vistelse i kalendern nedan",
      type: "plain",
    },
    {
      id: "lh-img-1",
      page_id: 1001,
      nbr: 1,
      field_type: "IMAGE",
      image: {
        id: "lh-img-1",
        file_name: "villa-lullyhill-exterior.jpg",
        file_url:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      },
      ratio: "16/9",
      max_width: 1200,
    },
    {
      id: "lh-nav-1",
      page_id: 1001,
      nbr: 1,
      field_type: "NAVIGATION",
      navigation: {
        id: "nav-lullyhill",
        name: "Lullyhill Meny",
        type: "HEADER",
        navigation_links: [
          { id: "lh1", link_url: "/", link_text: "Vistelsen", sort_order: 1 },
          { id: "lh2", link_url: "/#calendar", link_text: "Boka", sort_order: 2 },
          {
            id: "lh3",
            link_url: "/#search",
            link_text: "Flexibel sökning",
            sort_order: 3,
          },
        ],
      },
    },
  ],
};

export function LullyhillPageRenderer({ page }: { page?: CMSPageData | null }) {
  const activePage = page || fallbackLullyhillHomePage;

  return (
    <CMSQueryProvider>
      <CMSPageProvider page={activePage} locale="sv">
        <div
          data-page-id={activePage.id}
          data-template={activePage.template_name}
          className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900"
        >
          {/* Header */}
          <header className="border-b border-slate-200/80 bg-slate-50/90 backdrop-blur sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-700 text-white flex items-center justify-center font-serif text-lg shadow-md shadow-sky-900/10">
                  L
                </div>
                <div>
                  <span className="text-base font-semibold tracking-wider uppercase font-serif text-slate-900 block">
                    Villa Lullyhill
                  </span>
                  <span className="text-[10px] tracking-widest uppercase text-slate-500 block">
                    Gotlandic Luxury
                  </span>
                </div>
              </a>

              {/* Render Props Navigation */}
              <CMSField.Navigation nbr={1}>
                {(links) => (
                  <nav aria-label="Meny">
                    <ul className="flex items-center gap-6 text-xs font-medium tracking-wide">
                      {links.map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.link_url}
                            className="text-slate-600 hover:text-sky-700 transition"
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

          {/* Main Content */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-16">
            {/* Top CMS Content */}
            <section className="text-center space-y-4 max-w-2xl mx-auto pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-medium tracking-wider uppercase">
                <Waves className="w-3.5 h-3.5 text-sky-700" />
                <span>Tofta · Gotland</span>
              </div>

              <CMSField.Text
                nbr={1}
                as="h1"
                className="text-4xl sm:text-5xl font-serif tracking-tight text-slate-900 leading-tight"
              />

              <CMSField.Text
                nbr={2}
                as="p"
                className="text-sm text-slate-600 leading-relaxed font-light"
              />
            </section>

            {/* Featured Hero Image */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-white p-2">
              <CMSField.Image
                nbr={1}
                alt="Villa Lullyhill exteriör"
                className="w-full h-auto object-cover rounded-2xl max-h-[520px]"
              />
            </section>

            {/* Highlights Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 w-fit mb-3">
                  <Compass className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  Kalksten & Natur
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Byggt i gedigna gotländska material med kalkstensgolv och
                  stora fönsterpartier mot naturen.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 w-fit mb-3">
                  <Waves className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  Havsnära ro
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Endast ett stenkast från Toftas sanddyner och havets brus.
                  Privat trädgård och stor terrass.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 w-fit mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  Full service
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bäddade sängar vid ankomst, bastu, fiberanslutning och
                  möjlighet till flexibel incheckning.
                </p>
              </div>
            </section>

            {/* Middle: TanStack Query Booking Calendar */}
            <section id="calendar" className="space-y-4">
              <div className="text-center max-w-xl mx-auto">
                <CMSField.Text
                  nbr={3}
                  as="h2"
                  className="text-2xl font-serif text-slate-900 mb-1"
                />
                <p className="text-xs text-slate-500">
                  Bokningskalendern uppdateras i realtid och synkroniseras
                  automatiskt med externa kanaler.
                </p>
              </div>

              <BookingCalendar
                objectId="lullyhill-villa"
                objectName="Villa Lullyhill"
                basePrice={3200}
              />
            </section>

            {/* Flexible Date Search */}
            <section id="search" className="space-y-4 pt-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-2xl font-serif text-slate-900 mb-1">
                  Flexibel tillgänglighetssökning
                </h2>
                <p className="text-xs text-slate-500">
                  Sök lediga datum med flexibilitet upp till +- 3 dagar för att
                  hitta bästa möjliga vistelse.
                </p>
              </div>

              <AvailabilitySearch />
            </section>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-10 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-slate-900">
                  Villa Lullyhill
                </span>
                <span>· Gotlandic Luxury</span>
              </div>
              <div>Drivs av NextBooking CMS Engine</div>
            </div>
          </footer>

          {/* Floating Inline Editor Toolbar */}
          <InlineEditor adminUrl="/admin" />
        </div>
      </CMSPageProvider>
    </CMSQueryProvider>
  );
}
