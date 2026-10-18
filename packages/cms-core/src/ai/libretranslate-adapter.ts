import { TranslationAdapter, TranslationRequest, TranslationResponse } from "./types";

export class LibreTranslateAdapter implements TranslationAdapter {
  name = "libretranslate";
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl =
      baseUrl ??
      process.env.LIBRETRANSLATE_URL ??
      "https://translate.argosopentech.com";
    this.apiKey = apiKey ?? process.env.LIBRETRANSLATE_API_KEY;
  }

  async translate(req: TranslationRequest): Promise<TranslationResponse> {
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: req.text,
          source: req.sourceLang,
          target: req.targetLang,
          format: "text",
          api_key: this.apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          translatedText: req.text,
          provider: "libretranslate",
          success: false,
          error: `LibreTranslate error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      if (!data?.translatedText) {
        return {
          translatedText: req.text,
          provider: "libretranslate",
          success: false,
          error: "No translatedText in LibreTranslate response.",
        };
      }

      return {
        translatedText: data.translatedText,
        provider: "libretranslate",
        success: true,
      };
    } catch (err: any) {
      return {
        translatedText: req.text,
        provider: "libretranslate",
        success: false,
        error: err?.message || "Unknown error calling LibreTranslate",
      };
    }
  }
}
