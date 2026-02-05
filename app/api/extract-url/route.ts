import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header').remove();

    // Extract text content
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    // Use OpenAI to summarize and extract key points
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes web content and extracts key points. Respond in JSON format with "summary" and "keyPoints" (array of strings) fields.',
        },
        {
          role: 'user',
          content: `Summarize this content and extract 5-10 key points:\n\n${text}`,
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
    console.error('URL extraction error:', error);
    return NextResponse.json(
      { error: 'URL extraction failed' },
      { status: 500 }
    );
  }
}
