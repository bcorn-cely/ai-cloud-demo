'use client';

import { useState } from 'react';
import {
  Workflow,
  Play,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

interface WorkflowRun {
  runId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  result?: Record<string, unknown>;
}

export default function WorkflowsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Chat workflow config
  const [chatPrompt, setChatPrompt] = useState('Explain what workflow durability means');
  const [chatModel, setChatModel] = useState('anthropic/claude-sonnet-4');

  // Eval workflow config
  const [evalModel, setEvalModel] = useState('openai/gpt-4o');
  const [evalPrompts, setEvalPrompts] = useState(3);

  async function startChatWorkflow() {
    setIsStarting(true);

    const runId = `run_${Math.random().toString(36).slice(2, 10)}`;
    const newRun: WorkflowRun = {
      runId,
      workflowName: 'Durable Chat Agent',
      status: 'running',
      progress: 0,
      steps: [
        { id: 'parse', name: 'Parse Input', status: 'running' },
        { id: 'generate', name: 'Generate Response', status: 'pending' },
        { id: 'tools', name: 'Execute Tools (if any)', status: 'pending' },
        { id: 'stream', name: 'Stream to Client', status: 'pending' },
      ],
      startedAt: new Date().toISOString(),
    };

    setRuns((r) => [newRun, ...r]);
    setSelectedRun(newRun);

    // Simulate workflow execution
    await simulateWorkflow(runId, newRun.steps);
    setIsStarting(false);
  }

  async function startEvalWorkflow() {
    setIsStarting(true);

    const runId = `run_${Math.random().toString(36).slice(2, 10)}`;
    const newRun: WorkflowRun = {
      runId,
      workflowName: 'Model Evaluation',
      status: 'running',
      progress: 0,
      steps: [
        { id: 'fetch', name: 'Fetch Model Metadata', status: 'running' },
        { id: 'prompts', name: `Run ${evalPrompts} Test Prompts`, status: 'pending' },
        { id: 'sandbox', name: 'Create Sandbox for Eval Script', status: 'pending' },
        { id: 'sleep', name: 'Sleep (5s demo)', status: 'pending' },
        { id: 'report', name: 'Generate Report', status: 'pending' },
      ],
      startedAt: new Date().toISOString(),
    };

    setRuns((r) => [newRun, ...r]);
    setSelectedRun(newRun);

    // Simulate workflow execution
    await simulateWorkflow(runId, newRun.steps);
    setIsStarting(false);
  }

  async function simulateWorkflow(runId: string, steps: WorkflowStep[]) {
    for (let i = 0; i < steps.length; i++) {
      // Update step to running
      setRuns((runs) =>
        runs.map((r) =>
          r.runId === runId
            ? {
                ...r,
                progress: (i / steps.length) * 100,
                steps: r.steps.map((s, idx) =>
                  idx === i
                    ? { ...s, status: 'running', startedAt: new Date().toISOString() }
                    : s
                ),
              }
            : r
        )
      );
      setSelectedRun((r) =>
        r?.runId === runId
          ? {
              ...r,
              progress: (i / steps.length) * 100,
              steps: r.steps.map((s, idx) =>
                idx === i
                  ? { ...s, status: 'running', startedAt: new Date().toISOString() }
                  : s
              ),
            }
          : r
      );

      // Simulate step execution
      const stepTime = steps[i].name.includes('Sleep') ? 5000 : Math.random() * 2000 + 500;
      await new Promise((resolve) => setTimeout(resolve, stepTime));

      // Update step to completed
      setRuns((runs) =>
        runs.map((r) =>
          r.runId === runId
            ? {
                ...r,
                progress: ((i + 1) / steps.length) * 100,
                steps: r.steps.map((s, idx) =>
                  idx === i
                    ? {
                        ...s,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        result: { success: true },
                      }
                    : s
                ),
              }
            : r
        )
      );
      setSelectedRun((r) =>
        r?.runId === runId
          ? {
              ...r,
              progress: ((i + 1) / steps.length) * 100,
              steps: r.steps.map((s, idx) =>
                idx === i
                  ? {
                      ...s,
                      status: 'completed',
                      completedAt: new Date().toISOString(),
                      result: { success: true },
                    }
                  : s
              ),
            }
          : r
      );
    }

    // Complete workflow
    setRuns((runs) =>
      runs.map((r) =>
        r.runId === runId
          ? {
              ...r,
              status: 'completed',
              progress: 100,
              completedAt: new Date().toISOString(),
              result: { message: 'Workflow completed successfully' },
            }
          : r
      )
    );
    setSelectedRun((r) =>
      r?.runId === runId
        ? {
            ...r,
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            result: { message: 'Workflow completed successfully' },
          }
        : r
    );
  }

  function getStepIcon(status: WorkflowStep['status']) {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Workflow className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Workflow DevKit</h1>
          <Badge variant="outline">Beta</Badge>
        </div>
        <p className="text-muted-foreground">
          Durable agents and long-running jobs with streaming progress
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Workflow Starters */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Start a Workflow</CardTitle>
              <CardDescription>
                Choose and configure a workflow to run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chat">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat Agent</TabsTrigger>
                  <TabsTrigger value="eval">Evaluation</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={chatModel} onValueChange={setChatModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic/claude-sonnet-4">
                          Claude Sonnet 4
                        </SelectItem>
                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="google/gemini-2.0-flash">
                          Gemini 2.0 Flash
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prompt</Label>
                    <Input
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder="Enter your prompt..."
                    />
                  </div>

                  <Button
                    onClick={startChatWorkflow}
                    disabled={isStarting}
                    className="w-full"
                  >
                    {isStarting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Chat Workflow
                  </Button>
                </TabsContent>

                <TabsContent value="eval" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Model to Evaluate</Label>
                    <Select value={evalModel} onValueChange={setEvalModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="anthropic/claude-sonnet-4">
                          Claude Sonnet 4
                        </SelectItem>
                        <SelectItem value="google/gemini-2.0-flash">
                          Gemini 2.0 Flash
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Test Prompts</Label>
                    <Select
                      value={String(evalPrompts)}
                      onValueChange={(v) => setEvalPrompts(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 prompts</SelectItem>
                        <SelectItem value="5">5 prompts</SelectItem>
                        <SelectItem value="10">10 prompts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Includes Sleep Step</AlertTitle>
                    <AlertDescription>
                      This workflow includes a 5-second sleep to demonstrate durable waiting.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={startEvalWorkflow}
                    disabled={isStarting}
                    className="w-full"
                  >
                    {isStarting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Eval Workflow
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Run History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {runs.length > 0 ? (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <div
                        key={run.runId}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRun?.runId === run.runId
                            ? 'bg-muted border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedRun(run)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{run.workflowName}</span>
                          <Badge
                            variant={
                              run.status === 'completed'
                                ? 'default'
                                : run.status === 'running'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {run.status}
                          </Badge>
                        </div>
                        <code className="text-xs text-muted-foreground">{run.runId}</code>
                        <Progress value={run.progress} className="h-1 mt-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No workflow runs yet. Start one above!
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Run Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Run Details</CardTitle>
            <CardDescription>
              {selectedRun
                ? `Viewing ${selectedRun.runId}`
                : 'Select a run to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(selectedRun.progress)}%
                    </span>
                  </div>
                  <Progress value={selectedRun.progress} className="h-2" />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Workflow Steps</h4>
                  {selectedRun.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {getStepIcon(step.status)}
                        {index < selectedRun.steps.length - 1 && (
                          <div className="w-px h-8 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{step.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {step.status}
                          </Badge>
                        </div>
                        {step.startedAt && (
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(step.startedAt).toLocaleTimeString()}
                            {step.completedAt && (
                              <> | Completed: {new Date(step.completedAt).toLocaleTimeString()}</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRun.result && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Result</h4>
                      <pre className="p-3 rounded-lg bg-muted text-xs">
                        {JSON.stringify(selectedRun.result, null, 2)}
                      </pre>
                    </div>
                  </>
                )}

                <Separator />

                {/* Code Example */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Workflow Code Example</h4>
                  <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
{`// workflows/chat/workflow.ts
export async function chatWorkflow(prompt: string) {
  "use workflow";

  // Step 1: Parse input
  const parsed = await parseInput(prompt);

  // Step 2: Generate response (durable)
  const response = await generateResponse(parsed);

  // Step 3: Execute tools if needed
  if (response.toolCalls?.length > 0) {
    await executeTools(response.toolCalls);
  }

  // Step 4: Stream to client
  const writable = getWritable<UIMessageChunk>();
  await streamResponse(response, writable);

  return response;
}`}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Workflow className="h-8 w-8 mb-2" />
                <p className="text-sm">Select a workflow run to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CLI Hint */}
      <Alert className="mt-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Local Development</AlertTitle>
        <AlertDescription>
          Run <code className="text-xs bg-muted px-1 rounded">npx workflow web</code> to inspect
          workflow runs in detail with the Workflow DevKit web UI.
        </AlertDescription>
      </Alert>
    </div>
  );
}
