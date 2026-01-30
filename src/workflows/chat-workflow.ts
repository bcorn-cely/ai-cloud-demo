/**
 * Durable Chat Workflow
 * Demonstrates a multi-step AI chat workflow using Workflow DevKit
 */
import { parseInput, generateResponse, postProcess } from './chat-steps';

export interface ChatWorkflowInput {
  prompt: string;
  model: string;
}

export interface ChatWorkflowOutput {
  response: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  steps: {
    name: string;
    duration: number;
    result: string;
  }[];
}

/**
 * Main chat workflow
 */
export async function chatWorkflow(input: ChatWorkflowInput): Promise<ChatWorkflowOutput> {
  "use workflow";

  const steps: ChatWorkflowOutput['steps'] = [];

  // Step 1: Parse input
  const parseStart = Date.now();
  const parsed = await parseInput(input.prompt);
  steps.push({
    name: 'Parse Input',
    duration: Date.now() - parseStart,
    result: `Parsed ${parsed.tokens} estimated tokens`,
  });

  // Step 2: Generate response
  const generateStart = Date.now();
  const response = await generateResponse(parsed.parsed, input.model);
  steps.push({
    name: 'Generate Response',
    duration: Date.now() - generateStart,
    result: `Generated ${response.text.length} characters`,
  });

  // Step 3: Post-process
  const postStart = Date.now();
  const finalText = await postProcess(response.text);
  steps.push({
    name: 'Post-process',
    duration: Date.now() - postStart,
    result: 'Applied formatting and safety checks',
  });

  return {
    response: finalText,
    model: input.model,
    usage: response.usage,
    steps,
  };
}
