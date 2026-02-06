import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Default Ollama endpoint
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    console.log('🦙 Checking Ollama at:', ollamaUrl);

    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Ollama not available: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Ollama models found:', data.models?.length || 0);

    return NextResponse.json({
      available: true,
      models: data.models || [],
      endpoint: ollamaUrl,
    });
  } catch (error) {
    console.error('❌ Ollama error:', error);
    return NextResponse.json(
      {
        available: false,
        models: [],
        error: error instanceof Error ? error.message : 'Ollama not available',
      },
      { status: 200 } // Return 200 even on error so UI can handle gracefully
    );
  }
}
