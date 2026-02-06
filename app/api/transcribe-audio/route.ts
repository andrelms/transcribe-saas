import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'pt';
    const apiKey = formData.get('apiKey') as string;
    const provider = formData.get('provider') as string || 'openai';

    console.log('🎧 Received transcription request:', {
      hasAudio: !!audioFile,
      audioSize: audioFile?.size,
      audioType: audioFile?.type,
      language,
      provider,
      hasApiKey: !!apiKey
    });

    if (!audioFile) {
      console.error('❌ No audio file in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const useApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!useApiKey) {
      console.error('❌ No API key available');
      return NextResponse.json(
        { error: 'API key not configured. Please configure in settings.' },
        { status: 401 }
      );
    }

    console.log('🔑 Using API key (first 10 chars):', useApiKey.substring(0, 10) + '...');

    // Currently only OpenAI Whisper is supported for audio transcription
    // Google Speech-to-Text could be added later
    try {
      const openai = new OpenAI({ apiKey: useApiKey });

      console.log('🌐 Calling Whisper API...');
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language.split('-')[0], // Convert 'pt-BR' to 'pt'
        response_format: 'json',
      });

      console.log('✅ Whisper response:', transcription.text);

      return NextResponse.json({
        text: transcription.text,
        confidence: 0.9, // Whisper doesn't provide confidence scores
      });
    } catch (apiError: any) {
      console.error('❌ OpenAI API Error:', {
        message: apiError.message,
        type: apiError.type,
        code: apiError.code,
        status: apiError.status
      });
      throw apiError;
    }
  } catch (error: any) {
    console.error('❌ Transcription error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `Transcription failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
