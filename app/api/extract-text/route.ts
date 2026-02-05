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
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Use OpenAI to summarize and extract key points
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text and extracts key points. Respond in JSON format with "summary" and "keyPoints" (array of strings) fields.',
        },
        {
          role: 'user',
          content: `Summarize this text and extract 5-10 key points:\n\n${text.slice(0, 8000)}`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"summary": "", "keyPoints": []}');

    return NextResponse.json({
      summary: result.summary,
      keyPoints: result.keyPoints,
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { error: 'Text extraction failed' },
      { status: 500 }
    );
  }
}
