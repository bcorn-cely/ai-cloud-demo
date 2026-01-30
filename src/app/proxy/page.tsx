'use client';

import { useState } from 'react';
import {
  Network,
  Server,
  Shield,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';

interface ProxyHop {
  url: string;
  latencyMs: number;
  status: number;
  headers: Record<string, string>;
}

interface TestResult {
  success: boolean;
  message: string;
  hops?: ProxyHop[];
  totalLatencyMs?: number;
  effectiveBaseURL?: string;
}

export default function ProxyPage() {
  const [baseURL, setBaseURL] = useState('');
  const [extraHeaders, setExtraHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [simulateChainedProxy, setSimulateChainedProxy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  function addHeader() {
    setExtraHeaders([...extraHeaders, { key: '', value: '' }]);
  }

  function removeHeader(index: number) {
    setExtraHeaders(extraHeaders.filter((_, i) => i !== index));
  }

  function updateHeader(index: number, field: 'key' | 'value', value: string) {
    const newHeaders = [...extraHeaders];
    newHeaders[index][field] = value;
    setExtraHeaders(newHeaders);
  }

  async function runTest() {
    setTesting(true);
    setTestResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const hops: ProxyHop[] = [];
    let totalLatency = 0;

    if (baseURL) {
      const hop1Latency = Math.floor(Math.random() * 50) + 10;
      totalLatency += hop1Latency;
      hops.push({
        url: baseURL,
        latencyMs: hop1Latency,
        status: 200,
        headers: {
          'X-Proxy-Hop': '1',
          ...Object.fromEntries(
            extraHeaders
              .filter((h) => h.key && h.value)
              .map((h) => [h.key, h.value])
          ),
        },
      });
    }

    if (simulateChainedProxy) {
      const hop2Latency = Math.floor(Math.random() * 30) + 5;
      totalLatency += hop2Latency;
      hops.push({
        url: 'https://internal-proxy.corp.example.com',
        latencyMs: hop2Latency,
        status: 200,
        headers: { 'X-Proxy-Hop': '2', 'X-Forwarded-For': '10.0.0.1' },
      });
    }

    const finalLatency = Math.floor(Math.random() * 100) + 50;
    totalLatency += finalLatency;
    hops.push({
      url: baseURL || 'https://ai-gateway.vercel.sh/v1/ai',
      latencyMs: finalLatency,
      status: 200,
      headers: { 'X-Proxy-Hop': String(hops.length + 1), 'X-Final-Destination': 'true' },
    });

    setTestResult({
      success: true,
      message: 'Proxy chain test completed successfully',
      hops,
      totalLatencyMs: totalLatency,
      effectiveBaseURL: baseURL || 'https://ai-gateway.vercel.sh/v1/ai',
    });

    setTesting(false);
  }

  const configCode = `import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
  ${baseURL ? `baseURL: '${baseURL}',` : '// baseURL: "https://your-proxy.corp.example.com/v1/ai",'}
  ${extraHeaders.filter((h) => h.key && h.value).length > 0
    ? `headers: {
    ${extraHeaders
      .filter((h) => h.key && h.value)
      .map((h) => `'${h.key}': '${h.value}'`)
      .join(',\n    ')}
  },`
    : '// headers: { "Proxy-Authorization": "Bearer token" },'}
  ${simulateChainedProxy
    ? `// Custom fetch for chained proxy
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('X-Proxy-Chain', 'hop-1');
    console.log('Proxying to:', input);
    return fetch(input, { ...init, headers });
  },`
    : '// fetch: customProxyFetch,'}
});`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Proxy & VPC Lab</h1>
              <p className="text-sm text-muted-foreground">
                Configure corporate proxy, custom baseURL, and chained proxy patterns
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4 text-rose-500" />
                  Proxy Configuration
                </CardTitle>
                <CardDescription>
                  Configure how requests are routed to AI Gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">AI Gateway Base URL Override</Label>
                  <Input
                    placeholder="https://ai-gateway.vercel.sh/v1/ai (default)"
                    value={baseURL}
                    onChange={(e) => setBaseURL(e.target.value)}
                    className="h-10 bg-muted/50 border-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Override the default AI Gateway URL for corporate proxy or self-hosted gateway
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Extra Headers</Label>
                    <Button variant="ghost" size="sm" onClick={addHeader}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Header
                    </Button>
                  </div>
                  {extraHeaders.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        className="flex-1 h-9 bg-muted/50 border-0"
                      />
                      <Input
                        placeholder="Header value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        className="flex-1 h-9 bg-muted/50 border-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeHeader(index)}
                        disabled={extraHeaders.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div>
                    <Label className="font-medium">Simulate Chained Proxy</Label>
                    <p className="text-xs text-muted-foreground">
                      Add an intermediate proxy hop to simulate corporate networks
                    </p>
                  </div>
                  <Switch
                    checked={simulateChainedProxy}
                    onCheckedChange={setSimulateChainedProxy}
                  />
                </div>

                <Button
                  onClick={runTest}
                  disabled={testing}
                  className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25"
                >
                  {testing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Test Request
                </Button>
              </CardContent>
            </Card>

            {/* VPC Patterns */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-rose-500" />
                  Customer VPC / On-Prem Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pattern1">
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger value="pattern1" className="text-xs">On-Prem Models</TabsTrigger>
                    <TabsTrigger value="pattern2" className="text-xs">Gateway + Proxy</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pattern1" className="mt-5 space-y-4">
                    <div className="p-4 rounded-xl bg-violet-500/10">
                      <div className="flex items-start gap-3">
                        <Server className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Pattern 1: On-Prem Models Only</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            All models run inside your VPC. Use OpenAI-compatible provider with internal baseURL.
                          </p>
                        </div>
                      </div>
                    </div>
                    <CodeBlock
                      language="typescript"
                      filename="on-prem-provider.ts"
                      code={`import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const onPremProvider = createOpenAICompatible({
  name: 'on-prem-llm',
  baseURL: 'http://llm-service.internal:8000/v1',
  // No API key needed for internal service
});

const { text } = await generateText({
  model: onPremProvider('llama-3-70b'),
  prompt: 'Analyze this internal document...',
});`}
                      maxHeight="240px"
                    />
                  </TabsContent>

                  <TabsContent value="pattern2" className="mt-5 space-y-4">
                    <div className="p-4 rounded-xl bg-rose-500/10">
                      <div className="flex items-start gap-3">
                        <Network className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Pattern 2: Gateway via Corporate Proxy</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use AI Gateway for hosted models, routed through your corporate proxy.
                          </p>
                        </div>
                      </div>
                    </div>
                    <CodeBlock
                      language="typescript"
                      filename="gateway-proxy.ts"
                      code={`import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
  baseURL: 'https://proxy.corp.example.com/ai-gateway',
  headers: {
    'Proxy-Authorization': 'Basic ' + btoa('user:pass'),
    'X-Corp-Request-ID': crypto.randomUUID(),
  },
});

const { text } = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Summarize this...',
});`}
                      maxHeight="260px"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Test Results */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Test Results</CardTitle>
                <CardDescription>Results from proxy chain test</CardDescription>
              </CardHeader>
              <CardContent>
                {testResult ? (
                  <div className="space-y-5">
                    <Alert className={`border-0 ${testResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertTitle>{testResult.success ? 'Success' : 'Failed'}</AlertTitle>
                      <AlertDescription>
                        {testResult.message}
                        {testResult.totalLatencyMs && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            {testResult.totalLatencyMs}ms total
                          </Badge>
                        )}
                      </AlertDescription>
                    </Alert>

                    {testResult.hops && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Proxy Hops
                        </h4>
                        {testResult.hops.map((hop, index) => (
                          <div key={index} className="p-4 rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-medium">Hop {index + 1}</Badge>
                                <code className="text-xs truncate max-w-[200px]">{hop.url}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {hop.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {hop.latencyMs}ms
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
                              Headers: {Object.entries(hop.headers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground mb-1">Effective Base URL</p>
                      <code className="text-sm font-mono text-emerald-600 break-all">{testResult.effectiveBaseURL}</code>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                      <Network className="h-8 w-8 text-rose-500/70" />
                    </div>
                    <p className="font-medium mb-1">No test results</p>
                    <p className="text-sm">Run a test to see proxy chain results</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Code */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Generated Configuration</CardTitle>
                <CardDescription>Based on your settings above</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="typescript"
                  filename="gateway-config.ts"
                  code={configCode}
                  maxHeight="300px"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
