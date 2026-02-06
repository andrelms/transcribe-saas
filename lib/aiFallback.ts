// Model fallback configuration for Google Gemini
export const GEMINI_FALLBACK_ORDER = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
];

export async function callAIWithFallback(
  apiKey: string,
  provider: string,
  initialModel: string,
  messages: any[],
  temperature: number = 0.7,
  responseFormat?: { type: string }
): Promise<any> {
  // For Ollama local models
  if (provider === 'ollama') {
    const { callOllama } = await import('./ollamaService');
    console.log('🦙 Using Ollama local model:', initialModel);
    return await callOllama(initialModel, messages, temperature, responseFormat?.type === 'json_object');
  }

  // For Google provider, try fallback models if initial model fails
  if (provider === 'google') {
    const modelsToTry = [initialModel, ...GEMINI_FALLBACK_ORDER.filter(m => m !== initialModel)];

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        console.log(`🔄 Tentando modelo ${i + 1}/${modelsToTry.length}: ${model}`);

        // Combine system and user messages for Gemini
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const combinedContent = systemMessage
          ? `${systemMessage.content}\n\n${userMessages.map(m => m.content).join('\n')}`
          : userMessages.map(m => m.content).join('\n');

        // Add JSON format instruction if needed
        const finalContent = responseFormat?.type === 'json_object'
          ? `${combinedContent}\n\nIMPORTANT: Respond with valid JSON only, no other text.`
          : combinedContent;

        // Try with Google AI SDK
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: finalContent }]
            }],
            generationConfig: {
              temperature,
              responseMimeType: responseFormat?.type === 'json_object' ? 'application/json' : 'text/plain'
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ Erro HTTP ${response.status}:`, errorData);

          if (i < modelsToTry.length - 1) {
            console.log(`⚠️ Modelo ${model} falhou, tentando próximo...`);
            continue;
          }
          throw new Error(`All models failed. Last error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log(`✅ Sucesso com modelo: ${model}`);

        return {
          choices: [{
            message: {
              content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            }
          }]
        };
      } catch (error) {
        console.error(`❌ Erro com modelo ${model}:`, error);
        if (i < modelsToTry.length - 1) {
          console.log(`🔄 Tentando próximo modelo...`);
          continue;
        }
        throw error;
      }
    }
  }

  // For OpenAI and Anthropic, use standard approach
  const OpenAI = require('openai').default;
  const client = new OpenAI({ apiKey });

  const params: any = {
    model: initialModel,
    messages,
    temperature,
  };

  if (responseFormat) {
    params.response_format = responseFormat;
  }

  return await client.chat.completions.create(params);
}

export default callAIWithFallback;
