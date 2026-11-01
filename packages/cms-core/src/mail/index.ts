import { EmailAdapter } from "./types";
import { ResendEmailAdapter } from "./adapters/resend-adapter";
import { SendGridEmailAdapter } from "./adapters/sendgrid-adapter";
import { ConsoleEmailAdapter } from "./adapters/console-adapter";
import { renderMailTemplate } from "./template-engine";
import { prisma } from "../db";
import { MailTemplateType } from "@prisma/client";
import { getDefaultMailTemplate } from "../constants/mail-templates";

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

  const fallback = getDefaultMailTemplate(templateType, "sv");
  const rawSubject = template?.subject || fallback.subject;
  const rawBody = template?.body || fallback.body;

  const subject = renderMailTemplate(rawSubject, variables);
  const html = renderMailTemplate(rawBody, variables);

  return adapter.sendMail({
    to,
    subject,
    html,
  });
}
