# Vercel AI Platform Demo

A comprehensive demo application showcasing enterprise AI patterns with Vercel's AI platform:

- **AI SDK v6** - Latest AI SDK with streaming, tools, and structured output
- **Vercel AI Gateway** - Unified API for 100+ models with fallback routing
- **BYOK (Bring Your Own Key)** - Request-scoped credentials for OpenAI, Anthropic, Bedrock, Vertex
- **OpenAI-Compatible Providers** - Self-hosted models via vLLM, TGI, Ollama
- **Workflow DevKit** - Durable agents with automatic retries
- **Vercel Sandbox** - Ephemeral VMs for running mock model servers

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Add your API keys:

```bash
# Required for real AI Gateway access
AI_GATEWAY_API_KEY=your_api_key_here

# Optional: BYOK credentials
BYOK_OPENAI_API_KEY=sk-...
BYOK_ANTHROPIC_API_KEY=sk-ant-...

# Optional: Custom/self-hosted endpoint
CUSTOM_OAI_BASE_URL=http://localhost:8000/v1
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

## Features

### Model Explorer (`/gateway`)

- Browse all AI Gateway models
- View pricing, capabilities, and tags
- Explore provider endpoints for each model
- Copy code snippets for quick integration

### Chat Playground (`/playground`)

- Chat with any model via AI Gateway
- Switch between Gateway, Self-hosted, and Sandbox providers
- View real-time request/response payloads
- Inspect traces with latency and cost estimation
- Enable tool calling for interactive demos

### Auth Lab (`/auth`)

- Test AI Gateway authentication
- Configure request-scoped BYOK
- View enterprise auth pattern examples
- Preview headers that will be sent

### Proxy Lab (`/proxy`)

- Configure corporate proxy settings
- Test baseURL overrides
- Simulate chained proxy hops
- Generate proxy configuration code

### Workflows (`/workflows`)

- Start durable chat agent workflows
- Run model evaluation jobs
- View real-time step progress
- Demonstrates sleep/resume pattern

### Sandbox (`/sandbox`)

- Spin up mock OpenAI-compatible servers
- Get publicly accessible domain URLs
- Use mock models in the playground
- View server logs in real-time

### Traces (`/traces`)

- View all request traces
- Analyze latency and token usage
- Calculate cost estimates
- Export traces as JSON

## Demo Mode

The app works without any API keys using **demo mode**. This provides:

- Simulated model responses
- Mock model catalog
- All UI features functional

To use real models, set `AI_GATEWAY_API_KEY` in your environment.

## Architecture

```
src/
├── ai/                    # AI provider utilities
│   ├── gateway.ts         # AI Gateway client factory
│   ├── custom-openai.ts   # OpenAI-compatible provider
│   ├── byok.ts            # BYOK configuration builder
│   ├── auth-strategies.ts # Auth pattern helpers
│   ├── telemetry.ts       # Trace capture and storage
│   ├── pricing.ts         # Cost calculation utilities
│   └── demo-provider.ts   # Mock responses for demo mode
├── app/
│   ├── page.tsx           # Home / quickstart
│   ├── playground/        # Chat playground
│   ├── gateway/           # Model explorer
│   ├── auth/              # Auth lab
│   ├── proxy/             # Proxy lab
│   ├── workflows/         # Workflow dashboard
│   ├── sandbox/           # Sandbox control panel
│   ├── traces/            # Request telemetry
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
└── types/                 # TypeScript definitions
```

## Enterprise Scenarios

### 1. Strict On-Prem Model

Use a self-hosted model in your VPC:

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const onPrem = createOpenAICompatible({
  name: 'on-prem',
  baseURL: 'http://llm.internal:8000/v1',
});

const { text } = await generateText({
  model: onPrem('llama-3-70b'),
  prompt: 'Analyze this internal document...',
});
```

### 2. Gateway with BYOK

Use your own API keys via AI Gateway:

```typescript
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text } = await generateText({
  model: gateway('openai/gpt-4o'),
  prompt: 'Hello!',
  providerOptions: {
    gateway: {
      byok: {
        openai: [{ apiKey: process.env.MY_OPENAI_KEY }],
      },
    },
  },
});
```

### 3. Corporate Proxy

Route through enterprise proxy:

```typescript
import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
  baseURL: 'https://proxy.corp.example.com/ai-gateway',
  headers: {
    'Proxy-Authorization': 'Basic ...',
  },
});
```

### 4. Durable Agent Workflow

```typescript
// workflows/chat/workflow.ts
export async function chatAgent(messages: Message[]) {
  "use workflow";

  const response = await generateResponse(messages);

  if (response.requiresApproval) {
    await waitForEvent('user_approved');
  }

  return response;
}
```

## Tech Stack

- **Next.js 16** - App Router, Server Components
- **AI SDK v6** - `ai`, `@ai-sdk/gateway`, `@ai-sdk/openai-compatible`
- **Workflow DevKit** - `workflow`, `@workflow/ai`
- **Vercel Sandbox** - `@vercel/sandbox`
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI components
- **Recharts** - Charts and graphs

## Troubleshooting

### No API Key

If you see "Demo Mode Active", add `AI_GATEWAY_API_KEY` to `.env.local`.

### OIDC Token

For Vercel deployments, use OIDC:

```bash
vercel link
vercel env pull
```

### Sandbox Auth

Sandbox requires Vercel project context. Either:
- Run `vercel link` and `vercel env pull`
- Or set `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `VERCEL_OIDC_TOKEN`

### Custom Provider Issues

Ensure your self-hosted endpoint:
- Implements `/v1/chat/completions`
- Returns OpenAI-compatible response format
- Is accessible from your network

## License

MIT
