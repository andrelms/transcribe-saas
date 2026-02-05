// AI Response Generator for beginner-level responses

export interface ResponseSuggestion {
  original: string;
  translation: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export class ResponseGenerator {
  async generateResponse(
    question: string,
    context: string,
    targetLanguage: string,
    nativeLanguage: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<ResponseSuggestion[]> {
    try {
      // Get API config from localStorage
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('aiApiKey') : null;
      const provider = typeof window !== 'undefined' ? localStorage.getItem('aiProvider') : null;
      const model = typeof window !== 'undefined' ? localStorage.getItem('aiModel') : null;

      const response = await fetch('/api/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context,
          targetLanguage,
          nativeLanguage,
          level,
          apiKey,
          provider,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error('Response generation failed');
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Response generation error:', error);
      throw error;
    }
  }

  async simplifyResponse(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await fetch('/api/simplify-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Response simplification failed');
      }

      const data = await response.json();
      return data.simplified;
    } catch (error) {
      console.error('Response simplification error:', error);
      throw error;
    }
  }
}

export default ResponseGenerator;
