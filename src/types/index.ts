/**
 * Shared Types
 */

// Provider modes
export type ProviderMode = 'gateway' | 'custom' | 'sandbox';

// Model types from AI Gateway
export interface GatewayModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  name: string;
  description?: string;
  context_window: number;
  max_tokens: number;
  type: 'language' | 'embedding' | 'image';
  tags?: string[];
  pricing?: {
    input: string;
    output?: string;
    input_tiers?: Array<{ cost: string; min: number; max?: number }>;
    output_tiers?: Array<{ cost: string; min: number; max?: number }>;
    input_cache_read?: string;
    input_cache_write?: string;
    image?: string;
  };
}

export interface GatewayModelsResponse {
  object: 'list';
  data: GatewayModel[];
}

// Endpoint types
export interface ModelEndpoint {
  name: string;
  model_name: string;
  context_length: number;
  max_completion_tokens: number;
  provider_name: string;
  tag: string;
  supported_parameters: string[];
  status: number;
  pricing: {
    prompt: string;
    completion: string;
    prompt_tiers?: Array<{ cost: string; min: number; max?: number }>;
    completion_tiers?: Array<{ cost: string; min: number; max?: number }>;
    input_cache_read?: string;
    input_cache_write?: string;
    [key: string]: unknown;
  };
  supports_implicit_caching: boolean;
}

export interface ModelEndpointsResponse {
  data: {
    id: string;
    name: string;
    created: number;
    description?: string;
    architecture: {
      modality: string;
      input_modalities: string[];
      output_modalities: string[];
    };
    endpoints: ModelEndpoint[];
  };
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
}

// Chat configuration
export interface ChatConfig {
  providerMode: ProviderMode;
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  tools?: boolean;
  structuredOutput?: boolean;
  stream?: boolean;
}

// Gateway configuration
export interface GatewayConfigOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  byok?: {
    provider: string;
    credentials: Record<string, string>;
  };
  user?: string;
  tags?: string[];
}

// Custom provider configuration
export interface CustomProviderConfig {
  baseURL: string;
  apiKey?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
}

// Sandbox state
export interface SandboxState {
  sandboxId: string | null;
  status: 'idle' | 'creating' | 'running' | 'stopping' | 'stopped' | 'error';
  domain: string | null;
  port: number;
  logs: string[];
  error?: string;
}

// Workflow run state
export interface WorkflowRunState {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  steps: WorkflowStep[];
  result?: unknown;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

// API request/response shapes
export interface ChatAPIRequest {
  messages: ChatMessage[];
  config: ChatConfig;
  gatewayConfig?: GatewayConfigOptions;
  customConfig?: CustomProviderConfig;
  sandboxConfig?: {
    domain: string;
  };
}

export interface ChatAPIResponse {
  traceId: string;
  text?: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  latencyMs: number;
  modelMetadata?: GatewayModel;
  estimatedCost?: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };
  config: {
    providerMode: ProviderMode;
    model: string;
    baseURL?: string;
    byokApplied?: boolean;
  };
}

// Trace types (re-export from telemetry)
export type { TraceRecord } from '@/ai/telemetry';
