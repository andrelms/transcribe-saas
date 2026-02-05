import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, context, targetLanguage, nativeLanguage, level } = await request.json();

    if (!question || !targetLanguage || !nativeLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const levelInstructions = {
      beginner: 'Use very simple vocabulary and short sentences (A1-A2 level). Maximum 2 sentences.',
      intermediate: 'Use moderate vocabulary and clear sentences (B1-B2 level). Maximum 3 sentences.',
      advanced: 'Use natural, fluent language (C1-C2 level). Maximum 4 sentences.',
    };

    const systemPrompt = `You are a language learning assistant helping someone practice ${targetLanguage}.
Generate 3 appropriate responses to the question in ${targetLanguage}.
${levelInstructions[level as keyof typeof levelInstructions] || levelInstructions.beginner}

${context ? `Use this context to inform your responses:\n${context}\n` : ''}

For each response, provide:
1. The response in ${targetLanguage}
2. The translation in ${nativeLanguage}

Format your response as a JSON array with this structure:
[
  {
    "original": "response in ${targetLanguage}",
    "translation": "tradução em ${nativeLanguage}",
    "level": "${level}"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Question: ${question}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{"suggestions": []}';
    const parsed = JSON.parse(responseText);
    const suggestions = parsed.suggestions || parsed;

    return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] });
  } catch (error) {
    console.error('Response generation error:', error);
    return NextResponse.json(
      { error: 'Response generation failed' },
      { status: 500 }
    );
  }
}
