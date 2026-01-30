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
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  async function startSandbox() {
    setSandbox((s) => ({ ...s, status: 'creating', logs: [...s.logs, 'Creating sandbox...'] }));

    // Simulate sandbox creation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockSandboxId = `sbx_${Math.random().toString(36).slice(2, 10)}`;
    const mockDomain = `https://${mockSandboxId}.sandbox.vercel.app`;

    setSandbox({
      sandboxId: mockSandboxId,
      status: 'running',
      domain: mockDomain,
      logs: [
        'Creating sandbox...',
        `Sandbox created: ${mockSandboxId}`,
        'Writing mock server files...',
        'Starting OpenAI-compatible server on port 8080...',
        `Server running at ${mockDomain}`,
        'Mock model server ready!',
      ],
    });
  }

  async function stopSandbox() {
    setSandbox((s) => ({ ...s, status: 'stopping', logs: [...s.logs, 'Stopping sandbox...'] }));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSandbox((s) => ({
      ...s,
      status: 'stopped',
      logs: [...s.logs, 'Sandbox stopped.'],
    }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const mockServerCode = `// mock-server.mjs - OpenAI-compatible mock server
import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { messages, model } = JSON.parse(body);
      const lastMessage = messages[messages.length - 1];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'chatcmpl-' + Math.random().toString(36).slice(2),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || 'mock-gpt-4',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: \`Mock response to: "\${lastMessage.content.slice(0, 50)}..."\`,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: lastMessage.content.length / 4,
          completion_tokens: 20,
          total_tokens: lastMessage.content.length / 4 + 20,
        },
      }));
    });
  } else if (req.url === '/v1/models') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'mock-gpt-4', object: 'model', owned_by: 'sandbox' },
        { id: 'mock-claude', object: 'model', owned_by: 'sandbox' },
      ],
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => console.log(\`Mock server on port \${PORT}\`));`;

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Box className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Vercel Sandbox</h1>
          <Badge variant="outline">Beta</Badge>
        </div>
        <p className="text-muted-foreground">
          Spin up ephemeral VMs to run mock OpenAI-compatible model servers
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sandbox Control Panel</CardTitle>
            <CardDescription>
              Create and manage sandbox instances for mock model servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    sandbox.status === 'running'
                      ? 'bg-green-500'
                      : sandbox.status === 'creating' || sandbox.status === 'stopping'
                      ? 'bg-yellow-500 animate-pulse'
                      : sandbox.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                />
                <div>
                  <p className="font-medium capitalize">{sandbox.status}</p>
                  {sandbox.sandboxId && (
                    <code className="text-xs text-muted-foreground">{sandbox.sandboxId}</code>
                  )}
                </div>
              </div>
              <Badge variant="outline">node24</Badge>
            </div>

            {/* Domain */}
            {sandbox.domain && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Sandbox Domain</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(sandbox.domain!)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code className="text-xs block mt-2 break-all">{sandbox.domain}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={startSandbox}
                disabled={sandbox.status === 'creating' || sandbox.status === 'running'}
                className="flex-1"
              >
                {sandbox.status === 'creating' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Mock Server
              </Button>
              <Button
                variant="outline"
                onClick={stopSandbox}
                disabled={sandbox.status !== 'running'}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>

            <Separator />

            {/* Logs */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4" />
                <span className="text-sm font-medium">Logs</span>
              </div>
              <ScrollArea className="h-[200px] rounded-lg border bg-black p-3">
                {sandbox.logs.length > 0 ? (
                  <div className="font-mono text-xs text-green-400 space-y-1">
                    {sandbox.logs.map((log, i) => (
                      <p key={i}>$ {log}</p>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-gray-500">
                    No logs yet. Start a sandbox to see output.
                  </p>
                )}
              </ScrollArea>
            </div>

            {sandbox.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{sandbox.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
            <CardDescription>
              Use the sandbox mock server with AI SDK
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="usage">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="server">Server Code</TabsTrigger>
              </TabsList>

              <TabsContent value="usage" className="mt-4 space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Works with AI SDK</AlertTitle>
                  <AlertDescription>
                    The mock server is OpenAI-compatible. Use it with createOpenAICompatible.
                  </AlertDescription>
                </Alert>

                <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
{`import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

// Point to your sandbox domain
const sandbox = createOpenAICompatible({
  name: 'sandbox',
  baseURL: '${sandbox.domain || 'https://your-sandbox.sandbox.vercel.app'}/v1',
});

const { text } = await generateText({
  model: sandbox('mock-gpt-4'),
  prompt: 'Hello from sandbox!',
});

console.log(text);`}
                </pre>

                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium mb-2">Available Models</p>
                  <div className="flex gap-2">
                    <Badge>mock-gpt-4</Badge>
                    <Badge>mock-claude</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium mb-2">Supported Endpoints</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      <code className="text-xs bg-muted px-1 rounded">
                        POST /v1/chat/completions
                      </code>
                    </li>
                    <li>
                      <code className="text-xs bg-muted px-1 rounded">GET /v1/models</code>
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="server" className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  This mock server code is written to the sandbox and started automatically:
                </p>
                <ScrollArea className="h-[400px]">
                  <pre className="p-3 rounded-lg bg-muted text-xs">{mockServerCode}</pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Integration with Playground */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Integration with Playground</CardTitle>
          <CardDescription>
            Use the sandbox mock model in the chat playground
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium">Start the sandbox</p>
                <p className="text-muted-foreground">
                  Click &quot;Start Mock Server&quot; above to create a sandbox
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium">Copy the domain</p>
                <p className="text-muted-foreground">
                  Copy the sandbox domain URL once it&apos;s running
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium">Configure in Playground</p>
                <p className="text-muted-foreground">
                  Go to Playground, select &quot;Sandbox Mock&quot; provider, and paste the domain
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <div>
                <p className="font-medium">Start chatting</p>
                <p className="text-muted-foreground">
                  Chat with the mock model to test your integration
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
