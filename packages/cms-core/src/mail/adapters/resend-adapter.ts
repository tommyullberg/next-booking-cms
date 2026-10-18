import { EmailAdapter, SendMailOptions, SendMailResult } from "../types";

export class ResendEmailAdapter implements EmailAdapter {
  name = "resend";
  private apiKey?: string;
  private defaultFrom: string;

  constructor(apiKey?: string, defaultFrom: string = "NextBooking <booking@nextbooking.se>") {
    this.apiKey = apiKey ?? process.env.RESEND_API_KEY;
    this.defaultFrom = defaultFrom;
  }

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    if (!this.apiKey) {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from || this.defaultFrom,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: `Resend error (${response.status}): ${err}` };
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to send email via Resend" };
    }
  }
}
