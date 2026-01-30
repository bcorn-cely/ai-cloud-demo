/**
 * Telemetry & Trace Store
 * Captures traces from model calls for inspection and export
 */
import { nanoid } from 'nanoid';

export interface ModelPricing {
  input: string;  // Cost per input token
  output: string; // Cost per output token
  inputTiers?: { cost: string; min: number; max?: number }[];
  outputTiers?: { cost: string; min: number; max?: number }[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TraceRecord {
  traceId: string;
  timestamp: string;
  providerMode: 'gateway' | 'custom' | 'sandbox';
  model: string;

  // Request info
  requestPayload: {
    messages: unknown[];
    tools?: unknown[];
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };

  // Response info
  response: {
    text?: string;
    toolCalls?: unknown[];
    finishReason?: string;
    usage?: TokenUsage;
    raw?: unknown;
  };

  // Timing
  latencyMs: number;
  startTime: string;
  endTime: string;

  // Cost estimation
  pricing?: ModelPricing;
  estimatedCost?: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };

  // Model metadata
  modelMetadata?: {
    id: string;
    name?: string;
    contextWindow?: number;
    maxTokens?: number;
    tags?: string[];
    [key: string]: unknown;
  };

  // Endpoint metadata (if available)
  endpointMetadata?: {
    providerName?: string;
    supportedParameters?: string[];
    [key: string]: unknown;
  };

  // Configuration used
  config: {
    baseURL?: string;
    byokApplied?: boolean;
    byokProvider?: string;
    proxyApplied?: boolean;
    headers?: Record<string, string>;
  };

  // Error info (if any)
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

// In-memory trace store (in production, use a proper database)
const traceStore: TraceRecord[] = [];
const MAX_TRACES = 1000;

/**
 * Create a new trace record
 */
export function createTrace(data: Omit<TraceRecord, 'traceId' | 'timestamp'>): TraceRecord {
  const trace: TraceRecord = {
    traceId: nanoid(12),
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Add to store (with size limit)
  traceStore.unshift(trace);
  if (traceStore.length > MAX_TRACES) {
    traceStore.pop();
  }

  return trace;
}

/**
 * Get all traces
 */
export function getTraces(options?: {
  limit?: number;
  offset?: number;
  providerMode?: 'gateway' | 'custom' | 'sandbox';
  model?: string;
}): TraceRecord[] {
  let traces = [...traceStore];

  if (options?.providerMode) {
    traces = traces.filter(t => t.providerMode === options.providerMode);
  }

  if (options?.model) {
    traces = traces.filter(t => t.model.includes(options.model!));
  }

  const offset = options?.offset || 0;
  const limit = options?.limit || 100;

  return traces.slice(offset, offset + limit);
}

/**
 * Get a single trace by ID
 */
export function getTrace(traceId: string): TraceRecord | undefined {
  return traceStore.find(t => t.traceId === traceId);
}

/**
 * Clear all traces
 */
export function clearTraces(): void {
  traceStore.length = 0;
}

/**
 * Export traces as JSON
 */
export function exportTracesJSON(): string {
  return JSON.stringify(traceStore, null, 2);
}

/**
 * Calculate estimated cost from usage and pricing
 */
export function calculateCost(
  usage: TokenUsage,
  pricing: ModelPricing
): { inputCost: number; outputCost: number; totalCost: number; currency: string } {
  const getRate = (
    tokens: number,
    baseRate: string,
    tiers?: { cost: string; min: number; max?: number }[]
  ): number => {
    if (tiers && tiers.length > 0) {
      // Find the applicable tier
      const tier = tiers.find(t =>
        tokens >= t.min && (t.max === undefined || tokens < t.max)
      ) || tiers[tiers.length - 1];
      return parseFloat(tier.cost);
    }
    return parseFloat(baseRate);
  };

  const inputRate = getRate(usage.promptTokens, pricing.input, pricing.inputTiers);
  const outputRate = getRate(usage.completionTokens, pricing.output, pricing.outputTiers);

  const inputCost = usage.promptTokens * inputRate;
  const outputCost = usage.completionTokens * outputRate;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  };
}

/**
 * Get trace statistics
 */
export function getTraceStats(): {
  totalTraces: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  byProvider: Record<string, { count: number; tokens: number; cost: number }>;
  byModel: Record<string, { count: number; tokens: number; cost: number }>;
} {
  const stats = {
    totalTraces: traceStore.length,
    totalTokens: 0,
    totalCost: 0,
    avgLatencyMs: 0,
    byProvider: {} as Record<string, { count: number; tokens: number; cost: number }>,
    byModel: {} as Record<string, { count: number; tokens: number; cost: number }>,
  };

  let totalLatency = 0;

  for (const trace of traceStore) {
    const tokens = trace.response.usage?.totalTokens || 0;
    const cost = trace.estimatedCost?.totalCost || 0;

    stats.totalTokens += tokens;
    stats.totalCost += cost;
    totalLatency += trace.latencyMs;

    // By provider
    if (!stats.byProvider[trace.providerMode]) {
      stats.byProvider[trace.providerMode] = { count: 0, tokens: 0, cost: 0 };
    }
    stats.byProvider[trace.providerMode].count++;
    stats.byProvider[trace.providerMode].tokens += tokens;
    stats.byProvider[trace.providerMode].cost += cost;

    // By model
    if (!stats.byModel[trace.model]) {
      stats.byModel[trace.model] = { count: 0, tokens: 0, cost: 0 };
    }
    stats.byModel[trace.model].count++;
    stats.byModel[trace.model].tokens += tokens;
    stats.byModel[trace.model].cost += cost;
  }

  stats.avgLatencyMs = stats.totalTraces > 0 ? totalLatency / stats.totalTraces : 0;

  return stats;
}

/**
 * Create a trace context for capturing request/response data
 */
export function createTraceContext() {
  const startTime = new Date();

  return {
    startTime: startTime.toISOString(),

    complete(data: {
      providerMode: 'gateway' | 'custom' | 'sandbox';
      model: string;
      requestPayload: TraceRecord['requestPayload'];
      response: TraceRecord['response'];
      pricing?: ModelPricing;
      modelMetadata?: TraceRecord['modelMetadata'];
      endpointMetadata?: TraceRecord['endpointMetadata'];
      config: TraceRecord['config'];
      error?: TraceRecord['error'];
    }): TraceRecord {
      const endTime = new Date();
      const latencyMs = endTime.getTime() - startTime.getTime();

      let estimatedCost: TraceRecord['estimatedCost'];
      if (data.pricing && data.response.usage) {
        estimatedCost = calculateCost(data.response.usage, data.pricing);
      }

      return createTrace({
        ...data,
        latencyMs,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        estimatedCost,
      });
    },
  };
}
