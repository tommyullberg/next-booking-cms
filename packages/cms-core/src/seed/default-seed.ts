import { SeedConfig } from "./types";

export const defaultSeedConfig: SeedConfig = {
  section: {
    name: "Hem",
    translations: {
      en: "Home",
      de: "Zuhause",
    },
    sort_order: 0,
    is_visible: true,
  },
  page: {
    id: 1001,
    page_title: "Startsida",
    slug: "/",
    template_name: "startpage",
    status: "PUBLISHED",
    meta_title: "Startsida | NextBooking CMS",
    meta_description:
      "Välkommen till NextBooking CMS – modern bokningsmotor och headless CMS för hotell, semesterboenden och villor.",
    fields: [
      {
        nbr: 1,
        field_type: "TEXT",
        type: "plain",
        content: "Framtidens bokningsmotor & headless CMS",
      },
      {
        nbr: 2,
        field_type: "TEXT",
        type: "plain",
        content:
          "Ett professionellt, WCAG-anpassat och blixtsnabbt system byggt för moderna hotell, villor och exklusiva semesterboenden. Integrerar flexibel bokningskalender och sömlös iCal-synk.",
      },
      {
        nbr: 3,
        field_type: "TEXT",
        type: "plain",
        content: "Hitta ditt drömboende med flexibla datum",
      },
      {
        nbr: 1,
        field_type: "IMAGE",
        file_name: "modern-starter-villa.jpg",
        file_url:
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80",
        ratio: "16/9",
        max_width: 1200,
      },
      {
        nbr: 1,
        field_type: "NAVIGATION",
        name: "Huvudmeny",
        type: "HEADER",
        links: [
          { link_url: "/", link_text: "Hem", sort_order: 1 },
          { link_url: "/#booking", link_text: "Boka", sort_order: 2 },
        ],
      },
    ],
  },
};
