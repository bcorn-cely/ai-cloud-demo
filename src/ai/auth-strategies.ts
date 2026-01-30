/**
 * Authentication Strategies
 * Pluggable auth helpers for various enterprise patterns
 */

export type AuthMethod =
  | 'api-key'
  | 'bearer-token'
  | 'oidc-token'
  | 'oauth-client-credentials'
  | 'aws-default-creds'
  | 'custom';

export interface AuthConfig {
  method: AuthMethod;
  apiKey?: string;
  bearerToken?: string;
  oidcToken?: string;
  oauth?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    region: string;
  };
  customHeaders?: Record<string, string>;
}

export interface AuthResult {
  headers: Record<string, string>;
  description: string;
  redactedHeaders: Record<string, string>;
}

/**
 * Build auth headers from config
 */
export function buildAuthHeaders(config: AuthConfig): AuthResult {
  const headers: Record<string, string> = {};
  const redactedHeaders: Record<string, string> = {};
  let description = '';

  switch (config.method) {
    case 'api-key':
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        redactedHeaders['Authorization'] = `Bearer ${redactSecret(config.apiKey)}`;
        description = 'API Key authentication via Authorization header';
      }
      break;

    case 'bearer-token':
      if (config.bearerToken) {
        headers['Authorization'] = `Bearer ${config.bearerToken}`;
        redactedHeaders['Authorization'] = `Bearer ${redactSecret(config.bearerToken)}`;
        description = 'Bearer token authentication';
      }
      break;

    case 'oidc-token':
      if (config.oidcToken) {
        headers['Authorization'] = `Bearer ${config.oidcToken}`;
        redactedHeaders['Authorization'] = `Bearer ${redactSecret(config.oidcToken)}`;
        description = 'Vercel OIDC token authentication (auto-managed by Vercel)';
      }
      break;

    case 'oauth-client-credentials':
      // In a real implementation, this would fetch a token
      // For demo, we show the pattern
      description = 'OAuth 2.0 Client Credentials flow (token fetched at runtime)';
      headers['X-Auth-Method'] = 'oauth-client-credentials';
      redactedHeaders['X-Auth-Method'] = 'oauth-client-credentials';
      break;

    case 'aws-default-creds':
      // AWS-style auth typically uses signed requests, not headers directly
      // For demo, we show the pattern
      if (config.aws) {
        headers['X-Amz-Access-Key'] = config.aws.accessKeyId;
        headers['X-Amz-Region'] = config.aws.region;
        if (config.aws.sessionToken) {
          headers['X-Amz-Security-Token'] = config.aws.sessionToken;
        }
        redactedHeaders['X-Amz-Access-Key'] = redactSecret(config.aws.accessKeyId);
        redactedHeaders['X-Amz-Region'] = config.aws.region;
        if (config.aws.sessionToken) {
          redactedHeaders['X-Amz-Security-Token'] = redactSecret(config.aws.sessionToken);
        }
        description = 'AWS-style authentication (SigV4 signing pattern)';
      }
      break;

    case 'custom':
      if (config.customHeaders) {
        Object.assign(headers, config.customHeaders);
        for (const [key, value] of Object.entries(config.customHeaders)) {
          redactedHeaders[key] = key.toLowerCase().includes('auth') ||
                                 key.toLowerCase().includes('key') ||
                                 key.toLowerCase().includes('token') ||
                                 key.toLowerCase().includes('secret')
            ? redactSecret(value)
            : value;
        }
        description = 'Custom header authentication';
      }
      break;
  }

  return { headers, description, redactedHeaders };
}

/**
 * Redact a secret for display
 */
function redactSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '***';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

/**
 * Detect available auth methods from environment
 */
