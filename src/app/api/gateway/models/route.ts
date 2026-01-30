import { NextResponse } from 'next/server';
import { getDemoModels, isDemoMode } from '@/ai/demo-provider';
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

    // Use demo models if in demo mode
    if (isDemoMode()) {
      const demoModels = getDemoModels();
      return NextResponse.json(demoModels);
    }

    // Fetch from AI Gateway
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
    console.error('Error fetching models:', error);

    // Fall back to demo models on error
    const demoModels = getDemoModels();
    return NextResponse.json(demoModels, {
      headers: {
        'X-Fallback': 'demo',
      },
    });
  }
}
