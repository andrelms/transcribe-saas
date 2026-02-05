import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Missing text field' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., "en", "pt", "es", "fr").',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
    });

    const language = completion.choices[0]?.message?.content?.trim() || 'en';

    return NextResponse.json({ language });
  } catch (error) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      { error: 'Language detection failed' },
      { status: 500 }
    );
  }
}
