/**
 * AI Gateway Provider Factory
 * Creates configured instances of the Vercel AI Gateway provider
 */
import { createGateway, gateway } from '@ai-sdk/gateway';
import type { GatewayProviderOptions } from '@ai-sdk/gateway';

export interface GatewayConfig {
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  // Custom fetch for proxy chaining / middleware
  fetch?: typeof fetch;
}

/**
 * Create a configured AI Gateway client
 * Supports corporate proxy, custom headers, and baseURL override
 */
export function getGatewayClient(config: GatewayConfig = {}) {
  const {
    apiKey = process.env.AI_GATEWAY_API_KEY,
    baseURL = process.env.AI_GATEWAY_BASE_URL || undefined,
    headers = {},
    fetch: customFetch,
  } = config;

  // Add corporate proxy headers if configured
  const corpProxyAuthHeader = process.env.CORP_PROXY_AUTH_HEADER;
  if (corpProxyAuthHeader) {
    headers['Proxy-Authorization'] = corpProxyAuthHeader;
  }

  return createGateway({
    apiKey,
    baseURL,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    fetch: customFetch,
  });
}

/**
 * Get a gateway model instance for a specific model ID
 * Uses the default gateway provider or a custom one
 */
export function gatewayModel(
  modelId: string,
  config?: GatewayConfig
) {
  if (config) {
    const client = getGatewayClient(config);
    return client(modelId);
  }
  // Use default gateway provider
  return gateway(modelId);
}

/**
 * Get embedding model from gateway
 */
export function gatewayEmbeddingModel(
  modelId: string,
  config?: GatewayConfig
) {
  if (config) {
    const client = getGatewayClient(config);
    return client.textEmbeddingModel(modelId);
  }
  return gateway.textEmbeddingModel(modelId);
}

/**
 * Build gateway provider options for BYOK, routing, and metadata
 */
export function buildGatewayProviderOptions(options: {
  byok?: GatewayProviderOptions['byok'];
  order?: string[];
  only?: string[];
  models?: string[];
  user?: string;
  tags?: string[];
  zeroDataRetention?: boolean;
}): { gateway: GatewayProviderOptions } {
  return {
    gateway: {
      byok: options.byok,
      order: options.order,
      only: options.only,
      models: options.models,
      user: options.user,
      tags: options.tags,
      zeroDataRetention: options.zeroDataRetention,
    },
  };
}

/**
 * Default export: the standard gateway provider
 */
export { gateway };
export { createGateway };
export type { GatewayProviderOptions };
