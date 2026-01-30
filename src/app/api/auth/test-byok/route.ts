import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'bedrock', 'vertex']),
  apiKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { provider, apiKey } = parsed.data;

    // Simulate BYOK test (in real implementation, would make a test request via AI Gateway with BYOK)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate API key format
    const keyPatterns: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{20,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
      bedrock: /^[A-Z0-9]{16,}$/,
      vertex: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+\.iam\.gserviceaccount\.com$/,
    };

    const isValidFormat = keyPatterns[provider]?.test(apiKey) ?? true;

    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        message: `API key format doesn't match expected ${provider} pattern`,
        details: {
          provider,
          hint: getKeyHint(provider),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `BYOK test for ${provider} completed successfully (simulated)`,
      details: {
        provider,
        keyRedacted: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
        timestamp: new Date().toISOString(),
        note: 'In production, this would make a real test request via AI Gateway with your key',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getKeyHint(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI keys start with "sk-" followed by alphanumeric characters';
    case 'anthropic':
      return 'Anthropic keys start with "sk-ant-" followed by alphanumeric characters';
    case 'bedrock':
      return 'AWS Access Key IDs are 16+ uppercase alphanumeric characters';
    case 'vertex':
      return 'Vertex credentials use a service account email format';
    default:
      return 'Check your provider documentation for key format';
  }
}
