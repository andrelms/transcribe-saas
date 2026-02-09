import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import callAIWithFallback from '@/lib/aiFallback';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Recebendo requisição de extração de PDF...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;
    const provider = formData.get('provider') as string || 'google';
    const model = formData.get('model') as string;

    console.log('📊 Dados recebidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      provider,
      model,
      hasApiKey: !!apiKey
    });

    if (!file) {
      console.error('❌ Nenhum arquivo enviado');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('🔍 Extraindo texto do PDF...');
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    console.log('✅ PDF processado:', {
      totalPages: data.numpages,
      textLength: text.length,
      firstChars: text.slice(0, 100) + '...'
    });

    // Use custom API key from request or fall back to environment variable
    const useApiKey = apiKey || process.env.OPENAI_API_KEY;
    const useModel = model || 'gemini-3-flash-preview';

    if (!useApiKey && provider !== 'ollama') {
      console.error('❌ API key não configurada');
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    console.log('🤖 Resumindo documento com AI...');

    // Use AI to summarize and extract key points
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes documents and extracts key points. Respond in JSON format with "summary" and "keyPoints" (array of strings) fields.',
      },
      {
        role: 'user',
        content: `Summarize this document and extract 5-10 key points:\n\n${text.slice(0, 8000)}`,
      },
    ];

    const completion = await callAIWithFallback(
      useApiKey,
      provider,
      useModel,
      messages,
      0.5,
      { type: 'json_object' }
    );

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"summary": "", "keyPoints": []}');

    console.log('✅ Resumo gerado:', {
      summaryLength: result.summary?.length,
      keyPointsCount: result.keyPoints?.length
    });

    return NextResponse.json({
      text: text.slice(0, 5000), // First 5000 chars
      summary: result.summary || 'Resumo não disponível',
      keyPoints: result.keyPoints || [],
    });
  } catch (error: any) {
    console.error('❌ PDF extraction error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: `PDF extraction failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
