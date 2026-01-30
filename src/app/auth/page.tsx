'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Play,
  RefreshCw,
  Lock,
  Unlock,
  Cloud,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeBlock } from '@/components/ui/code-block';

interface AuthStatus {
  gatewayAuth: 'configured' | 'oidc' | 'none';
  customAuth: 'configured' | 'none';
  byokConfigured: string[];
  sandboxAuth: 'oidc' | 'token' | 'none';
}

interface TestResult {
  success: boolean;
  message: string;
  details?: object;
  latencyMs?: number;
}

export default function AuthPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);

  // BYOK form state
  const [byokProvider, setByokProvider] = useState('openai');
  const [byokApiKey, setByokApiKey] = useState('');
  const [byokTestResult, setByokTestResult] = useState<TestResult | null>(null);
  const [byokTesting, setByokTesting] = useState(false);

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  async function fetchAuthStatus() {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch {
      setAuthStatus({
        gatewayAuth: 'none',
        customAuth: 'none',
        byokConfigured: [],
        sandboxAuth: 'none',
      });
    }
  }

  async function testGatewayAuth() {
    setTesting(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/auth/test-gateway');
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message,
        details: data.details,
        latencyMs: Date.now() - startTime,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        latencyMs: Date.now() - startTime,
      });
    } finally {
      setTesting(false);
    }
  }

  async function testByokAuth() {
    if (!byokApiKey) return;

    setByokTesting(true);
    setByokTestResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/auth/test-byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: byokProvider, apiKey: byokApiKey }),
      });
      const data = await response.json();
      setByokTestResult({
        success: data.success,
        message: data.message,
        details: data.details,
        latencyMs: Date.now() - startTime,
      });
    } catch (error) {
      setByokTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        latencyMs: Date.now() - startTime,
      });
    } finally {
      setByokTesting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function redactKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Auth & BYOK Lab</h1>
              <p className="text-sm text-muted-foreground">
                Configure and test authentication patterns for AI Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Auth Status Overview */}
        <Card className="mb-6 border-0 shadow-lg shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              Runtime Auth Status
            </CardTitle>
            <CardDescription>Current authentication configuration detected at runtime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                {
                  label: 'AI Gateway',
                  value: authStatus?.gatewayAuth,
                  text: authStatus?.gatewayAuth === 'oidc' ? 'OIDC Token' : authStatus?.gatewayAuth === 'configured' ? 'API Key' : 'Not configured',
                  active: authStatus?.gatewayAuth !== 'none',
                },
                {
                  label: 'Custom Provider',
                  value: authStatus?.customAuth,
                  text: authStatus?.customAuth === 'configured' ? 'Configured' : 'Not configured',
                  active: authStatus?.customAuth !== 'none',
                },
                {
                  label: 'BYOK',
                  value: authStatus?.byokConfigured,
                  text: authStatus?.byokConfigured?.join(', ') || 'None configured',
                  active: authStatus?.byokConfigured && authStatus.byokConfigured.length > 0,
                },
                {
                  label: 'Sandbox',
                  value: authStatus?.sandboxAuth,
                  text: authStatus?.sandboxAuth === 'oidc' ? 'OIDC' : authStatus?.sandboxAuth === 'token' ? 'Token' : 'Not configured',
                  active: authStatus?.sandboxAuth !== 'none',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                  {item.active ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchAuthStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button onClick={testGatewayAuth} disabled={testing} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25">
                {testing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test Gateway Auth
              </Button>
            </div>

            {testResult && (
              <Alert className={`border-0 ${testResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>{testResult.success ? 'Success' : 'Failed'}</AlertTitle>
                <AlertDescription>
                  {testResult.message}
                  {testResult.latencyMs && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {testResult.latencyMs}ms
                    </Badge>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* BYOK Configuration */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                Request-scoped BYOK
              </CardTitle>
              <CardDescription>
                Test bringing your own API key for a specific request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Provider</Label>
                <Select value={byokProvider} onValueChange={setByokProvider}>
                  <SelectTrigger className="h-10 bg-muted/50 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="bedrock">AWS Bedrock</SelectItem>
                    <SelectItem value="vertex">Google Vertex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
                <Input
                  type="password"
                  placeholder={`Enter your ${byokProvider} API key`}
                  value={byokApiKey}
                  onChange={(e) => setByokApiKey(e.target.value)}
                  className="h-10 bg-muted/50 border-0"
                />
              </div>

              <Button onClick={testByokAuth} disabled={byokTesting || !byokApiKey} className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25">
                {byokTesting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test BYOK Request
              </Button>

              {byokTestResult && (
                <Alert className={`border-0 ${byokTestResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {byokTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertTitle>{byokTestResult.success ? 'Success' : 'Failed'}</AlertTitle>
                  <AlertDescription>{byokTestResult.message}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Code Example</h4>
                <CodeBlock
                  language="typescript"
                  filename="chat.ts"
                  code={`const { text } = await generateText({
  model: gateway('${byokProvider === 'openai' ? 'openai/gpt-4o' : byokProvider === 'anthropic' ? 'anthropic/claude-sonnet-4' : 'google/gemini-2.0-flash'}'),
  prompt: 'Hello!',
  providerOptions: {
    gateway: {
      byok: {
        ${byokProvider}: [{ apiKey: '${redactKey(byokApiKey)}' }],
      },
    },
  },
});`}
                  maxHeight="220px"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    copyToClipboard(`providerOptions: {
  gateway: {
    byok: {
      ${byokProvider}: [{ apiKey: '${byokApiKey}' }],
    },
  },
}`)
                  }
                >
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  Copy Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Auth Patterns */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Enterprise Auth Patterns
              </CardTitle>
              <CardDescription>
                Common authentication patterns for enterprise deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="api-key">
                <TabsList className="grid w-full grid-cols-4 h-10">
                  <TabsTrigger value="api-key" className="text-xs">API Key</TabsTrigger>
                  <TabsTrigger value="oidc" className="text-xs">OIDC</TabsTrigger>
                  <TabsTrigger value="oauth" className="text-xs">OAuth</TabsTrigger>
                  <TabsTrigger value="aws" className="text-xs">AWS</TabsTrigger>
                </TabsList>

                <TabsContent value="api-key" className="mt-5 space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <Key className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">API Key Authentication</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          The simplest auth method. Set AI_GATEWAY_API_KEY in your environment.
                        </p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock
                    language="bash"
                    filename=".env.local"
                    code={`# .env.local
AI_GATEWAY_API_KEY=your_api_key

# The SDK reads this automatically
import { generateText } from 'ai';
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Hello!',
});`}
                    maxHeight="200px"
                  />
                </TabsContent>

                <TabsContent value="oidc" className="mt-5 space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/10">
                    <div className="flex items-start gap-3">
                      <Cloud className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Vercel OIDC Token</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatic auth when deployed to Vercel. Use &quot;vercel env pull&quot; for local dev.
                        </p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock
                    language="bash"
                    filename="terminal"
                    code={`# Link your project
vercel link

# Pull OIDC token for local dev
vercel env pull

# No API key needed in code!
import { generateText } from 'ai';
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Hello!',
});`}
                    maxHeight="220px"
                  />
                </TabsContent>

                <TabsContent value="oauth" className="mt-5 space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/10">
                    <div className="flex items-start gap-3">
                      <Unlock className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">OAuth 2.0 Client Credentials</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          For enterprise identity providers (Azure AD, Okta, etc.)
                        </p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock
                    language="typescript"
                    filename="oauth-gateway.ts"
                    code={`// Custom fetch with OAuth token injection
const oauthFetch = async (input, init) => {
  const token = await fetchOAuthToken({
    tokenUrl: 'https://login.microsoftonline.com/.../token',
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    scope: 'api://ai-gateway/.default',
  });

  const headers = new Headers(init?.headers);
  headers.set('Authorization', \`Bearer \${token}\`);
  return fetch(input, { ...init, headers });
};

const gateway = createGateway({ fetch: oauthFetch });`}
                    maxHeight="280px"
                  />
                </TabsContent>

                <TabsContent value="aws" className="mt-5 space-y-4">
                  <div className="p-4 rounded-xl bg-orange-500/10">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">AWS Default Credential Chain</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          For Bedrock access via IAM roles, instance profiles, or env vars.
                        </p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock
                    language="typescript"
                    filename="aws-bedrock.ts"
                    code={`// AWS credential chain for Bedrock BYOK
import { fromEnv, fromIni, fromInstanceMetadata } from '@aws-sdk/credential-providers';

const credentials = await fromEnv()()
  .catch(() => fromIni()())
  .catch(() => fromInstanceMetadata()());

const { text } = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Hello!',
  providerOptions: {
    gateway: {
      byok: {
        bedrock: [{
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          region: 'us-east-1',
        }],
      },
    },
  },
});`}
                    maxHeight="340px"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Headers Preview */}
        <Card className="mt-6 border-0 shadow-lg shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Headers Preview</CardTitle>
            <CardDescription>
              These headers will be sent with your request (secrets redacted)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="json"
              code={JSON.stringify({
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authStatus?.gatewayAuth === 'configured' ? 'sk-...xxxx' : authStatus?.gatewayAuth === 'oidc' ? 'oidc_token_...xxxx' : '[NOT SET]'}`,
                ...(byokApiKey ? { [`X-BYOK-${byokProvider}`]: redactKey(byokApiKey) } : {}),
                "User-Agent": "ai-sdk/6.0",
                "X-Request-ID": "req_example123"
              }, null, 2)}
              maxHeight="180px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
