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
  Zap,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'AI Gateway',
    description: 'Browse 100+ models with pricing, endpoints, and capabilities',
    href: '/gateway',
    icon: Database,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Chat Playground',
    description: 'Chat with models via Gateway, self-hosted, or sandbox',
    href: '/playground',
    icon: MessageSquare,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Auth Patterns',
    description: 'BYOK, OIDC, bearer tokens, OAuth patterns',
    href: '/auth',
    icon: Key,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Proxy Config',
    description: 'Corporate proxy, custom baseURL, headers',
    href: '/proxy',
    icon: Network,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    title: 'Workflows',
    description: 'Durable agents with streaming progress',
    href: '/workflows',
    icon: Workflow,
    badge: 'Beta',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Sandbox',
    description: 'OpenAI-compatible mock servers',
    href: '/sandbox',
    icon: Box,
    badge: 'Beta',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Traces',
    description: 'Latency, cost estimation, export',
    href: '/traces',
    icon: Activity,
    gradient: 'from-fuchsia-500 to-pink-500',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Vercel AI Platform Demo
              </h1>
              <p className="text-muted-foreground mt-1">
                AI SDK + Gateway + Enterprise Patterns
              </p>
            </div>
          </div>

          <Card className="border-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Getting Started</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">AI_GATEWAY_API_KEY</code> to{' '}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">.env.local</code> to enable chat functionality.
                  </p>
                  <a
                    href="https://vercel.com/ai-gateway/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Get your API key <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">
                    1
                  </div>
                  <span className="font-semibold">Configure</span>
                </div>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg font-mono overflow-x-auto">
                  AI_GATEWAY_API_KEY=key
                </pre>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">
                    2
                  </div>
                  <span className="font-semibold">Browse Models</span>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/gateway">
                    Model Explorer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">
                    3
                  </div>
                  <span className="font-semibold">Start Chatting</span>
                </div>
                <Button asChild className="w-full shadow-lg shadow-primary/25">
                  <Link href="/playground">
                    Open Playground <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href}>
                <Card className="group h-full border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{feature.title}</CardTitle>
                          {feature.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                              {feature.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
