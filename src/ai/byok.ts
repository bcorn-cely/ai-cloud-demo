/**
 * BYOK (Bring Your Own Key) Configuration Builder
 * Builds providerOptions.gateway.byok object from various sources
 */
import type { GatewayProviderOptions } from '@ai-sdk/gateway';

export interface OpenAICredentials {
  apiKey: string;
}

export interface AnthropicCredentials {
  apiKey: string;
}

export interface BedrockCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  sessionToken?: string;
}

export interface VertexCredentials {
  project: string;
  location: string;
  googleCredentials: {
    privateKey: string;
    clientEmail: string;
  };
}

export interface BYOKConfig {
  openai?: OpenAICredentials[];
  anthropic?: AnthropicCredentials[];
  bedrock?: BedrockCredentials[];
  vertex?: VertexCredentials[];
}

/**
 * Build BYOK configuration from environment variables
 */
export function buildBYOKFromEnv(): BYOKConfig {
  const config: BYOKConfig = {};

  // OpenAI
  if (process.env.BYOK_OPENAI_API_KEY) {
    config.openai = [{ apiKey: process.env.BYOK_OPENAI_API_KEY }];
  }

  // Anthropic
  if (process.env.BYOK_ANTHROPIC_API_KEY) {
    config.anthropic = [{ apiKey: process.env.BYOK_ANTHROPIC_API_KEY }];
  }

  // Bedrock
  if (process.env.BYOK_BEDROCK_ACCESS_KEY_ID && process.env.BYOK_BEDROCK_SECRET_ACCESS_KEY) {
    config.bedrock = [{
      accessKeyId: process.env.BYOK_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.BYOK_BEDROCK_SECRET_ACCESS_KEY,
      region: process.env.BYOK_BEDROCK_REGION || 'us-east-1',
    }];
  }

  // Vertex
  if (
    process.env.BYOK_VERTEX_PROJECT &&
    process.env.BYOK_VERTEX_CLIENT_EMAIL &&
    process.env.BYOK_VERTEX_PRIVATE_KEY
  ) {
    config.vertex = [{
      project: process.env.BYOK_VERTEX_PROJECT,
      location: process.env.BYOK_VERTEX_LOCATION || 'us-central1',
      googleCredentials: {
        clientEmail: process.env.BYOK_VERTEX_CLIENT_EMAIL,
        privateKey: process.env.BYOK_VERTEX_PRIVATE_KEY,
      },
    }];
  }

  return config;
}

/**
 * Merge BYOK configs (request-scoped takes precedence)
 */
export function mergeBYOKConfigs(
  base: BYOKConfig,
  override: BYOKConfig
): BYOKConfig {
  return {
    openai: override.openai || base.openai,
    anthropic: override.anthropic || base.anthropic,
    bedrock: override.bedrock || base.bedrock,
    vertex: override.vertex || base.vertex,
  };
}

/**
 * Build the final providerOptions.gateway.byok object
 */
export function buildBYOKProviderOptions(
  config: BYOKConfig
): GatewayProviderOptions['byok'] {
  // Use a flexible type that matches the gateway provider options
  const byok: Record<string, unknown[]> = {};

  if (config.openai && config.openai.length > 0) {
    byok.openai = config.openai;
  }

  if (config.anthropic && config.anthropic.length > 0) {
    byok.anthropic = config.anthropic;
  }

  if (config.bedrock && config.bedrock.length > 0) {
    byok.bedrock = config.bedrock;
  }

  if (config.vertex && config.vertex.length > 0) {
    byok.vertex = config.vertex;
  }

  return Object.keys(byok).length > 0 ? byok as GatewayProviderOptions['byok'] : undefined;
}

/**
 * Build complete providerOptions with BYOK
 */
export function buildProviderOptionsWithBYOK(options: {
  envBYOK?: boolean;
  requestBYOK?: BYOKConfig;
  user?: string;
  tags?: string[];
}): { gateway: GatewayProviderOptions } | undefined {
  const { envBYOK = true, requestBYOK, user, tags } = options;

  let byokConfig: BYOKConfig = {};

  // Start with env-based BYOK if enabled
  if (envBYOK) {
    byokConfig = buildBYOKFromEnv();
  }

  // Merge with request-scoped BYOK
  if (requestBYOK) {
    byokConfig = mergeBYOKConfigs(byokConfig, requestBYOK);
  }

  const byok = buildBYOKProviderOptions(byokConfig);

  // Only return providerOptions if there's something to configure
  if (!byok && !user && !tags) {
    return undefined;
  }

  return {
    gateway: {
      byok,
      user,
      tags,
    },
  };
}

/**
 * Redact sensitive values from BYOK config for display
 */
export function redactBYOKConfig(config: BYOKConfig): BYOKConfig {
  const redact = (s: string) => s ? `${s.slice(0, 4)}...${s.slice(-4)}` : '';

  return {
    openai: config.openai?.map(c => ({ apiKey: redact(c.apiKey) })),
    anthropic: config.anthropic?.map(c => ({ apiKey: redact(c.apiKey) })),
    bedrock: config.bedrock?.map(c => ({
      accessKeyId: redact(c.accessKeyId),
      secretAccessKey: redact(c.secretAccessKey),
      region: c.region,
    })),
    vertex: config.vertex?.map(c => ({
      project: c.project,
      location: c.location,
      googleCredentials: {
        clientEmail: c.googleCredentials.clientEmail,
        privateKey: redact(c.googleCredentials.privateKey),
      },
    })),
  };
}

/**
 * Check if any BYOK credentials are configured
 */
export function hasBYOKConfigured(): {
  openai: boolean;
  anthropic: boolean;
  bedrock: boolean;
  vertex: boolean;
  any: boolean;
} {
  const hasOpenAI = !!process.env.BYOK_OPENAI_API_KEY;
  const hasAnthropic = !!process.env.BYOK_ANTHROPIC_API_KEY;
  const hasBedrock = !!(process.env.BYOK_BEDROCK_ACCESS_KEY_ID && process.env.BYOK_BEDROCK_SECRET_ACCESS_KEY);
  const hasVertex = !!(process.env.BYOK_VERTEX_PROJECT && process.env.BYOK_VERTEX_CLIENT_EMAIL && process.env.BYOK_VERTEX_PRIVATE_KEY);

  return {
    openai: hasOpenAI,
    anthropic: hasAnthropic,
    bedrock: hasBedrock,
    vertex: hasVertex,
    any: hasOpenAI || hasAnthropic || hasBedrock || hasVertex,
  };
}
