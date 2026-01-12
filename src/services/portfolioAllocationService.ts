import { STRATEGIES_METADATA } from "@/constants/strategies";
import type { RiskLevel, StrategyMetadata } from "@/types";
import { base } from "viem/chains";

interface StrategyWithAPY extends StrategyMetadata {
  currentAPY?: number;
}

/**
 * Service for dynamically selecting and allocating strategies based on risk profile
 */
class PortfolioAllocationService {
  /**
   * Get the best strategies for a given risk level on Base chain
   * Strategies are selected based on current APY and risk level
   */
  getBestStrategiesForRisk(
    riskLevel: RiskLevel,
    chainId: number = base.id,
    liveAPYData?: Map<string, number>
  ): StrategyWithAPY[] {
    // Filter strategies by chain and risk level
    const baseStrategies = STRATEGIES_METADATA.filter(
      (s) => s.chainId === chainId && s.status === "active"
    );

    // Enrich with live APY data if available
    const strategiesWithAPY: StrategyWithAPY[] = baseStrategies.map((s) => ({
      ...s,
      currentAPY: liveAPYData?.get(s.id) || s.apy,
    }));

    // Define strategy selection logic based on risk level
    switch (riskLevel) {
      case "low": {
        // For low risk: select only low-risk strategies, sorted by APY
        const lowRiskStrategies = strategiesWithAPY
          .filter((s) => s.risk === "low")
          .sort((a, b) => (b.currentAPY || b.apy) - (a.currentAPY || a.apy));

        // Return top 2 low-risk strategies
        return lowRiskStrategies.slice(0, 2);
      }

      case "medium": {
        // Special handling for demo: specific strategies requested
        const targetIds = ["HarvestFortyAcresUSDC", "MorphoSupply", "AaveV3SupplyLeveraged"];
        
        // Find these strategies in metadata, ignoring chainId filter
        const specificStrategies = STRATEGIES_METADATA
          .filter(s => targetIds.includes(s.id) && s.status === "active")
          .map(s => ({
             ...s,
             currentAPY: liveAPYData?.get(s.id) || s.apy
          }));

        if (specificStrategies.length > 0) {
             return specificStrategies.sort((a, b) => (b.currentAPY || b.apy) - (a.currentAPY || a.apy));
        }

        // For medium risk: select medium-risk strategies, sorted by APY
        const mediumRiskStrategies = strategiesWithAPY
          .filter((s) => s.risk === "medium")
          .sort((a, b) => (b.currentAPY || b.apy) - (a.currentAPY || a.apy));

        // Return top 3 medium-risk strategies
        return mediumRiskStrategies.slice(0, 3);
      }

      case "high": {
        // For high risk: mix of high and medium risk strategies
        // First try to get high-risk strategies
        const highRiskStrategies = strategiesWithAPY
          .filter((s) => s.risk === "high")
          .sort((a, b) => (b.currentAPY || b.apy) - (a.currentAPY || a.apy));

        // If we have high-risk strategies, use them
        if (highRiskStrategies.length >= 2) {
          return highRiskStrategies.slice(0, 3);
        }

        // Otherwise, use best medium-risk strategies
        const mediumRiskStrategies = strategiesWithAPY
          .filter((s) => s.risk === "medium")
          .sort((a, b) => (b.currentAPY || b.apy) - (a.currentAPY || a.apy));

        return mediumRiskStrategies.slice(0, 3);
      }

      default:
        return [];
    }
  }

  /**
   * Calculate allocations for strategies
   * Returns allocation percentages that sum to 100%
   * For high-risk portfolios, we concentrate more in the highest APY
   */
  calculateAllocations(
    strategies: StrategyWithAPY[],
    riskLevel: RiskLevel
  ): number[] {
    if (strategies.length === 0) return [];
    if (strategies.length === 1) return [100];

    // For 2 strategies: Split based on APY ratio with some randomness
    if (strategies.length === 2) {
      const totalAPY =
        (strategies[0].currentAPY || strategies[0].apy) +
        (strategies[1].currentAPY || strategies[1].apy);

      // Base allocation on APY, but add randomness for variety
      const base1 =
        ((strategies[0].currentAPY || strategies[0].apy) / totalAPY) * 100;
      const random = Math.floor(Math.random() * 20) - 10; // -10 to +10

      const allocation1 = Math.max(30, Math.min(70, Math.round(base1 + random)));
      const allocation2 = 100 - allocation1;

      return [allocation1, allocation2];
    }

    // For 3 strategies: Different distribution based on risk level
    if (strategies.length === 3) {
      // High risk: More concentrated in highest APY (aggressive)
      if (riskLevel === "high") {
        // Concentrate 50-60% in highest APY, split the rest
        const highestAllocation = 50 + Math.floor(Math.random() * 11); // 50-60%
        const remaining = 100 - highestAllocation;

        // Split remaining between other two strategies
        const secondAllocation = Math.floor(remaining * 0.4) + Math.floor(Math.random() * 10);
        const thirdAllocation = 100 - highestAllocation - secondAllocation;

        return [highestAllocation, secondAllocation, thirdAllocation];
      }

      // Low and Medium risk: More balanced distribution
      const totalAPY = strategies.reduce(
        (sum, s) => sum + (s.currentAPY || s.apy),
        0
      );

      // Calculate base allocations proportional to APY
      let allocations = strategies.map((s) =>
        Math.round(((s.currentAPY || s.apy) / totalAPY) * 100)
      );

      // Ensure allocations sum to exactly 100
      const sum = allocations.reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        allocations[0] += 100 - sum;
      }

      // Ensure minimum allocation of 20% and maximum of 50% for each
      allocations = allocations.map((a) => Math.max(20, Math.min(50, a)));

      // Re-normalize to 100%
      const newSum = allocations.reduce((a, b) => a + b, 0);
      const factor = 100 / newSum;
      allocations = allocations.map((a) => Math.round(a * factor));

      // Final adjustment to ensure exact 100%
      const finalSum = allocations.reduce((a, b) => a + b, 0);
      allocations[0] += 100 - finalSum;

      return allocations;
    }

    // For more strategies: Equal distribution
    const baseAllocation = Math.floor(100 / strategies.length);
    const remainder = 100 - baseAllocation * strategies.length;
    const allocations = strategies.map((_, i) =>
      i === 0 ? baseAllocation + remainder : baseAllocation
    );

    return allocations;
  }
}

export const portfolioAllocationService = new PortfolioAllocationService();
