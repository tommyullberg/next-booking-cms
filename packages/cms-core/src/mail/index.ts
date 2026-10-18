import { EmailAdapter } from "./types";
import { ResendEmailAdapter } from "./adapters/resend-adapter";
import { SendGridEmailAdapter } from "./adapters/sendgrid-adapter";
import { ConsoleEmailAdapter } from "./adapters/console-adapter";
import { renderMailTemplate } from "./template-engine";
import { prisma } from "../db";
import { MailTemplateType } from "@prisma/client";

export * from "./types";
export * from "./template-engine";
export * from "./adapters/resend-adapter";
export * from "./adapters/sendgrid-adapter";
export * from "./adapters/console-adapter";

let cachedEmailAdapter: EmailAdapter | null = null;

export function getEmailAdapter(): EmailAdapter {
  if (cachedEmailAdapter) return cachedEmailAdapter;

  const provider = process.env.EMAIL_PROVIDER || "console";

  if (provider === "resend") {
    cachedEmailAdapter = new ResendEmailAdapter();
  } else if (provider === "sendgrid") {
    cachedEmailAdapter = new SendGridEmailAdapter();
  } else {
    cachedEmailAdapter = new ConsoleEmailAdapter();
  }

  return cachedEmailAdapter;
}

export async function getMailTemplatesAction() {
  return prisma.mailTemplate.findMany({
    orderBy: { template_type: "asc" },
  });
}

export async function saveMailTemplateAction(
  templateType: MailTemplateType,
  subject: string,
  body: string
) {
  return prisma.mailTemplate.upsert({
    where: { template_type: templateType },
    update: { subject, body },
    create: { template_type: templateType, subject, body },
  });
}

export async function sendBookingEmail(
  templateType: MailTemplateType,
  to: string,
  variables: Record<string, string | number | undefined | null>
) {
  const template = await prisma.mailTemplate.findUnique({
    where: { template_type: templateType },
  });

  const adapter = getEmailAdapter();

  const defaultSubjects: Record<MailTemplateType, string> = {
    ADMIN_NEW_BOOKING_REQUEST: "Ny bokningsförfrågan mottagen - {{object_name}}",
    USER_NEW_BOOKING_REQUEST_COPY: "Tack för din bokningsförfrågan för {{object_name}}",
    USER_BOOKING_CONFIRMED: "Bokningsbekräftelse för {{object_name}}",
  };

  const defaultBodies: Record<MailTemplateType, string> = {
    ADMIN_NEW_BOOKING_REQUEST:
      "<h1>Ny bokningsförfrågan</h1><p>Gäst: {{customer_name}} ({{customer_email}}, {{customer_phone}})</p><p>Period: {{start_date}} till {{end_date}}</p><p>Gäster: {{guests_count}}, Husdjur: {{pets_count}}</p><p><a href='{{deeplink}}'>Klicka här för att hantera bokningen</a></p>",
    USER_NEW_BOOKING_REQUEST_COPY:
      "<h1>Tack för din förfrågan, {{customer_name}}!</h1><p>Vi har tagit emot din förfrågan för {{object_name}} mellan {{start_date}} och {{end_date}}.</p><p>Vi återkommer inom kort med bekräftelse.</p>",
    USER_BOOKING_CONFIRMED:
      "<h1>Din bokning är bekräftad!</h1><p>Hej {{customer_name}}, din bokning av {{object_name}} mellan {{start_date}} och {{end_date}} är nu godkänd.</p><p>Totalpris: {{price}}.</p><p>Varmt välkommen!</p>",
  };

  const rawSubject = template?.subject || defaultSubjects[templateType];
  const rawBody = template?.body || defaultBodies[templateType];

  const subject = renderMailTemplate(rawSubject, variables);
  const html = renderMailTemplate(rawBody, variables);

  return adapter.sendMail({
    to,
    subject,
    html,
  });
}
