export type MailTemplateType =
  | "ADMIN_NEW_BOOKING_REQUEST"
  | "USER_NEW_BOOKING_REQUEST_COPY"
  | "USER_BOOKING_CONFIRMED";

export interface DefaultMailTemplateDefinition {
  subject: string;
  body: string;
}

export const DEFAULT_MAIL_TEMPLATES_EN: Record<MailTemplateType, DefaultMailTemplateDefinition> = {
  ADMIN_NEW_BOOKING_REQUEST: {
    subject: "New booking request received - {{object_name}}",
    body: `# New booking request received

Guest: {{customer_name}} ({{customer_email}}, {{customer_phone}})
Dates: {{start_date}} to {{end_date}}
Guests: {{guests_count}} adults, {{pets_count}} pets

[Click here to review and manage this booking in Admin]({{deeplink}})`,
  },
  USER_NEW_BOOKING_REQUEST_COPY: {
    subject: "Thank you for your booking request for {{object_name}}",
    body: `# Thank you for your booking request, {{customer_name}}!

We have received your request for {{object_name}} from {{start_date}} to {{end_date}}.

We will get back to you shortly once we have reviewed availability.`,
  },
  USER_BOOKING_CONFIRMED: {
    subject: "Booking Confirmation for {{object_name}}",
    body: `# Your booking is confirmed!

Hello {{customer_name}},

Your reservation for {{object_name}} is now confirmed for {{start_date}} to {{end_date}}.

Total Price: {{price}}

We look forward to welcoming you!`,
  },
};

export const DEFAULT_MAIL_TEMPLATES_SV: Record<MailTemplateType, DefaultMailTemplateDefinition> = {
  ADMIN_NEW_BOOKING_REQUEST: {
    subject: "Ny bokningsförfrågan mottagen - {{object_name}}",
    body: `# Ny bokningsförfrågan mottagen

Gäst: {{customer_name}} ({{customer_email}}, {{customer_phone}})
Datum: {{start_date}} till {{end_date}}
Gäster: {{guests_count}} vuxna, {{pets_count}} husdjur

[Klicka här för att hantera bokningen i Admin]({{deeplink}})`,
  },
  USER_NEW_BOOKING_REQUEST_COPY: {
    subject: "Tack för din bokningsförfrågan för {{object_name}}",
    body: `# Tack för din bokningsförfrågan, {{customer_name}}!

Vi har tagit emot din förfrågan för {{object_name}} mellan {{start_date}} och {{end_date}}.

Vi återkommer till dig inom kort så snart vi har kontrollerat tillgängligheten.`,
  },
  USER_BOOKING_CONFIRMED: {
    subject: "Bokningsbekräftelse för {{object_name}}",
    body: `# Din bokning är bekräftad!

Hej {{customer_name}},

Din bokning av {{object_name}} är nu bekräftad för {{start_date}} till {{end_date}}.

Totalsumma: {{price}}

Varmt välkommen!`,
  },
};

export function getDefaultMailTemplate(
  type: MailTemplateType,
  locale?: string | null
): DefaultMailTemplateDefinition {
  const dict = locale === "sv" ? DEFAULT_MAIL_TEMPLATES_SV : DEFAULT_MAIL_TEMPLATES_EN;
  return dict[type] || DEFAULT_MAIL_TEMPLATES_EN[type];
}