export function detectAuthMethods(): {
  available: AuthMethod[];
  recommended: AuthMethod | null;
  details: Record<AuthMethod, { configured: boolean; source: string }>;
} {
  const details: Record<AuthMethod, { configured: boolean; source: string }> = {
    'api-key': {
      configured: !!process.env.AI_GATEWAY_API_KEY,
      source: 'AI_GATEWAY_API_KEY environment variable',
    },
    'bearer-token': {
      configured: !!process.env.CUSTOM_OAI_BEARER_TOKEN,
      source: 'CUSTOM_OAI_BEARER_TOKEN environment variable',
    },
    'oidc-token': {
      configured: !!process.env.VERCEL_OIDC_TOKEN,
      source: 'VERCEL_OIDC_TOKEN (auto-injected by Vercel)',
    },
    'oauth-client-credentials': {
      configured: false,
      source: 'Configured via oauth settings (not detected)',
    },
    'aws-default-creds': {
      configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      source: 'AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY environment variables',
    },
    'custom': {
      configured: !!process.env.CORP_PROXY_AUTH_HEADER,
      source: 'CORP_PROXY_AUTH_HEADER environment variable',
    },
  };

  const available = (Object.keys(details) as AuthMethod[]).filter(
    method => details[method].configured
  );

  // Determine recommended method
  let recommended: AuthMethod | null = null;
  if (details['oidc-token'].configured) {
    recommended = 'oidc-token';
  } else if (details['api-key'].configured) {
    recommended = 'api-key';
  } else if (available.length > 0) {
    recommended = available[0];
  }

  return { available, recommended, details };
}

/**
 * Simulated OAuth token fetch (for demo/testing)
 */
export async function fetchOAuthToken(config: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}): Promise<{ accessToken: string; expiresIn: number; tokenType: string }> {
  // In production, this would make a real OAuth request
  // For demo, we simulate it
  console.log(`[OAuth] Fetching token from ${config.tokenUrl}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    accessToken: `simulated_oauth_token_${Date.now()}`,
    expiresIn: 3600,
    tokenType: 'Bearer',
  };
}

/**
 * Create a fetch wrapper that injects OAuth tokens
 */
export function createOAuthFetch(oauthConfig: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}): typeof fetch {
  let cachedToken: { token: string; expiresAt: number } | null = null;

  return async (input, init) => {
    const now = Date.now();

    // Refresh token if needed
    if (!cachedToken || now >= cachedToken.expiresAt) {
      const tokenResponse = await fetchOAuthToken(oauthConfig);
      cachedToken = {
        token: tokenResponse.accessToken,
        expiresAt: now + (tokenResponse.expiresIn * 1000) - 60000, // 1 min buffer
      };
    }

    // Inject token
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${cachedToken.token}`);

    return fetch(input, { ...init, headers });
  };
}

/**
 * Simulated AWS default credential chain
 */
export async function resolveAWSCredentials(): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  source: string;
} | null> {
  // Check environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
      source: 'Environment variables',
    };
  }

  // In production, would also check:
  // - Shared credentials file (~/.aws/credentials)
  // - EC2 instance metadata service
  // - ECS container credentials
  // - EKS pod identity

  return null;
}

/**
 * Get auth status summary for UI display
 */
export function getAuthStatusSummary(): {
  gatewayAuth: 'configured' | 'oidc' | 'none';
  customAuth: 'configured' | 'none';
  byokConfigured: string[];
  sandboxAuth: 'oidc' | 'token' | 'none';
} {
  return {
    gatewayAuth: process.env.VERCEL_OIDC_TOKEN
      ? 'oidc'
      : process.env.AI_GATEWAY_API_KEY
        ? 'configured'
        : 'none',
    customAuth: process.env.CUSTOM_OAI_API_KEY || process.env.CUSTOM_OAI_BEARER_TOKEN
      ? 'configured'
      : 'none',
    byokConfigured: [
      process.env.BYOK_OPENAI_API_KEY && 'openai',
      process.env.BYOK_ANTHROPIC_API_KEY && 'anthropic',
      process.env.BYOK_BEDROCK_ACCESS_KEY_ID && 'bedrock',
      process.env.BYOK_VERTEX_PROJECT && 'vertex',
    ].filter(Boolean) as string[],
    sandboxAuth: process.env.VERCEL_OIDC_TOKEN
      ? 'oidc'
      : process.env.VERCEL_TOKEN
        ? 'token'
        : 'none',
  };
}
