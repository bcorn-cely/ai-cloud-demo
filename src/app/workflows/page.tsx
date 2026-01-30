'use client';

import { useState } from 'react';
import {
  Workflow,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowStep {
  name: string;
  duration: number;
  result: string;
}

interface WorkflowRun {
  runId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  output?: Record<string, unknown>;
  error?: string;
}

export default function WorkflowsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [workflowType, setWorkflowType] = useState<'chat' | 'eval'>('chat');

  // Chat config
  const [chatPrompt, setChatPrompt] = useState('Explain what workflow durability means.');
  const [chatModel, setChatModel] = useState('anthropic/claude-sonnet-4');

  // Eval config
  const [evalModel, setEvalModel] = useState('openai/gpt-4o');
  const [evalPrompts, setEvalPrompts] = useState(3);

  async function startWorkflow() {
    setIsStarting(true);

    const tempRun: WorkflowRun = {
      runId: 'starting...',
      workflowName: workflowType === 'chat' ? 'Chat Agent' : 'Evaluation',
      status: 'running',
      steps: [],
      startedAt: new Date().toISOString(),
    };

    setRuns((r) => [tempRun, ...r]);
    setSelectedRun(tempRun);

    try {
      const input = workflowType === 'chat'
        ? { prompt: chatPrompt, model: chatModel }
        : { model: evalModel, promptCount: evalPrompts };

      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowType, input }),
      });

      const data = await response.json();

      const newRun: WorkflowRun = {
        runId: data.runId,
        workflowName: workflowType === 'chat' ? 'Chat Agent' : 'Evaluation',
        status: data.status,
        steps: data.output?.steps || [],
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        output: data.output,
        error: data.error,
      };

      setRuns((r) => [newRun, ...r.slice(1)]);
      setSelectedRun(newRun);
    } catch (error) {
      const errorRun: WorkflowRun = {
        runId: 'error',
        workflowName: workflowType === 'chat' ? 'Chat Agent' : 'Evaluation',
        status: 'failed',
        steps: [],
        startedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setRuns((r) => [errorRun, ...r.slice(1)]);
      setSelectedRun(errorRun);
    }

    setIsStarting(false);
  }

  function getStatusColor(status: WorkflowRun['status']) {
    if (status === 'failed') return 'bg-red-500';
    if (status === 'completed') return 'bg-emerald-500';
    return 'bg-amber-500';
  }

  function getStepIcon(status: WorkflowRun['status']) {
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
  }

  const totalDuration = selectedRun?.steps.reduce((sum, step) => sum + step.duration, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
                <Badge variant="secondary" className="text-[10px] font-medium">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Durable execution with real AI Gateway calls
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left: Starter + History */}
          <div className="space-y-6">
            {/* Workflow Starter */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Launch Workflow
                </CardTitle>
                <CardDescription>Configure and start a new workflow run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Workflow Type</Label>
                  <Select value={workflowType} onValueChange={(v) => setWorkflowType(v as 'chat' | 'eval')}>
                    <SelectTrigger className="h-10 bg-muted/50 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat Agent</SelectItem>
                      <SelectItem value="eval">Model Evaluation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {workflowType === 'chat' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                      <Select value={chatModel} onValueChange={setChatModel}>
                        <SelectTrigger className="h-10 bg-muted/50 border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4</SelectItem>
                          <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="google/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Prompt</Label>
                      <Input
                        value={chatPrompt}
                        onChange={(e) => setChatPrompt(e.target.value)}
                        className="h-10 bg-muted/50 border-0"
                        placeholder="Enter your prompt..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Model to Evaluate</Label>
                      <Select value={evalModel} onValueChange={setEvalModel}>
                        <SelectTrigger className="h-10 bg-muted/50 border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4</SelectItem>
                          <SelectItem value="google/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Test Prompts</Label>
                      <Select value={String(evalPrompts)} onValueChange={(v) => setEvalPrompts(parseInt(v))}>
                        <SelectTrigger className="h-10 bg-muted/50 border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 prompts</SelectItem>
                          <SelectItem value="5">5 prompts</SelectItem>
                          <SelectItem value="10">10 prompts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      Includes 3s durable sleep to demonstrate workflow persistence
                    </p>
                  </>
                )}

                <Button
                  onClick={startWorkflow}
                  disabled={isStarting}
                  className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  {isStarting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Workflow
                </Button>
              </CardContent>
            </Card>

            {/* Run History */}
            <div>
              <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Run History
              </h3>
              <ScrollArea className="h-[320px]">
                {runs.length > 0 ? (
                  <div className="space-y-2">
                    {runs.map((run, i) => (
                      <Card
                        key={`${run.runId}-${i}`}
                        className={`cursor-pointer transition-all duration-200 border-0 shadow-sm hover:shadow-md ${
                          selectedRun?.runId === run.runId
                            ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 ring-1 ring-violet-500/20'
                            : 'bg-card hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedRun(run)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{run.workflowName}</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(run.status)} ${run.status === 'running' ? 'animate-pulse' : ''}`} />
                              <span className="text-xs text-muted-foreground capitalize">{run.status}</span>
                            </div>
                          </div>
                          <code className="text-[10px] text-muted-foreground font-mono">{run.runId}</code>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Workflow className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No runs yet</p>
                    <p className="text-xs">Launch a workflow to get started</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right: Run Details */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Run Details</CardTitle>
              <CardDescription>
                {selectedRun ? (
                  <code className="text-xs font-mono">{selectedRun.runId}</code>
                ) : (
                  'Select a run to view details'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRun ? (
                <div className="space-y-6">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(selectedRun.status)} ${selectedRun.status === 'running' ? 'animate-pulse' : ''}`} />
                      <span className="font-medium capitalize">{selectedRun.status}</span>
                    </div>
                    {totalDuration > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{totalDuration}ms total</span>
                      </div>
                    )}
                  </div>

                  {selectedRun.error && (
                    <Alert variant="destructive" className="border-0 bg-red-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{selectedRun.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Steps */}
                  <div>
                    <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                      Execution Steps
                    </h4>
                    {selectedRun.steps.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRun.steps.map((step, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            {getStepIcon(selectedRun.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{step.name}</span>
                                <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                                  {step.duration}ms
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 break-words">
                                {step.result}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedRun.status === 'running' ? (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 text-amber-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Workflow executing...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 text-center">No steps recorded</p>
                    )}
                  </div>

                  {selectedRun.output && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                          Output
                        </h4>
                        <ScrollArea className="h-[200px]">
                          <pre className="p-4 rounded-xl bg-muted/50 text-xs font-mono whitespace-pre-wrap break-words overflow-x-hidden">
                            {JSON.stringify(selectedRun.output, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Started</p>
                      <p className="font-medium text-sm">{new Date(selectedRun.startedAt).toLocaleTimeString()}</p>
                    </div>
                    {selectedRun.completedAt && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Completed</p>
                        <p className="font-medium text-sm">{new Date(selectedRun.completedAt).toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[450px] text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Workflow className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium">No run selected</p>
                  <p className="text-sm">Select a run from the history or start a new one</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
