/**
 * Chat Workflow Steps
 * Step functions for the chat workflow
 */
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Parse and validate the input prompt
 */
export async function parseInput(prompt: string): Promise<{ parsed: string; tokens: number }> {
  "use step";

  const trimmed = prompt.trim();
  const estimatedTokens = Math.ceil(trimmed.length / 4);

  return {
    parsed: trimmed,
    tokens: estimatedTokens,
  };
}

/**
 * Generate AI response using the gateway
 */
export async function generateResponse(
  prompt: string,
  model: string
): Promise<{ text: string; usage: ChatUsage | undefined }> {
  "use step";

  const result = await generateText({
    model: gateway(model),
    prompt,
    maxOutputTokens: 1024,
  });

  return {
    text: result.text,
    usage: result.usage ? {
      promptTokens: (result.usage as { inputTokens?: number }).inputTokens ?? 0,
      completionTokens: (result.usage as { outputTokens?: number }).outputTokens ?? 0,
      totalTokens: result.usage.totalTokens ?? 0,
    } : undefined,
  };
}

/**
 * Post-process the response
 */
export async function postProcess(text: string): Promise<string> {
  "use step";

  return text.trim();
}
