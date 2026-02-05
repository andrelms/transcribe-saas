import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;
    const model = formData.get('model') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    // Use custom API key from request or fall back to environment variable
    const useApiKey = apiKey || process.env.OPENAI_API_KEY;
    const useModel = model || 'gpt-4-turbo-preview';

    if (!useApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    const openai = new OpenAI({
      apiKey: useApiKey,
    });

    // Use OpenAI to summarize and extract key points
    const completion = await openai.chat.completions.create({
      model: useModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes documents and extracts key points. Respond in JSON format with "summary" and "keyPoints" (array of strings) fields.',
        },
        {
          role: 'user',
          content: `Summarize this document and extract 5-10 key points:\n\n${text.slice(0, 8000)}`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"summary": "", "keyPoints": []}');

    return NextResponse.json({
      text: text.slice(0, 5000),
      summary: result.summary,
      keyPoints: result.keyPoints,
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { error: 'PDF extraction failed' },
      { status: 500 }
    );
  }
}
