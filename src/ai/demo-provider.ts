/**
 * Demo/Mock Provider
 * Provides realistic responses when no real API keys are configured
 */

export interface DemoMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DemoResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  model: string;
  latencyMs: number;
}

// Sample responses for demo mode
const DEMO_RESPONSES: Record<string, string> = {
  default: `Hello! I'm running in demo mode because no API keys are configured. This is a simulated response that demonstrates the platform's capabilities.

Here's what you can explore:
- **Model Discovery**: Browse AI Gateway's model catalog
- **BYOK Configuration**: Set up your own API keys
- **Proxy Settings**: Configure corporate proxy/VPC options
- **Telemetry**: View request/response traces

To use real models, add your AI_GATEWAY_API_KEY to the environment variables.`,

  tools: `I can use the following tools:
1. **getGatewayModelMetadata** - Fetch model details from AI Gateway
2. **getGatewayProviderEndpoints** - Get provider endpoints for a model
3. **startSandboxMockModel** - Start a mock model server in Vercel Sandbox

Would you like me to demonstrate one of these tools?`,

  structured: `{
  "analysis": {
    "risks": [
      {
        "severity": "medium",
        "category": "security",
        "description": "API keys stored in environment variables without rotation policy",
        "recommendation": "Implement automated key rotation using Vercel's secret management"
      },
      {
        "severity": "low",
        "category": "performance",
        "description": "No caching layer for AI Gateway responses",
        "recommendation": "Consider implementing response caching for deterministic queries"
      }
    ],
    "confidence": 0.85,
    "timestamp": "${new Date().toISOString()}"
  }
}`,

  code: `Here's an example of using the AI SDK with Vercel AI Gateway:

\`\`\`typescript
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text, usage } = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Explain quantum computing in simple terms',
  providerOptions: {
    gateway: {
      user: 'user-123',
      tags: ['demo', 'quantum'],
    },
  },
});

console.log(text);
console.log(\`Tokens: \${usage.totalTokens}\`);
\`\`\``,
};

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Determine response type from messages
 */
function getResponseType(messages: DemoMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.content.toLowerCase() || '';

  if (content.includes('tool') || content.includes('function')) return 'tools';
  if (content.includes('json') || content.includes('structured') || content.includes('risk')) return 'structured';
  if (content.includes('code') || content.includes('example') || content.includes('sdk')) return 'code';
  return 'default';
}

/**
 * Generate a demo response
 */
export async function generateDemoResponse(
  messages: DemoMessage[],
  options: {
    model?: string;
    simulateLatency?: boolean;
    latencyMs?: number;
  } = {}
): Promise<DemoResponse> {
  const { model = 'demo/mock-model', simulateLatency = true, latencyMs = 500 } = options;

  // Simulate network latency
  if (simulateLatency) {
    const jitter = Math.random() * 200 - 100; // ±100ms jitter
    await new Promise(resolve => setTimeout(resolve, latencyMs + jitter));
  }

  const responseType = getResponseType(messages);
  const text = DEMO_RESPONSES[responseType];

  // Calculate usage
  const promptTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const completionTokens = estimateTokens(text);

  return {
    text,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    finishReason: 'stop',
    model,
    latencyMs: latencyMs + (simulateLatency ? Math.random() * 200 - 100 : 0),
  };
}

/**
 * Stream demo response (simulated)
 */
export async function* streamDemoResponse(
  messages: DemoMessage[],
  options: {
    model?: string;
    chunkSize?: number;
    delayMs?: number;
  } = {}
): AsyncGenerator<{ type: 'text' | 'usage' | 'done'; content?: string; usage?: DemoResponse['usage'] }> {
  const { model = 'demo/mock-model', chunkSize = 10, delayMs = 30 } = options;

  const response = await generateDemoResponse(messages, { model, simulateLatency: false });
  const words = response.text.split(' ');

  // Stream words in chunks
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
    yield { type: 'text', content: chunk };
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Send usage
  yield { type: 'usage', usage: response.usage };

  // Send done
  yield { type: 'done' };
}

/**
 * Check if demo mode should be enabled
 */
export function isDemoMode(): boolean {
  // Demo mode if explicitly enabled or no API key configured
  if (process.env.DEMO_MODE === 'true') return true;
  if (process.env.DEMO_MODE === 'false') return false;
  return !process.env.AI_GATEWAY_API_KEY;
}

/**
 * Get demo model list (simulated /v1/models response)
 */
export function getDemoModels() {
  return {
    object: 'list',
    data: [
      {
        id: 'demo/mock-gpt-4',
        object: 'model',
        created: Date.now(),
        owned_by: 'demo',
        name: 'Mock GPT-4 (Demo)',
        description: 'A simulated GPT-4 model for demonstration purposes',
        context_window: 128000,
        max_tokens: 8192,
        type: 'language',
        tags: ['demo', 'tool-use', 'vision'],
        pricing: {
          input: '0.00001',
          output: '0.00003',
        },
      },
      {
        id: 'demo/mock-claude',
        object: 'model',
        created: Date.now(),
        owned_by: 'demo',
        name: 'Mock Claude (Demo)',
        description: 'A simulated Claude model for demonstration purposes',
        context_window: 200000,
        max_tokens: 4096,
        type: 'language',
        tags: ['demo', 'tool-use', 'reasoning'],
        pricing: {
          input: '0.000003',
          output: '0.000015',
        },
      },
      {
        id: 'demo/mock-embedding',
        object: 'model',
        created: Date.now(),
        owned_by: 'demo',
        name: 'Mock Embedding (Demo)',
        description: 'A simulated embedding model for demonstration purposes',
        context_window: 8191,
        max_tokens: 0,
        type: 'embedding',
        tags: ['demo'],
        pricing: {
          input: '0.0000001',
        },
      },
    ],
  };
}
