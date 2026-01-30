import { NextResponse } from 'next/server';
import { isDemoMode } from '@/ai/demo-provider';

export async function GET() {
  // Demo mode simulation
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      message: 'Demo mode: Gateway auth would be tested here with a real API key',
      details: {
        demoMode: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    // In real mode, we'd make a lightweight test request to AI Gateway
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
