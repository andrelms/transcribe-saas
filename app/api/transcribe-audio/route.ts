import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'pt';
    const apiKey = formData.get('apiKey') as string;
    const provider = formData.get('provider') as string || 'openai';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const useApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!useApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    console.log('🎧 Transcribing audio file:', {
      size: audioFile.size,
      type: audioFile.type,
      language,
      provider
    });

    // Currently only OpenAI Whisper is supported for audio transcription
    // Google Speech-to-Text could be added later
    const openai = new OpenAI({ apiKey: useApiKey });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language.split('-')[0], // Convert 'pt-BR' to 'pt'
      response_format: 'json',
    });

    console.log('✅ Transcription:', transcription.text);

    return NextResponse.json({
      text: transcription.text,
      confidence: 0.9, // Whisper doesn't provide confidence scores
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: `Transcription failed: ${error}` },
      { status: 500 }
    );
  }
}
