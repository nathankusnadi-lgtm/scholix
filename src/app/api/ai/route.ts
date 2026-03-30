import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt ?? 'You are a helpful, knowledgeable study assistant.',
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: err.message ?? 'AI request failed' }, { status: 500 });
  }
}
