import { NextResponse } from 'next/server';

export async function GET() {
  // Check if API key is configured
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json({
      success: false,
      message: 'AI Gateway API key not configured',
      details: {
        configured: false,
        hint: 'Add AI_GATEWAY_API_KEY to your .env.local file. Get your key at https://vercel.com/ai-gateway/api-keys',
        timestamp: new Date().toISOString(),
      },
    }, { status: 401 });
  }

  try {
    // Make a lightweight test request to AI Gateway
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Gateway returned ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Gateway auth successful',
      details: {
        modelsCount: data.data?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error: String(error),
        timestamp: new Date().toISOString(),
      },
    });
  }
}
