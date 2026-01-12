import type { StrategyMetadata, RiskLevel } from "@/types";

/**
 * Simple dynamic risk calculation based on APY
 * Higher APY = Higher Risk
 */
export function calculateDynamicRisk(strategy: StrategyMetadata): RiskLevel {
  const { apy } = strategy;
  
  // Simple APY-based risk thresholds
  if (apy <= 6.5) return "low";     // Conservative APY range
  if (apy <= 8.5) return "medium";  // Moderate APY range
  return "high";                    // Higher APY = higher risk
}

/**
 * Get dynamic risk level for a strategy
 * Falls back to hardcoded risk if needed
 */
export function getDynamicRiskLevel(strategy: StrategyMetadata): RiskLevel {
  try {
    return calculateDynamicRisk(strategy);
  } catch (error) {
    console.warn('Dynamic risk calculation failed, using hardcoded:', error);
    return strategy.risk;
  }
}
