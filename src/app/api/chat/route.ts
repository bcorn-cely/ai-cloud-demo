import { NextRequest } from 'next/server';
import { streamText, generateText, tool } from 'ai';
import { z } from 'zod';
import { gateway } from '@ai-sdk/gateway';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { nanoid } from 'nanoid';
import { createTraceContext } from '@/ai/telemetry';
import type { ProviderMode } from '@/types';

// Request schema
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  config: z.object({
    providerMode: z.enum(['gateway', 'custom', 'sandbox']),
    model: z.string(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(32000).default(2048),
    topP: z.number().min(0).max(1).optional(),
    tools: z.boolean().default(false),
    structuredOutput: z.boolean().default(false),
    stream: z.boolean().default(true),
  }),
  gatewayConfig: z.object({
    baseURL: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    byok: z.object({
      provider: z.string(),
      credentials: z.record(z.string(), z.string()),
    }).optional(),
    user: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  customConfig: z.object({
    baseURL: z.string(),
    apiKey: z.string().optional(),
    bearerToken: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }).optional(),
  sandboxConfig: z.object({
    domain: z.string(),
  }).optional(),
});

// Define tools for the chat using AI SDK v6 format
const chatTools = {
  getGatewayModelMetadata: tool({
    description: 'Get metadata for a model from AI Gateway, including pricing and capabilities',
    inputSchema: z.object({
      modelId: z.string().describe('The model ID (e.g., anthropic/claude-sonnet-4)'),
    }),
    execute: async ({ modelId }) => {
      try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/models');
        const data = await response.json();
        const model = data.data?.find((m: { id: string }) => m.id === modelId);
        return model || { error: `Model ${modelId} not found` };
      } catch {
        return { error: 'Failed to fetch model metadata' };
      }
    },
  }),

  getGatewayProviderEndpoints: tool({
    description: 'Get available provider endpoints for a model',
    inputSchema: z.object({
      modelId: z.string().describe('The model ID (e.g., google/gemini-3-pro)'),
    }),
    execute: async ({ modelId }) => {
      try {
        const [creator, ...rest] = modelId.split('/');
        const model = rest.join('/');
        const response = await fetch(
          `https://ai-gateway.vercel.sh/v1/models/${creator}/${model}/endpoints`
        );
        const data = await response.json();
        return data.data?.endpoints || { error: `Endpoints for ${modelId} not found` };
      } catch {
        return { error: 'Failed to fetch provider endpoints' };
      }
    },
  }),

  getCurrentTime: tool({
    description: 'Get the current server time',
    inputSchema: z.object({}),
    execute: async () => {
      return {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    },
  }),
};

/**
 * Check if the required API key is configured for the provider mode
 */
function checkApiKeyConfigured(providerMode: string): { configured: boolean; message?: string } {
  switch (providerMode) {
    case 'gateway':
      if (!process.env.AI_GATEWAY_API_KEY) {
        return {
          configured: false,
          message: 'AI Gateway API key is not configured. Please add AI_GATEWAY_API_KEY to your environment variables. You can get an API key from https://vercel.com/ai-gateway/api-keys',
        };
      }
      return { configured: true };

    case 'custom':
      // Custom provider doesn't necessarily need env vars - config comes from request
      return { configured: true };

    case 'sandbox':
      // Sandbox provider doesn't need API key
      return { configured: true };

    default:
      return { configured: false, message: `Unknown provider mode: ${providerMode}` };
  }
}

export async function POST(request: NextRequest) {
  const traceId = nanoid(12);
  const traceContext = createTraceContext();

  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { messages, config, gatewayConfig, customConfig, sandboxConfig } = parsed.data;

    // Filter out messages with empty content (can happen during streaming)
    const validMessages = messages.filter(m => m.content.trim() !== '');

    if (validMessages.length === 0) {
      return Response.json(
        { error: 'No valid messages provided', traceId },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKeyCheck = checkApiKeyConfigured(config.providerMode);
    if (!apiKeyCheck.configured) {
      return Response.json(
        {
          error: 'API key not configured',
          message: apiKeyCheck.message,
          traceId,
          providerMode: config.providerMode,
        },
        { status: 401 }
      );
    }

    // Get the model based on provider mode
    const model = getModel(config.providerMode, config.model, {
      gatewayConfig,
      customConfig,
      sandboxConfig,
    });

    // Prepare tools if enabled
    const tools = config.tools ? chatTools : undefined;

    if (config.stream) {
      // Streaming response
      const result = streamText({
        model,
        messages: validMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP,
        tools,
      });

      // Create streaming response with metadata headers
      const response = result.toTextStreamResponse();

      // Add trace headers
      const headers = new Headers(response.headers);
      headers.set('X-Trace-Id', traceId);
      headers.set('X-Provider-Mode', config.providerMode);
      headers.set('X-Model', config.model);

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } else {
      // Non-streaming response
      const result = await generateText({
        model,
        messages: validMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP,
        tools,
      });

      // Create trace
      traceContext.complete({
        providerMode: config.providerMode as ProviderMode,
        model: config.model,
        requestPayload: {
          messages: validMessages,
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
        },
        response: {
          text: result.text,
          toolCalls: result.toolCalls,
          finishReason: result.finishReason,
          usage: result.usage ? {
            promptTokens: (result.usage as { inputTokens?: number }).inputTokens ?? 0,
            completionTokens: (result.usage as { outputTokens?: number }).outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          } : undefined,
        },
        config: {
          baseURL: gatewayConfig?.baseURL || customConfig?.baseURL,
          byokApplied: !!gatewayConfig?.byok,
          byokProvider: gatewayConfig?.byok?.provider,
        },
      });

      return Response.json({
        traceId,
        text: result.text,
        toolCalls: result.toolCalls,
        usage: result.usage,
        finishReason: result.finishReason,
        config: {
          providerMode: config.providerMode,
          model: config.model,
          baseURL: gatewayConfig?.baseURL || customConfig?.baseURL,
          byokApplied: !!gatewayConfig?.byok,
        },
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userMessage = errorMessage;

    // Check for common API key issues
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userMessage = 'Authentication failed. Please check your API key is valid and has the necessary permissions.';
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      userMessage = 'Access denied. Your API key may not have access to this model or feature.';
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    }

    return Response.json(
      {
        error: 'Chat request failed',
        message: userMessage,
        traceId,
      },
      { status: 500 }
    );
  }
}

function getModel(
  providerMode: string,
  modelId: string,
  configs: {
    gatewayConfig?: z.infer<typeof ChatRequestSchema>['gatewayConfig'];
    customConfig?: z.infer<typeof ChatRequestSchema>['customConfig'];
    sandboxConfig?: z.infer<typeof ChatRequestSchema>['sandboxConfig'];
  }
) {
  switch (providerMode) {
    case 'gateway':
      return gateway(modelId);

    case 'custom':
      if (!configs.customConfig?.baseURL) {
        throw new Error('Custom provider requires baseURL');
      }
      const customProvider = createOpenAICompatible({
        name: 'custom',
        baseURL: configs.customConfig.baseURL,
        apiKey: configs.customConfig.apiKey,
        headers: configs.customConfig.bearerToken
          ? { Authorization: `Bearer ${configs.customConfig.bearerToken}` }
          : configs.customConfig.headers,
      });
      return customProvider(modelId);

    case 'sandbox':
      if (!configs.sandboxConfig?.domain) {
        throw new Error('Sandbox provider requires domain');
      }
      const sandboxProvider = createOpenAICompatible({
        name: 'sandbox',
        baseURL: `${configs.sandboxConfig.domain}/v1`,
      });
      return sandboxProvider(modelId);

    default:
      throw new Error(`Unknown provider mode: ${providerMode}`);
  }
}
