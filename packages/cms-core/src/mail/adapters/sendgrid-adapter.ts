import { EmailAdapter, SendMailOptions, SendMailResult } from "../types";

export class SendGridEmailAdapter implements EmailAdapter {
  name = "sendgrid";
  private apiKey?: string;
  private defaultFrom: string;

  constructor(apiKey?: string, defaultFrom: string = "booking@nextbooking.se") {
    this.apiKey = apiKey ?? process.env.SENDGRID_API_KEY;
    this.defaultFrom = defaultFrom;
  }

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    if (!this.apiKey) {
      return { success: false, error: "SENDGRID_API_KEY is not configured" };
    }

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: options.from || this.defaultFrom },
          subject: options.subject,
          content: [
            {
              type: "text/html",
              value: options.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: `SendGrid error (${response.status}): ${err}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to send email via SendGrid" };
    }
  }
}
