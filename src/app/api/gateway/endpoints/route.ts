import { NextRequest, NextResponse } from 'next/server';
import type { ModelEndpointsResponse } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const modelId = searchParams.get('modelId');

  if (!modelId) {
    return NextResponse.json(
      { error: 'modelId query parameter is required' },
      { status: 400 }
    );
  }

  // Parse modelId into creator/model format
  const parts = modelId.split('/');
  if (parts.length < 2) {
    return NextResponse.json(
      { error: 'modelId must be in creator/model format (e.g., anthropic/claude-sonnet-4)' },
      { status: 400 }
    );
  }

  const creator = parts[0];
  const model = parts.slice(1).join('/');

  try {
    // Always fetch from AI Gateway - endpoints info is public
    const url = `https://ai-gateway.vercel.sh/v1/models/${creator}/${model}/endpoints`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Model ${modelId} not found` },
          { status: 404 }
        );
      }
      throw new Error(`AI Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data: ModelEndpointsResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching endpoints from AI Gateway:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch endpoints from AI Gateway',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
