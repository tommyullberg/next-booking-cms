export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendMailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface EmailAdapter {
  name: string;
  sendMail(options: SendMailOptions): Promise<SendMailResult>;
}

export const MAIL_PLACEHOLDERS = [
  { tag: "{{customer_name}}", label: "Kundens namn", example: "Anna Andersson" },
  { tag: "{{customer_email}}", label: "Kundens e-post", example: "anna@example.com" },
  { tag: "{{customer_phone}}", label: "Kundens telefon", example: "+46 70 123 4567" },
  { tag: "{{object_name}}", label: "Boendets namn", example: "Villa Lullyhill" },
  { tag: "{{start_date}}", label: "Incheckningsdatum", example: "2026-06-15" },
  { tag: "{{end_date}}", label: "Utcheckningsdatum", example: "2026-06-22" },
  { tag: "{{guests_count}}", label: "Antal gäster", example: "4" },
  { tag: "{{pets_count}}", label: "Antal husdjur", example: "1" },
  { tag: "{{price}}", label: "Totalpris (SEK)", example: "18 500 SEK" },
  { tag: "{{deeplink}}", label: "Direktlänk för hantering", example: "https://nextbooking.se/admin/bookings/123" },
  { tag: "{{status}}", label: "Bokningsstatus", example: "APPROVED" },
];
