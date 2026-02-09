// Context Extractor for PDFs, Canva links, LinkedIn, etc.

export interface ContextSource {
  type: 'pdf' | 'url' | 'text';
  url?: string;
  content?: string;
  name: string;
}

export interface ExtractedContext {
  text: string;
  summary: string;
  keyPoints: string[];
  source: ContextSource;
}

export class ContextExtractor {
  async extractFromPDF(file: File): Promise<ExtractedContext> {
    try {
      console.log('📤 Enviando PDF para processamento:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      // Get API config from localStorage
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('aiApiKey') : null;
      const provider = typeof window !== 'undefined' ? localStorage.getItem('aiProvider') : null;
      const model = typeof window !== 'undefined' ? localStorage.getItem('aiModel') : null;

      console.log('🔑 Configuração:', { hasApiKey: !!apiKey, provider, model });

      if (apiKey) formData.append('apiKey', apiKey);
      if (provider) formData.append('provider', provider);
      if (model) formData.append('model', model);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Erro na API:', errorData);
        throw new Error(errorData.error || 'PDF extraction failed');
      }

      const data = await response.json();
      console.log('✅ PDF processado com sucesso:', {
        textLength: data.text?.length,
        summaryLength: data.summary?.length,
        keyPointsCount: data.keyPoints?.length
      });

      return {
        text: data.text,
        summary: data.summary,
        keyPoints: data.keyPoints,
        source: {
          type: 'pdf',
          name: file.name,
        },
      };
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw error;
    }
  }

  async extractFromURL(url: string): Promise<ExtractedContext> {
    try {
      // Get API config from localStorage
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('aiApiKey') : null;
      const model = typeof window !== 'undefined' ? localStorage.getItem('aiModel') : null;

      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, apiKey, model }),
      });

      if (!response.ok) {
        throw new Error('URL extraction failed');
      }

      const data = await response.json();
      return {
        text: data.text,
        summary: data.summary,
        keyPoints: data.keyPoints,
        source: {
          type: 'url',
          url,
          name: this.getNameFromURL(url),
        },
      };
    } catch (error) {
      console.error('URL extraction error:', error);
      throw error;
    }
  }

  async extractFromText(text: string, name: string): Promise<ExtractedContext> {
    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Text extraction failed');
      }

      const data = await response.json();
      return {
        text: text,
        summary: data.summary,
        keyPoints: data.keyPoints,
        source: {
          type: 'text',
          content: text,
          name,
        },
      };
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  private getNameFromURL(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('canva.com')) {
        return 'Apresentação Canva';
      } else if (urlObj.hostname.includes('linkedin.com')) {
        return 'LinkedIn';
      } else {
        return urlObj.hostname;
      }
    } catch {
      return 'Link';
    }
  }

  async combineContexts(contexts: ExtractedContext[]): Promise<string> {
    const combined = contexts.map((ctx, idx) => {
      return `[Fonte ${idx + 1}: ${ctx.source.name}]\n${ctx.summary}\n\nPontos-chave:\n${ctx.keyPoints.map(p => `- ${p}`).join('\n')}`;
    }).join('\n\n---\n\n');

    return combined;
  }
}

export default ContextExtractor;
