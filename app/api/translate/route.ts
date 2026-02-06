import { NextRequest, NextResponse } from 'next/server';
import callAIWithFallback from '@/lib/aiFallback';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang, apiKey, provider, model } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use custom API key from request or fall back to environment variable
    const useApiKey = apiKey || process.env.OPENAI_API_KEY;
    const useProvider = provider || 'google';
    const useModel = model || 'gemini-3-flash-preview';

    if (!useApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    console.log(`🌐 Translating with provider: ${useProvider}, model: ${useModel}`);

    const messages = [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text from ${sourceLang || 'auto-detect'} to ${targetLang}. Only return the translation, nothing else.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const completion = await callAIWithFallback(
      useApiKey,
      useProvider,
      useModel,
      messages,
      0.3
    );

    const translation = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: `Translation failed: ${error}` },
      { status: 500 }
    );
  }
}
