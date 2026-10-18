import { TranslationAdapter, TranslationRequest, TranslationResponse } from "./types";

export class HuggingFaceTranslationAdapter implements TranslationAdapter {
  name = "huggingface";
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.HUGGINGFACE_API_KEY;
  }

  async translate(req: TranslationRequest): Promise<TranslationResponse> {
    try {
      // Use Helsinki-NLP translation models on HuggingFace Inference API
      const model = `Helsinki-NLP/opus-mt-${req.sourceLang}-${req.targetLang}`;
      const url = `https://api-inference.huggingface.co/models/${model}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: req.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          translatedText: req.text,
          provider: "huggingface",
          success: false,
          error: `Hugging Face error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      const translation =
        Array.isArray(data) && data[0]?.translation_text
          ? data[0].translation_text
          : null;

      if (!translation) {
        return {
          translatedText: req.text,
          provider: "huggingface",
          success: false,
          error: "No translation text returned from Hugging Face model.",
        };
      }

      return {
        translatedText: translation,
        provider: "huggingface",
        success: true,
      };
    } catch (err: any) {
      return {
        translatedText: req.text,
        provider: "huggingface",
        success: false,
        error: err?.message || "Unknown error calling Hugging Face",
      };
    }
  }
}
