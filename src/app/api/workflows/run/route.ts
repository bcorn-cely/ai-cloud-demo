import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { start } from 'workflow/api';
import { chatWorkflow, type ChatWorkflowInput, type ChatWorkflowOutput } from '@/workflows/chat-workflow';
import { evalWorkflow, type EvalWorkflowInput, type EvalWorkflowOutput } from '@/workflows/eval-workflow';

// Store for workflow runs (in production, use a proper database)
const workflowRuns = new Map<string, {
  runId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed';
  input: ChatWorkflowInput | EvalWorkflowInput;
  output?: ChatWorkflowOutput | EvalWorkflowOutput;
  error?: string;
  startedAt: string;
  completedAt?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, input } = body;

    if (!workflow || !input) {
      return NextResponse.json(
        { error: 'Missing workflow or input' },
        { status: 400 }
      );
    }

    // Check API key for gateway access
    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI Gateway API key not configured',
          message: 'Workflows require AI_GATEWAY_API_KEY to make LLM calls',
        },
        { status: 401 }
      );
    }

    const runId = `run_${nanoid(10)}`;
    const startedAt = new Date().toISOString();

    // Initialize run tracking
    workflowRuns.set(runId, {
      runId,
      workflowName: workflow,
      status: 'running',
      input,
      startedAt,
    });

    // Execute workflow based on type using Workflow DevKit's start()
    let result: ChatWorkflowOutput | EvalWorkflowOutput;

    try {
      if (workflow === 'chat') {
        const run = await start(chatWorkflow, [input as ChatWorkflowInput]);
        result = await run.returnValue;
      } else if (workflow === 'eval') {
        const run = await start(evalWorkflow, [input as EvalWorkflowInput]);
        result = await run.returnValue;
      } else {
        throw new Error(`Unknown workflow: ${workflow}`);
      }

      // Update run with success
      const completedAt = new Date().toISOString();
      workflowRuns.set(runId, {
        ...workflowRuns.get(runId)!,
        status: 'completed',
        output: result,
        completedAt,
      });

      return NextResponse.json({
        success: true,
        runId,
        workflowName: workflow,
        status: 'completed',
        output: result,
        startedAt,
        completedAt,
      });
    } catch (workflowError) {
      // Update run with failure
      const completedAt = new Date().toISOString();
      const errorMessage = workflowError instanceof Error ? workflowError.message : 'Unknown error';

      workflowRuns.set(runId, {
        ...workflowRuns.get(runId)!,
        status: 'failed',
        error: errorMessage,
        completedAt,
      });

      return NextResponse.json({
        success: false,
        runId,
        workflowName: workflow,
        status: 'failed',
        error: errorMessage,
        startedAt,
        completedAt,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get('runId');

  if (runId) {
    // Get specific run
    const run = workflowRuns.get(runId);
    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(run);
  }

  // List all runs
  const runs = Array.from(workflowRuns.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 50);

  return NextResponse.json({ runs });
}
