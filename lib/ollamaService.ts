// Ollama Local LLM Service

export async function callOllama(
  model: string,
  messages: any[],
  temperature: number = 0.7,
  jsonMode: boolean = false
): Promise<any> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    console.log('🦙 Calling Ollama:', { model, ollamaUrl });

    // Convert messages to Ollama format
    const prompt = messages.map(m => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'user') return `User: ${m.content}`;
      return m.content;
    }).join('\n\n');

    const requestBody: any = {
      model,
      prompt,
      stream: false,
      options: {
        temperature,
      },
    };

    // Enable JSON mode if requested (supported by some models)
    if (jsonMode) {
      requestBody.format = 'json';
    }

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Ollama response received');

    // Convert to OpenAI-compatible format
    return {
      choices: [
        {
          message: {
            content: data.response || '',
          },
        },
      ],
    };
  } catch (error) {
    console.error('❌ Ollama error:', error);
    throw error;
  }
}

export async function listOllamaModels(): Promise<string[]> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    if (!response.ok) {
      throw new Error('Ollama not available');
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    return [];
  }
}
