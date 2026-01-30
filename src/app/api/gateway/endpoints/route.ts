import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/ai/demo-provider';
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
    // Return demo endpoints if in demo mode
    if (isDemoMode()) {
      return NextResponse.json(getDemoEndpoints(modelId, creator, model));
    }

    // Fetch from AI Gateway
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
    console.error('Error fetching endpoints:', error);

    // Fall back to demo endpoints
    return NextResponse.json(getDemoEndpoints(modelId, creator, model), {
      headers: {
        'X-Fallback': 'demo',
      },
    });
  }
}

function getDemoEndpoints(modelId: string, creator: string, model: string): ModelEndpointsResponse {
  return {
    data: {
      id: modelId,
      name: `Demo ${model}`,
      created: Date.now(),
      description: 'Demo model endpoint for demonstration purposes',
      architecture: {
        modality: 'text→text',
        input_modalities: ['text'],
        output_modalities: ['text'],
      },
      endpoints: [
        {
          name: `${creator} | ${modelId}`,
          model_name: model,
          context_length: 128000,
          max_completion_tokens: 8192,
          provider_name: creator,
          tag: creator,
          supported_parameters: [
            'max_tokens',
            'temperature',
            'top_p',
            'stop',
            'tools',
            'tool_choice',
            'stream',
          ],
          status: 0,
          pricing: {
            prompt: '0.000003',
            completion: '0.000015',
          },
          supports_implicit_caching: false,
        },
        {
          name: `demo-backup | ${modelId}`,
          model_name: model,
          context_length: 128000,
          max_completion_tokens: 4096,
          provider_name: 'demo-backup',
          tag: 'demo-backup',
          supported_parameters: [
            'max_tokens',
            'temperature',
            'stop',
          ],
          status: 0,
          pricing: {
            prompt: '0.000002',
            completion: '0.000010',
          },
          supports_implicit_caching: false,
        },
      ],
    },
  };
}
