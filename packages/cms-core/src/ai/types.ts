export interface TranslationRequest {
  text: string;
  sourceLang: string; // e.g. "sv"
  targetLang: string; // e.g. "en" | "de"
}

export interface TranslationResponse {
  translatedText: string;
  provider: "gemini" | "libretranslate" | "huggingface" | "fallback";
  success: boolean;
  error?: string;
}

export interface TranslationAdapter {
  name: string;
  translate(req: TranslationRequest): Promise<TranslationResponse>;
}
