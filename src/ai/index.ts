/**
 * AI Module Index
 * Re-exports all AI-related utilities
 */

// Gateway provider
export {
  getGatewayClient,
  gatewayModel,
  gatewayEmbeddingModel,
  buildGatewayProviderOptions,
  gateway,
  createGateway,
  type GatewayConfig,
} from './gateway';

// Custom OpenAI-compatible provider
export {
  getCustomOpenAIProvider,
  getCustomOpenAIProviderWithOAuth,
  customModel,
  createChainedProxyFetch,
  mockADTokenFetcher,
  awsDefaultCredentialChain,
  createOpenAICompatible,
  type CustomOpenAIConfig,
} from './custom-openai';

// BYOK utilities
export {
  buildBYOKFromEnv,
  mergeBYOKConfigs,
  buildBYOKProviderOptions,
  buildProviderOptionsWithBYOK,
  redactBYOKConfig,
  hasBYOKConfigured,
  type BYOKConfig,
  type OpenAICredentials,
  type AnthropicCredentials,
  type BedrockCredentials,
  type VertexCredentials,
} from './byok';

// Auth strategies
export {
  buildAuthHeaders,
  detectAuthMethods,
  fetchOAuthToken,
  createOAuthFetch,
  resolveAWSCredentials,
  getAuthStatusSummary,
  type AuthMethod,
  type AuthConfig,
  type AuthResult,
} from './auth-strategies';

// Telemetry
export {
  createTrace,
  getTraces,
  getTrace,
  clearTraces,
  exportTracesJSON,
  calculateCost,
  getTraceStats,
  createTraceContext,
  type TraceRecord,
  type TokenUsage,
  type ModelPricing,
} from './telemetry';

// Pricing utilities
export {
  calculateCost as calculatePricingCost,
  formatCost,
  formatTokens,
  formatRatePerToken,
  formatRatePerMillion,
  estimateCost,
  getPricingSummary,
  comparePricing,
  type ModelPricingInfo,
  type TokenUsageInfo,
  type CostBreakdown,
} from './pricing';

// Demo provider
export {
  generateDemoResponse,
  streamDemoResponse,
  isDemoMode,
  getDemoModels,
  type DemoMessage,
  type DemoResponse,
} from './demo-provider';
