'use client';

import { useState } from 'react';
import {
  Box,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Globe,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SandboxState {
  sandboxId: string | null;
  status: 'idle' | 'creating' | 'running' | 'stopping' | 'stopped' | 'error';
  domain: string | null;
  logs: string[];
  error?: string;
}

export default function SandboxPage() {
  const [sandbox, setSandbox] = useState<SandboxState>({
    sandboxId: null,
    status: 'idle',
    domain: null,
    logs: [],
  });
  const [copied, setCopied] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  async function startSandbox() {
    setSandbox((s) => ({
      ...s,
      status: 'creating',
      logs: [...s.logs, 'Creating Vercel Sandbox...'],
      error: undefined,
    }));

    try {
      const response = await fetch('/api/sandbox/create', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setSandbox((s) => ({
          ...s,
          status: 'error',
          logs: [...s.logs, ...data.logs, `Error: ${data.error || data.message}`],
          error: data.message || data.error,
        }));
        return;
      }

      setSandbox({
        sandboxId: data.sandboxId,
        status: 'running',
        domain: data.domain,
        logs: [...sandbox.logs, ...data.logs],
      });
    } catch (error) {
      setSandbox((s) => ({
        ...s,
        status: 'error',
        logs: [...s.logs, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
      }));
    }
  }

  async function stopSandbox() {
    setSandbox((s) => ({
      ...s,
      status: 'stopping',
      logs: [...s.logs, 'Stopping sandbox...'],
    }));

    try {
      const response = await fetch('/api/sandbox/create', { method: 'DELETE' });
      const data = await response.json();

      setSandbox((s) => ({
        ...s,
        status: data.success ? 'stopped' : 'error',
        logs: [...s.logs, ...data.logs],
        error: data.success ? undefined : data.error,
      }));
    } catch (error) {
      setSandbox((s) => ({
        ...s,
        status: 'error',
        logs: [...s.logs, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        error: error instanceof Error ? error.message : 'Failed to stop sandbox',
      }));
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatusColor() {
    if (sandbox.status === 'running') return 'bg-emerald-500';
    if (sandbox.status === 'creating' || sandbox.status === 'stopping') return 'bg-amber-500';
    if (sandbox.status === 'error') return 'bg-red-500';
    return 'bg-gray-400';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25">
              <Box className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Sandbox</h1>
                <Badge variant="secondary" className="text-[10px] font-medium">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ephemeral VMs with mock OpenAI-compatible servers
              </p>
            </div>
          </div>
        </div>

        {/* Auth hint */}
        {sandbox.status === 'idle' && (
          <Card className="mb-6 border-0 bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 shadow-lg shadow-indigo-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 shrink-0">
                  <Info className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Requires <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">VERCEL_TOKEN</code> locally, or deploy to Vercel for automatic OIDC auth.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card className="border-0 shadow-lg shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-500" />
              Sandbox Control
            </CardTitle>
            <CardDescription>Manage your ephemeral test environment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()} ${
                  sandbox.status === 'creating' || sandbox.status === 'stopping' ? 'animate-pulse' : ''
                }`} />
                <span className="font-medium capitalize">{sandbox.status}</span>
                {sandbox.sandboxId && (
                  <code className="text-xs text-muted-foreground font-mono">{sandbox.sandboxId}</code>
                )}
              </div>
              <Badge variant="outline" className="text-xs font-medium">node24</Badge>
            </div>

            {/* Domain */}
            {sandbox.domain && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Domain</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(sandbox.domain!)}>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`${sandbox.domain}/health`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <code className="text-sm font-mono break-all text-emerald-700">{sandbox.domain}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={startSandbox}
                disabled={sandbox.status === 'creating' || sandbox.status === 'running'}
                className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-lg shadow-indigo-500/25"
              >
                {sandbox.status === 'creating' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Sandbox
              </Button>
              <Button
                variant="outline"
                onClick={stopSandbox}
                disabled={sandbox.status !== 'running'}
                className="h-11"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>

            {/* Logs */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logs</span>
              </div>
              <ScrollArea className="h-[160px] rounded-xl border-0 bg-zinc-950 p-4">
                {sandbox.logs.length > 0 ? (
                  <div className="font-mono text-xs text-emerald-400 space-y-1">
                    {sandbox.logs.map((log, i) => (
                      <p key={i} className="leading-relaxed">
                        <span className="text-zinc-500">$</span> {log}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-zinc-500">Ready to start...</p>
                )}
              </ScrollArea>
            </div>

            {sandbox.error && (
              <Alert variant="destructive" className="border-0 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sandbox.error}</AlertDescription>
              </Alert>
            )}

            {/* Usage - Collapsible */}
            <Collapsible open={showUsage} onOpenChange={setShowUsage}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-10 text-sm font-medium">
                  <span>How to use</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showUsage ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-3">Use in Playground: select &quot;Sandbox&quot; provider and paste the domain.</p>
                  <p>Or use directly with AI SDK:</p>
                </div>
                <pre className="p-4 rounded-xl bg-muted/50 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
{`import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const sandbox = createOpenAICompatible({
  name: 'sandbox',
  baseURL: '${sandbox.domain || 'https://sandbox-xxx'}/v1',
});

const { text } = await generateText({
  model: sandbox('mock-gpt-4'),
  prompt: 'Hello!',
});`}
                </pre>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium">mock-gpt-4</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">mock-claude</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">mock-llama</Badge>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
