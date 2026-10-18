import { TranslationAdapter, TranslationRequest, TranslationResponse } from "./types";

export class GeminiTranslationAdapter implements TranslationAdapter {
  name = "gemini";
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY;
  }

  async translate(req: TranslationRequest): Promise<TranslationResponse> {
    if (!this.apiKey) {
      return {
        translatedText: req.text,
        provider: "gemini",
        success: false,
        error: "GEMINI_API_KEY is not configured.",
      };
    }

    const langNames: Record<string, string> = {
      sv: "Swedish",
      en: "English",
      de: "German",
    };

    const sourceName = langNames[req.sourceLang] || req.sourceLang;
    const targetName = langNames[req.targetLang] || req.targetLang;

    const prompt = `You are a professional translator for a luxury hotel, villa rental, and booking website.
Translate the following text accurately and naturally from ${sourceName} into ${targetName}.
Maintain tone, punctuation, and line breaks.
Return ONLY the direct translation, with absolutely no preamble, quotes, markdown formatting, or explanations.

Text to translate:
${req.text}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          translatedText: req.text,
          provider: "gemini",
          success: false,
          error: `Gemini API error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      const candidateText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!candidateText) {
        return {
          translatedText: req.text,
          provider: "gemini",
          success: false,
          error: "Empty translation response received from Gemini.",
        };
      }

      return {
        translatedText: candidateText,
        provider: "gemini",
        success: true,
      };
    } catch (err: any) {
      return {
        translatedText: req.text,
        provider: "gemini",
        success: false,
        error: err?.message || "Unknown error calling Gemini API",
      };
    }
  }
}
