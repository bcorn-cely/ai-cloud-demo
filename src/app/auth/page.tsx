'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    // Fetch auth status from API
    fetchAuthStatus();
  }, []);

  async function fetchAuthStatus() {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch {
      // Use demo status
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
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Auth & BYOK Lab</h1>
        <p className="text-muted-foreground mt-1">
          Configure and test authentication patterns for AI Gateway
        </p>
      </div>

      {/* Auth Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Runtime Auth Status
          </CardTitle>
          <CardDescription>Current authentication configuration detected at runtime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {authStatus?.gatewayAuth !== 'none' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">AI Gateway</p>
                <p className="text-xs text-muted-foreground">
                  {authStatus?.gatewayAuth === 'oidc'
                    ? 'OIDC Token'
                    : authStatus?.gatewayAuth === 'configured'
                    ? 'API Key'
                    : 'Not configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {authStatus?.customAuth !== 'none' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Custom Provider</p>
                <p className="text-xs text-muted-foreground">
                  {authStatus?.customAuth === 'configured' ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {authStatus?.byokConfigured && authStatus.byokConfigured.length > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">BYOK</p>
                <p className="text-xs text-muted-foreground">
                  {authStatus?.byokConfigured?.join(', ') || 'None configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {authStatus?.sandboxAuth !== 'none' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Sandbox</p>
                <p className="text-xs text-muted-foreground">
                  {authStatus?.sandboxAuth === 'oidc'
                    ? 'OIDC'
                    : authStatus?.sandboxAuth === 'token'
                    ? 'Token'
                    : 'Not configured'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAuthStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button size="sm" onClick={testGatewayAuth} disabled={testing}>
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Test Gateway Auth
            </Button>
          </div>

          {testResult && (
            <Alert className={`mt-4 ${testResult.success ? 'border-green-500' : 'border-red-500'}`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertTitle>{testResult.success ? 'Success' : 'Failed'}</AlertTitle>
              <AlertDescription>
                {testResult.message}
                {testResult.latencyMs && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({testResult.latencyMs}ms)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BYOK Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Request-scoped BYOK
            </CardTitle>
            <CardDescription>
              Test bringing your own API key for a specific request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={byokProvider} onValueChange={setByokProvider}>
                <SelectTrigger>
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
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={`Enter your ${byokProvider} API key`}
                value={byokApiKey}
                onChange={(e) => setByokApiKey(e.target.value)}
              />
            </div>

            <Button onClick={testByokAuth} disabled={byokTesting || !byokApiKey} className="w-full">
              {byokTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Test BYOK Request
            </Button>

            {byokTestResult && (
              <Alert className={byokTestResult.success ? 'border-green-500' : 'border-red-500'}>
                {byokTestResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>{byokTestResult.success ? 'Success' : 'Failed'}</AlertTitle>
                <AlertDescription>{byokTestResult.message}</AlertDescription>
              </Alert>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Code Example</h4>
              <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
{`const { text } = await generateText({
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
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
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
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Auth Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Enterprise Auth Patterns
            </CardTitle>
            <CardDescription>
              Common authentication patterns for enterprise deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="api-key">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="api-key">API Key</TabsTrigger>
                <TabsTrigger value="oidc">OIDC</TabsTrigger>
                <TabsTrigger value="oauth">OAuth</TabsTrigger>
                <TabsTrigger value="aws">AWS</TabsTrigger>
              </TabsList>

              <TabsContent value="api-key" className="mt-4 space-y-3">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertTitle>API Key Authentication</AlertTitle>
                  <AlertDescription>
                    The simplest auth method. Set AI_GATEWAY_API_KEY in your environment.
                  </AlertDescription>
                </Alert>
                <pre className="p-3 rounded-lg bg-muted text-xs">
{`# .env.local
AI_GATEWAY_API_KEY=your_api_key

# The SDK reads this automatically
import { generateText } from 'ai';
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Hello!',
});`}
                </pre>
              </TabsContent>

              <TabsContent value="oidc" className="mt-4 space-y-3">
                <Alert>
                  <Cloud className="h-4 w-4" />
                  <AlertTitle>Vercel OIDC Token</AlertTitle>
                  <AlertDescription>
                    Automatic auth when deployed to Vercel. Use &quot;vercel env pull&quot; for local dev.
                  </AlertDescription>
                </Alert>
                <pre className="p-3 rounded-lg bg-muted text-xs">
{`# Link your project
vercel link

# Pull OIDC token for local dev
vercel env pull

# No API key needed in code!
import { generateText } from 'ai';
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Hello!',
});`}
                </pre>
              </TabsContent>

              <TabsContent value="oauth" className="mt-4 space-y-3">
                <Alert>
                  <Unlock className="h-4 w-4" />
                  <AlertTitle>OAuth 2.0 Client Credentials</AlertTitle>
                  <AlertDescription>
                    For enterprise identity providers (Azure AD, Okta, etc.)
                  </AlertDescription>
                </Alert>
                <pre className="p-3 rounded-lg bg-muted text-xs">
{`// Custom fetch with OAuth token injection
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
                </pre>
              </TabsContent>

              <TabsContent value="aws" className="mt-4 space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>AWS Default Credential Chain</AlertTitle>
                  <AlertDescription>
                    For Bedrock access via IAM roles, instance profiles, or env vars.
                  </AlertDescription>
                </Alert>
                <pre className="p-3 rounded-lg bg-muted text-xs">
{`// AWS credential chain for Bedrock BYOK
import { fromEnv, fromIni, fromInstanceMetadata } from '@aws-sdk/credential-providers';

const credentials = await fromEnv()() // Try env vars first
  .catch(() => fromIni()())           // Then ~/.aws/credentials
  .catch(() => fromInstanceMetadata()()); // Then EC2 metadata

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
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Headers that will be sent */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Headers Preview</CardTitle>
          <CardDescription>
            These headers will be sent with your request (secrets redacted)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <pre className="p-3 rounded-lg bg-muted text-xs">
{`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${authStatus?.gatewayAuth === 'configured' ? 'sk-...xxxx' : authStatus?.gatewayAuth === 'oidc' ? 'oidc_token_...xxxx' : '[NOT SET]'}",
  ${byokApiKey ? `"X-BYOK-${byokProvider}": "${redactKey(byokApiKey)}",` : ''}
  "User-Agent": "ai-sdk/6.0",
  "X-Request-ID": "req_${Math.random().toString(36).slice(2, 10)}"
}`}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
