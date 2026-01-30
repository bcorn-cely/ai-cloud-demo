'use client';

import { useState } from 'react';
import {
  Network,
  Server,
  Shield,
  Play,
  RefreshCw,
  Copy,
  Check,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [copied, setCopied] = useState(false);

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

    // Simulate proxy test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const hops: ProxyHop[] = [];
    let totalLatency = 0;

    // First hop (local/corporate proxy)
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

    // Simulated chained proxy
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

    // Final destination
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Proxy & VPC Lab</h1>
        <p className="text-muted-foreground mt-1">
          Configure corporate proxy, custom baseURL, and chained proxy patterns
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5" />
                Proxy Configuration
              </CardTitle>
              <CardDescription>
                Configure how requests are routed to AI Gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>AI Gateway Base URL Override</Label>
                <Input
                  placeholder="https://ai-gateway.vercel.sh/v1/ai (default)"
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Override the default AI Gateway URL for corporate proxy or self-hosted gateway
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Extra Headers</Label>
                  <Button variant="ghost" size="sm" onClick={addHeader}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Header
                  </Button>
                </div>
                {extraHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(index)}
                      disabled={extraHeaders.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Simulate Chained Proxy</Label>
                  <p className="text-xs text-muted-foreground">
                    Add an intermediate proxy hop to simulate corporate networks
                  </p>
                </div>
                <Switch
                  checked={simulateChainedProxy}
                  onCheckedChange={setSimulateChainedProxy}
                />
              </div>

              <Button onClick={runTest} disabled={testing} className="w-full">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Customer VPC / On-Prem Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pattern1">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pattern1">On-Prem Models</TabsTrigger>
                  <TabsTrigger value="pattern2">Gateway + Proxy</TabsTrigger>
                </TabsList>

                <TabsContent value="pattern1" className="mt-4">
                  <Alert>
                    <Server className="h-4 w-4" />
                    <AlertTitle>Pattern 1: On-Prem Models Only</AlertTitle>
                    <AlertDescription>
                      All models run inside your VPC. Use OpenAI-compatible provider with internal
                      baseURL.
                    </AlertDescription>
                  </Alert>
                  <pre className="mt-3 p-3 rounded-lg bg-muted text-xs">
{`import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const onPremProvider = createOpenAICompatible({
  name: 'on-prem-llm',
  baseURL: 'http://llm-service.internal:8000/v1',
  // No API key needed for internal service
});

const { text } = await generateText({
  model: onPremProvider('llama-3-70b'),
  prompt: 'Analyze this internal document...',
});`}
                  </pre>
                </TabsContent>

                <TabsContent value="pattern2" className="mt-4">
                  <Alert>
                    <Network className="h-4 w-4" />
                    <AlertTitle>Pattern 2: Gateway via Corporate Proxy</AlertTitle>
                    <AlertDescription>
                      Use AI Gateway for hosted models, routed through your corporate proxy.
                    </AlertDescription>
                  </Alert>
                  <pre className="mt-3 p-3 rounded-lg bg-muted text-xs">
{`import { createGateway } from '@ai-sdk/gateway';

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
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
              <CardDescription>Results from proxy chain test</CardDescription>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <div className="space-y-4">
                  <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>{testResult.success ? 'Success' : 'Failed'}</AlertTitle>
                    <AlertDescription>
                      {testResult.message}
                      {testResult.totalLatencyMs && (
                        <span className="ml-2">
                          Total latency: {testResult.totalLatencyMs}ms
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  {testResult.hops && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Proxy Hops</h4>
                      {testResult.hops.map((hop, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Hop {index + 1}</Badge>
                              <code className="text-xs truncate max-w-[200px]">{hop.url}</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {hop.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {hop.latencyMs}ms
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Headers:{' '}
                            {Object.entries(hop.headers)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium">Effective Base URL</p>
                    <code className="text-xs">{testResult.effectiveBaseURL}</code>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Run a test to see proxy chain results</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Code */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generated Configuration</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(configCode)}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <pre className="p-3 rounded-lg bg-muted text-xs">{configCode}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
