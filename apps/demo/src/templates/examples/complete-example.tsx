"use client";

/**
 * COMPLETE TEMPLATE EXAMPLE (Hidden developer reference — not selectable in Admin)
 *
 * Demonstrates every available component and CMSField primitive in @next-booking/cms-core:
 * 1. CMSField.Text (plain & formatted headings, paragraphs, rich blocks)
 * 2. CMSField.Image (with ratio & maxWidth constraints)
 * 3. CMSField.Gallery (multi-image gallery with drag-and-drop sorting, localized captions & Fancybox lightbox)
 * 4. CMSField.Navigation (render-prop navigation links)
 * 5. BookingCalendar (interactive unit calendar with seasonal pricing & iCal sync)
 * 6. AvailabilitySearch (flexible +- days search engine with guest & pet filters)
 */

import React from "react";
import {
  CMSField,
  BookingCalendar,
  AvailabilitySearch,
  CMSPageData,
} from "@next-booking/cms-core";
import { DemoSiteLayout } from "../../components/site-layout";

export function CompleteExampleTemplate({ page }: { page: CMSPageData }) {
  return (
    <DemoSiteLayout page={page}>
      {/* 1. Text Fields (Headings & Lead Paragraphs) */}
      <section className="space-y-4 max-w-3xl mx-auto text-center">
        <CMSField.Text
          nbr={1}
          as="h1"
          className="text-4xl font-extrabold tracking-tight"
        />
        <CMSField.Text
          nbr={2}
          as="p"
          className="text-base text-muted-foreground leading-relaxed"
        />
      </section>

      {/* 2. Image Field */}
      <section className="overflow-hidden rounded-3xl border border-border shadow-xl">
        <CMSField.Image
          nbr={1}
          alt="Complete Example Hero"
          className="w-full h-auto object-cover max-h-[480px]"
        />
      </section>

      {/* 3. Gallery Field (Fancybox Lightbox + Drag & Drop Sorting + Localized Captions) */}
      <section className="space-y-4">
        <CMSField.Gallery nbr={1} />
      </section>

      {/* 4. Secondary Navigation Field (Render Props) */}
      <section className="rounded-2xl border border-border p-6">
        <CMSField.Navigation nbr={2}>
          {(links) => (
            <nav aria-label="Exempelnavigation">
              <ul className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.link_url}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition"
                    >
                      {link.link_text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </CMSField.Navigation>
      </section>

      {/* 4. Interactive Booking Calendar */}
      <section className="space-y-4">
        <CMSField.Text nbr={3} as="h2" className="text-2xl font-bold" />
        <BookingCalendar
          objectId="example-object-1"
          objectName="Exempelboende"
          basePrice={2500}
        />
      </section>

      {/* 5. Flexible Availability Search */}
      <section className="space-y-4">
        <CMSField.Text nbr={4} as="h2" className="text-2xl font-bold" />
        <AvailabilitySearch />
      </section>
    </DemoSiteLayout>
  );
}
