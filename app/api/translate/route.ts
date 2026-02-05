import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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
