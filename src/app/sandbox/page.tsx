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

  const needsAuth = !process.env.NEXT_PUBLIC_VERCEL;

  return (
    <div className="container mx-auto px-6 py-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Box className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Sandbox</h1>
          <Badge variant="secondary" className="text-[10px]">Beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ephemeral VMs with mock OpenAI-compatible servers
        </p>
      </div>

      {/* Auth hint */}
      {sandbox.status === 'idle' && (
        <Alert className="mb-4">
          <Info className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            Requires <code className="bg-muted px-1 rounded">VERCEL_TOKEN</code> locally, or deploy to Vercel for automatic OIDC auth.
          </AlertDescription>
        </Alert>
      )}

      {/* Control Panel */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  sandbox.status === 'running'
                    ? 'bg-green-500'
                    : sandbox.status === 'creating' || sandbox.status === 'stopping'
                    ? 'bg-yellow-500 animate-pulse'
                    : sandbox.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium capitalize">{sandbox.status}</span>
              {sandbox.sandboxId && (
                <code className="text-[10px] text-muted-foreground">{sandbox.sandboxId}</code>
              )}
            </div>
            <Badge variant="outline" className="text-[10px]">node24</Badge>
          </div>

          {/* Domain */}
          {sandbox.domain && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Domain</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(sandbox.domain!)}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={`${sandbox.domain}/health`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
              <code className="text-xs break-all">{sandbox.domain}</code>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={startSandbox}
              disabled={sandbox.status === 'creating' || sandbox.status === 'running'}
              className="flex-1 h-9"
              size="sm"
            >
              {sandbox.status === 'creating' ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              Start
            </Button>
            <Button
              variant="outline"
              onClick={stopSandbox}
              disabled={sandbox.status !== 'running'}
              size="sm"
              className="h-9"
            >
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Stop
            </Button>
          </div>

          {/* Logs */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Logs</span>
            </div>
            <ScrollArea className="h-[140px] rounded-md border bg-black p-2">
              {sandbox.logs.length > 0 ? (
                <div className="font-mono text-[10px] text-green-400 space-y-0.5">
                  {sandbox.logs.map((log, i) => (
                    <p key={i}>$ {log}</p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[10px] text-gray-500">Ready</p>
              )}
            </ScrollArea>
          </div>

          {sandbox.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{sandbox.error}</AlertDescription>
            </Alert>
          )}

          {/* Usage - Collapsible */}
          <Collapsible open={showUsage} onOpenChange={setShowUsage}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                How to use
                <span className="text-muted-foreground">{showUsage ? '−' : '+'}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="text-xs text-muted-foreground">
                <p className="mb-2">Use in Playground: select &quot;Sandbox&quot; provider and paste the domain.</p>
                <p>Or use directly with AI SDK:</p>
              </div>
              <pre className="p-2 rounded-md bg-muted text-[10px] overflow-x-auto">
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
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">mock-gpt-4</Badge>
                <Badge variant="outline" className="text-[10px]">mock-claude</Badge>
                <Badge variant="outline" className="text-[10px]">mock-llama</Badge>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
