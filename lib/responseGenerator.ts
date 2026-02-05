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
