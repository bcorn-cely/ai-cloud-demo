/**
 * Model Evaluation Workflow
 * Demonstrates a durable evaluation workflow with sleep/wait capabilities
 */
import {
  fetchModelMetadata,
  runTestPrompt,
  durableSleep,
  generateReport,
  type EvalResult,
  type EvalSummary,
} from './eval-steps';

export interface EvalWorkflowInput {
  model: string;
  promptCount: number;
}

export interface EvalWorkflowOutput {
  model: string;
  results: EvalResult[];
  summary: EvalSummary;
  steps: {
    name: string;
    duration: number;
    result: string;
  }[];
}

// Re-export types for consumers
export type { EvalResult, EvalSummary };

const TEST_PROMPTS = [
  'What is 2 + 2?',
  'Explain quantum computing in one sentence.',
  'Write a haiku about programming.',
  'What is the capital of France?',
  'Name three primary colors.',
  'What does HTTP stand for?',
  'Explain recursion briefly.',
  'What is the speed of light?',
  'Name the largest planet in our solar system.',
  'What year did World War II end?',
];

/**
 * Main evaluation workflow
 */
export async function evalWorkflow(input: EvalWorkflowInput): Promise<EvalWorkflowOutput> {
  "use workflow";

  const steps: EvalWorkflowOutput['steps'] = [];
  const prompts = TEST_PROMPTS.slice(0, input.promptCount);

  // Step 1: Fetch model metadata
  const metaStart = Date.now();
  const metadata = await fetchModelMetadata(input.model);
  steps.push({
    name: 'Fetch Model Metadata',
    duration: Date.now() - metaStart,
    result: `Provider: ${metadata.provider}, Model: ${metadata.name}`,
  });

  // Step 2: Run test prompts
  const promptsStart = Date.now();
  const results: EvalResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const result = await runTestPrompt(input.model, prompts[i], i + 1);
    results.push(result);
  }

  steps.push({
    name: `Run ${prompts.length} Test Prompts`,
    duration: Date.now() - promptsStart,
    result: `Completed ${results.length} prompts`,
  });

  // Step 3: Durable sleep (demonstrates workflow durability)
  const sleepStart = Date.now();
  await durableSleep(3000); // 3 second sleep
  steps.push({
    name: 'Durable Sleep (3s)',
    duration: Date.now() - sleepStart,
    result: 'Workflow survived sleep - demonstrating durability',
  });

  // Step 4: Generate report
  const reportStart = Date.now();
  const summary = await generateReport(results);
  steps.push({
    name: 'Generate Report',
    duration: Date.now() - reportStart,
    result: `Success rate: ${summary.successRate}%, Avg latency: ${summary.avgLatencyMs}ms`,
  });

  return {
    model: input.model,
    results,
    summary,
    steps,
  };
}
