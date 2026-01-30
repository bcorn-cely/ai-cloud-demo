import { NextResponse } from 'next/server';
import type { GatewayModelsResponse } from '@/types';

// Cache models for 5 minutes
let cachedModels: GatewayModelsResponse | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedModels && (now - cacheTime) < CACHE_TTL) {
      return NextResponse.json(cachedModels);
    }

    // Always fetch from AI Gateway - model list is public
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`AI Gateway returned ${response.status}: ${response.statusText}`);
    }

    const data: GatewayModelsResponse = await response.json();

    // Update cache
    cachedModels = data;
    cacheTime = now;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching models from AI Gateway:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch models from AI Gateway',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
