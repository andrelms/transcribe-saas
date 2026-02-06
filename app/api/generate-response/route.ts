import { NextRequest, NextResponse } from 'next/server';
import callAIWithFallback from '@/lib/aiFallback';

export async function POST(request: NextRequest) {
  try {
    const { question, context, targetLanguage, nativeLanguage, level, apiKey, provider, model } = await request.json();

    if (!question || !targetLanguage || !nativeLanguage) {
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

    console.log(`🤖 Generating responses with provider: ${useProvider}, model: ${useModel}`);

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

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Question: ${question}`,
      },
    ];

    const completion = await callAIWithFallback(
      useApiKey,
      useProvider,
      useModel,
      messages,
      0.7,
      { type: 'json_object' }
    );

    const responseText = completion.choices[0]?.message?.content || '{"suggestions": []}';
    const parsed = JSON.parse(responseText);
    const suggestions = parsed.suggestions || parsed;

    return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] });
  } catch (error) {
    console.error('Response generation error:', error);
    return NextResponse.json(
      { error: `Response generation failed: ${error}` },
      { status: 500 }
    );
  }
}
