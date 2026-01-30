import Link from 'next/link';
import {
  MessageSquare,
  Database,
  Key,
  Network,
  Workflow,
  Box,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const features = [
  {
    title: 'AI Gateway + Model Discovery',
    description: 'Browse 100+ models, view pricing, endpoints, and capabilities',
    href: '/gateway',
    icon: Database,
    status: 'ready',
  },
  {
    title: 'Streaming Chat Playground',
    description: 'Chat with models via Gateway, self-hosted, or sandbox providers',
    href: '/playground',
    icon: MessageSquare,
    status: 'ready',
  },
  {
    title: 'BYOK & Auth Patterns',
    description: 'Request-scoped BYOK, OIDC, bearer tokens, OAuth patterns',
    href: '/auth',
    icon: Key,
    status: 'ready',
  },
  {
    title: 'Proxy & VPC Configuration',
    description: 'Corporate proxy, custom baseURL, chained headers',
    href: '/proxy',
    icon: Network,
    status: 'ready',
  },
  {
    title: 'Durable Workflows',
    description: 'Long-running agents with streaming progress',
    href: '/workflows',
    icon: Workflow,
    status: 'beta',
  },
  {
    title: 'Sandbox Mock Models',
    description: 'Spin up OpenAI-compatible mock servers',
    href: '/sandbox',
    icon: Box,
    status: 'beta',
  },
  {
    title: 'Request Telemetry',
    description: 'Traces, latency, cost estimation, export',
    href: '/traces',
    icon: Activity,
    status: 'ready',
  },
];

const scenarios = [
  {
    title: 'Strict On-Prem Model',
    description: 'Use a self-hosted model via OpenAI-compatible API in your VPC',
    icon: Shield,
    tags: ['self-hosted', 'VPC', 'compliance'],
  },
  {
    title: 'Gateway Hosted Model',
    description: 'Use AI Gateway with automatic provider selection',
    icon: Globe,
    tags: ['gateway', 'multi-provider', 'fallback'],
  },
  {
    title: 'BYOK OpenAI',
    description: 'Use your own OpenAI API key via AI Gateway',
    icon: Key,
    tags: ['byok', 'cost-control', 'credits'],
  },
  {
    title: 'Corporate Proxy',
    description: 'Route through enterprise proxy with custom headers',
    icon: Network,
    tags: ['proxy', 'enterprise', 'security'],
  },
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Vercel AI Platform Demo
            </h1>
            <p className="text-muted-foreground">
              AI SDK v6 + AI Gateway + Enterprise Patterns
            </p>
          </div>
        </div>

        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode Active</AlertTitle>
          <AlertDescription>
            No API keys configured. Using mock responses. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">AI_GATEWAY_API_KEY</code> to <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> for real model access.
          </AlertDescription>
        </Alert>
      </div>

      {/* Quick Start */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Configure Auth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Copy <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.example</code> to <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> and add your API key.
              </p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                AI_GATEWAY_API_KEY=your_key
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Explore Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Browse the AI Gateway model catalog to see available models, pricing, and capabilities.
              </p>
              <Button asChild size="sm">
                <Link href="/gateway">
                  Model Explorer <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Start Chatting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Open the playground to chat with models and inspect request/response details.
              </p>
              <Button asChild size="sm">
                <Link href="/playground">
                  Playground <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    {feature.status === 'beta' && (
                      <Badge variant="outline" className="text-xs">Beta</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Enterprise Scenarios */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Enterprise Scenarios</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <Card key={scenario.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <scenario.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{scenario.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{scenario.description}</CardDescription>
                <div className="flex flex-wrap gap-1">
                  {scenario.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* What's Included */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">What&apos;s Included</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">AI SDK v6</p>
                    <p className="text-xs text-muted-foreground">Latest AI SDK with streaming, tools, structured output</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vercel AI Gateway</p>
                    <p className="text-xs text-muted-foreground">Unified API for 100+ models with fallback routing</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">OpenAI-Compatible Provider</p>
                    <p className="text-xs text-muted-foreground">Self-hosted models via vLLM, TGI, Ollama, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Request-scoped BYOK</p>
                    <p className="text-xs text-muted-foreground">Bring your own keys for OpenAI, Anthropic, Bedrock, Vertex</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Workflow DevKit</p>
                    <p className="text-xs text-muted-foreground">Durable agents with automatic retries and streaming</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vercel Sandbox</p>
                    <p className="text-xs text-muted-foreground">Ephemeral VMs for running mock model servers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Full Request Inspection</p>
                    <p className="text-xs text-muted-foreground">View payloads, responses, traces, latency, cost</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Demo Mode</p>
                    <p className="text-xs text-muted-foreground">Works without real API keys using mock responses</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Next.js 16</Badge>
          <Badge>AI SDK v6</Badge>
          <Badge>@ai-sdk/gateway</Badge>
          <Badge>@ai-sdk/openai-compatible</Badge>
          <Badge>Workflow DevKit</Badge>
          <Badge>@vercel/sandbox</Badge>
          <Badge>TypeScript</Badge>
          <Badge>Tailwind CSS</Badge>
          <Badge>shadcn/ui</Badge>
        </div>
      </div>
    </div>
  );
}
