import { EmailAdapter, SendMailOptions, SendMailResult } from "../types";

export class ConsoleEmailAdapter implements EmailAdapter {
  name = "console";

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    console.log("------------------------------------------");
    console.log(`[EMAIL DISPATCH - CONSOLE ADAPTER]`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body (HTML preview):`);
    console.log(options.html);
    console.log("------------------------------------------");

    return {
      success: true,
      id: `dev-${Date.now()}`,
    };
  }
}
