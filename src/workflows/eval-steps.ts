/**
 * Eval Workflow Steps
 * Step functions for the evaluation workflow
 */
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export interface EvalResult {
  promptId: number;
  prompt: string;
  response: string;
  latencyMs: number;
  tokens: number;
}

export interface EvalSummary {
  totalPrompts: number;
  avgLatencyMs: number;
  avgTokens: number;
  successRate: number;
}

/**
 * Fetch model metadata from gateway
 */
export async function fetchModelMetadata(model: string): Promise<{ name: string; provider: string }> {
  "use step";

  const [provider, ...rest] = model.split('/');
  return {
    name: rest.join('/'),
    provider,
  };
}

/**
 * Run a single test prompt
 */
export async function runTestPrompt(
  model: string,
  prompt: string,
  promptId: number
): Promise<EvalResult> {
  "use step";

  const start = Date.now();

  try {
    const result = await generateText({
      model: gateway(model),
      prompt,
      maxOutputTokens: 256,
    });

    return {
      promptId,
      prompt,
      response: result.text,
      latencyMs: Date.now() - start,
      tokens: result.usage?.totalTokens ?? 0,
    };
  } catch (error) {
    return {
      promptId,
      prompt,
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latencyMs: Date.now() - start,
      tokens: 0,
    };
  }
}

/**
 * Sleep for demonstration of durable waiting
 */
export async function durableSleep(ms: number): Promise<void> {
  "use step";

  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate evaluation report
 */
export async function generateReport(results: EvalResult[]): Promise<EvalSummary> {
  "use step";

  const successful = results.filter(r => !r.response.startsWith('Error:'));
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
  const avgTokens = results.reduce((sum, r) => sum + r.tokens, 0) / results.length;

  return {
    totalPrompts: results.length,
    avgLatencyMs: Math.round(avgLatency),
    avgTokens: Math.round(avgTokens),
    successRate: (successful.length / results.length) * 100,
  };
}
