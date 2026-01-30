/**
 * Model Pricing Utilities
 * Compute cost estimates from model pricing data and token usage
 */

export interface ModelPricingInfo {
  input: string;
  output: string;
  inputTiers?: Array<{ cost: string; min: number; max?: number }>;
  outputTiers?: Array<{ cost: string; min: number; max?: number }>;
  inputCacheRead?: string;
  inputCacheWrite?: string;
  image?: string;
  webSearch?: string;
}

export interface TokenUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  formattedInputCost: string;
  formattedOutputCost: string;
  formattedTotalCost: string;
  currency: string;
  details: {
    inputTokens: number;
    outputTokens: number;
    inputRatePerToken: number;
    outputRatePerToken: number;
  };
}

/**
 * Get the applicable rate from tiered pricing
 */
function getTieredRate(
  tokens: number,
  baseRate: string,
  tiers?: Array<{ cost: string; min: number; max?: number }>
): number {
  if (!tiers || tiers.length === 0) {
    return parseFloat(baseRate) || 0;
  }

  // Sort tiers by min value
  const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

  // Find applicable tier
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    const tier = sortedTiers[i];
    if (tokens >= tier.min) {
      return parseFloat(tier.cost) || 0;
    }
  }

  // Default to base rate if no tier matches
  return parseFloat(baseRate) || 0;
}

/**
 * Calculate cost from usage and pricing
 */
export function calculateCost(
  usage: TokenUsageInfo,
  pricing: ModelPricingInfo
): CostBreakdown {
  const inputRate = getTieredRate(usage.promptTokens, pricing.input, pricing.inputTiers);
  const outputRate = getTieredRate(usage.completionTokens, pricing.output, pricing.outputTiers);

  const inputCost = usage.promptTokens * inputRate;
  const outputCost = usage.completionTokens * outputRate;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    formattedInputCost: formatCost(inputCost),
    formattedOutputCost: formatCost(outputCost),
    formattedTotalCost: formatCost(totalCost),
    currency: 'USD',
    details: {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      inputRatePerToken: inputRate,
      outputRatePerToken: outputRate,
    },
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `$${cost.toExponential(2)}`;
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

/**
 * Format rate per token for display
 */
export function formatRatePerToken(rate: number): string {
  if (rate === 0) return '$0';
  return `$${rate.toFixed(8)}/token`;
}

/**
 * Format rate per 1M tokens (common display format)
 */
export function formatRatePerMillion(rate: number): string {
  if (rate === 0) return '$0';
  const perMillion = rate * 1_000_000;
  return `$${perMillion.toFixed(2)}/1M tokens`;
}

/**
 * Estimate cost before making a request
 */
export function estimateCost(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  pricing: ModelPricingInfo
): CostBreakdown {
  return calculateCost(
    {
      promptTokens: estimatedInputTokens,
      completionTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
    },
    pricing
  );
}

/**
 * Get a human-readable pricing summary
 */
export function getPricingSummary(pricing: ModelPricingInfo): string {
  const inputRate = parseFloat(pricing.input) || 0;
  const outputRate = parseFloat(pricing.output) || 0;

  const inputPerMillion = (inputRate * 1_000_000).toFixed(2);
  const outputPerMillion = (outputRate * 1_000_000).toFixed(2);

  return `Input: $${inputPerMillion}/1M tokens | Output: $${outputPerMillion}/1M tokens`;
}

/**
 * Compare pricing between two models
 */
export function comparePricing(
  pricingA: ModelPricingInfo,
  pricingB: ModelPricingInfo,
  testTokens = 1000
): {
  inputDifference: number;
  outputDifference: number;
  totalDifference: number;
  percentageDifference: number;
} {
  const costA = calculateCost(
    { promptTokens: testTokens, completionTokens: testTokens, totalTokens: testTokens * 2 },
    pricingA
  );
  const costB = calculateCost(
    { promptTokens: testTokens, completionTokens: testTokens, totalTokens: testTokens * 2 },
    pricingB
  );

  return {
    inputDifference: costB.inputCost - costA.inputCost,
    outputDifference: costB.outputCost - costA.outputCost,
    totalDifference: costB.totalCost - costA.totalCost,
    percentageDifference: costA.totalCost > 0
      ? ((costB.totalCost - costA.totalCost) / costA.totalCost) * 100
      : 0,
  };
}
