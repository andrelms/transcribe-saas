// Translation Service using OpenAI or other APIs

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return {
        originalText: text,
        translatedText: data.translation,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Language detection failed');
      }

      const data = await response.json();
      return data.language;
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  }
}

export default TranslationService;
