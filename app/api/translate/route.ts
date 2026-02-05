import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    const useModel = model || 'gpt-4-turbo-preview';

    if (!useApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    // Currently only supports OpenAI, can be extended for other providers
    const openai = new OpenAI({
      apiKey: useApiKey,
    });

    const completion = await openai.chat.completions.create({
      model: useModel,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceLang || 'auto-detect'} to ${targetLang}. Only return the translation, nothing else.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const translation = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
