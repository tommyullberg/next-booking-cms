import { GeminiTranslationAdapter } from "./gemini-adapter";
import { LibreTranslateAdapter } from "./libretranslate-adapter";
import { HuggingFaceTranslationAdapter } from "./huggingface-adapter";
import { TranslationRequest, TranslationResponse } from "./types";

export * from "./types";
export * from "./gemini-adapter";
export * from "./libretranslate-adapter";
export * from "./huggingface-adapter";

export async function translateText(
  req: TranslationRequest
): Promise<TranslationResponse> {
  // If target language is the same as source, return original text
  if (req.sourceLang === req.targetLang) {
    return {
      translatedText: req.text,
      provider: "fallback",
      success: true,
    };
  }

  // 1. Primary: Google Gemini API
  const gemini = new GeminiTranslationAdapter();
  const geminiResult = await gemini.translate(req);
  if (geminiResult.success) {
    return geminiResult;
  }

  // 2. First Fallback: LibreTranslate
  const libre = new LibreTranslateAdapter();
  const libreResult = await libre.translate(req);
  if (libreResult.success) {
    return libreResult;
  }

  // 3. Second Fallback: Hugging Face
  const hf = new HuggingFaceTranslationAdapter();
  const hfResult = await hf.translate(req);
  if (hfResult.success) {
    return hfResult;
  }

  // If all failed, return original with aggregated errors
  return {
    translatedText: req.text,
    provider: "fallback",
    success: false,
    error: `All translation providers failed: Gemini (${geminiResult.error}), LibreTranslate (${libreResult.error}), Hugging Face (${hfResult.error})`,
  };
}
