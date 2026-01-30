/**
 * Custom OpenAI-Compatible Provider Factory
 * For self-hosted models (vLLM, TGI, Ollama, LM Studio, etc.)
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export interface CustomOpenAIConfig {
  name?: string;
  baseURL?: string;
  apiKey?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  // Custom fetch for proxy chaining
  fetch?: typeof fetch;
  // OAuth/AD token configuration
  tokenFetcher?: () => Promise<{ access_token: string; expires_in: number }>;
}

/**
 * Simulated OAuth/AD token fetcher (for demo purposes)
 * In production, this would call your identity provider
 */
export async function mockADTokenFetcher(): Promise<{ access_token: string; expires_in: number }> {
  // Simulate fetching a token from Azure AD, Okta, etc.
  return {
    access_token: `mock_ad_token_${Date.now()}`,
    expires_in: 3600,
  };
}

/**
 * AWS-style default credential chain pattern (stubbed)
 * Simulates checking: env vars -> instance metadata -> config file
 */
export async function awsDefaultCredentialChain(): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
} | null> {
  // Check environment variables first
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: process.env.AWS_REGION || 'us-east-1',
    };
  }

  // In a real implementation, would also check:
  // - ~/.aws/credentials
  // - EC2 instance metadata service
  // - ECS task role
  // - Web identity token

  return null;
}

/**
 * Create a custom OpenAI-compatible provider
 * Supports various auth methods: API key, bearer token, OAuth/AD token
 */
export function getCustomOpenAIProvider(config: CustomOpenAIConfig = {}) {
  const {
    name = 'custom-oai',
    baseURL = process.env.CUSTOM_OAI_BASE_URL,
    apiKey = process.env.CUSTOM_OAI_API_KEY,
    bearerToken = process.env.CUSTOM_OAI_BEARER_TOKEN,
    headers = {},
    fetch: customFetch,
  } = config;

  if (!baseURL) {
    throw new Error('baseURL is required for custom OpenAI-compatible provider');
  }

  // Build headers with auth
  const finalHeaders: Record<string, string> = { ...headers };

  // Use bearer token if provided (takes precedence over API key)
  if (bearerToken) {
    finalHeaders['Authorization'] = `Bearer ${bearerToken}`;
  }

  return createOpenAICompatible({
    name,
    baseURL,
    apiKey: bearerToken ? undefined : apiKey,
    headers: Object.keys(finalHeaders).length > 0 ? finalHeaders : undefined,
    fetch: customFetch,
  });
}

/**
 * Create a custom provider with dynamic OAuth/AD token injection
 */
export function getCustomOpenAIProviderWithOAuth(
  config: CustomOpenAIConfig & { tokenFetcher: () => Promise<{ access_token: string; expires_in: number }> }
) {
  const { tokenFetcher, ...restConfig } = config;

  let cachedToken: { token: string; expiresAt: number } | null = null;

  // Custom fetch that injects fresh OAuth token
  const oauthFetch: typeof fetch = async (input, init) => {
    // Refresh token if expired or not cached
    const now = Date.now();
    if (!cachedToken || now >= cachedToken.expiresAt) {
      const tokenResponse = await tokenFetcher();
      cachedToken = {
        token: tokenResponse.access_token,
        expiresAt: now + (tokenResponse.expires_in * 1000) - 60000, // 1 min buffer
      };
    }

    // Inject the token
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${cachedToken.token}`);

    return fetch(input, { ...init, headers });
  };

  return getCustomOpenAIProvider({
    ...restConfig,
    fetch: oauthFetch,
  });
}

/**
 * Get a model from the custom provider
 */
export function customModel(
  modelId: string,
  config: CustomOpenAIConfig = {}
) {
  const provider = getCustomOpenAIProvider(config);
  return provider(modelId);
}

/**
 * Create a chained proxy fetch wrapper
 * Logs each hop and can inject headers at each stage
 */
export function createChainedProxyFetch(options: {
  proxyBaseURL?: string;
  proxyHeaders?: Record<string, string>;
  onRequest?: (url: string, headers: Record<string, string>) => void;
  onResponse?: (status: number, latency: number) => void;
}): typeof fetch {
  const { proxyBaseURL, proxyHeaders = {}, onRequest, onResponse } = options;

  return async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers: Record<string, string> = {};

    // Copy existing headers
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    // Add proxy headers
    Object.assign(headers, proxyHeaders);

    // Add hop tracking header
    const hopCount = parseInt(headers['X-Proxy-Hop-Count'] || '0') + 1;
    headers['X-Proxy-Hop-Count'] = String(hopCount);

    // Modify URL if proxy is configured
    const targetURL = proxyBaseURL ? new URL(url, proxyBaseURL).toString() : url;

    // Log the request
    onRequest?.(targetURL, headers);

    const startTime = Date.now();
    const response = await fetch(targetURL, { ...init, headers });
    const latency = Date.now() - startTime;

    // Log the response
    onResponse?.(response.status, latency);

    return response;
  };
}

export { createOpenAICompatible };
