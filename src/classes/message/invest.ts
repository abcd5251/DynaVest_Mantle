import { Message, MessageMetadata } from "./base";
import { PortfolioMessage } from "./portfolio";
import {
  RiskLevel,
  RiskPortfolioStrategies,
  StrategiesSet,
} from "@/types";
import { RISK_OPTIONS } from "@/constants/risk";
import { base } from "viem/chains";
import { portfolioAllocationService } from "@/services/portfolioAllocationService";
import { liveAPYService } from "@/services/liveAPYService";

export class InvestMessage extends Message {
  public amount: string = "0";
  public chain: number = base.id;

  constructor(metadata: MessageMetadata, _chain?: number) {
    super(metadata);
    if (_chain) {
      this.chain = _chain;
    }
  }

  /**
   * Get strategies dynamically based on risk level and current APY
   * This replaces the old hardcoded approach with dynamic selection
   */
  private getStrategiesSetByChain(
    chainId: number,
    liveAPYData?: Map<string, number>
  ): StrategiesSet {
    // Only support Base chain for now
    if (chainId !== base.id) {
      throw new Error(
        `Chain ${chainId} is not supported yet. Currently only Base chain is supported for portfolio building.`
      );
    }

    // Create strategies set object
    const strategiesSet: StrategiesSet = {} as StrategiesSet;

    // For each risk level, get the best strategies dynamically
    RISK_OPTIONS.forEach((riskLevel) => {
      // Get best strategies for this risk level
      const strategies = portfolioAllocationService.getBestStrategiesForRisk(
        riskLevel,
        chainId,
        liveAPYData
      );

      // Calculate allocations for these strategies (pass riskLevel for different allocation logic)
      const allocations =
        portfolioAllocationService.calculateAllocations(strategies, riskLevel);

      // Map strategies to RiskPortfolioStrategies with allocations
      strategiesSet[riskLevel] = strategies.map((strategy, i) => ({
        ...strategy,
        allocation: allocations[i] || 0,
      })) as RiskPortfolioStrategies[];
    });

    return strategiesSet;
  }

  async next(): Promise<Message> {
    try {
      // Fetch live APY data from protocols
      console.log("📊 Fetching live APY data...");
      const liveAPYData = await liveAPYService.fetchAllAPYs();
      console.log(`✅ Fetched ${liveAPYData.size} live APY rates`);

      // Get strategies filtered by chain with dynamic selection and live APY
      const strategiesSet = this.getStrategiesSetByChain(this.chain, liveAPYData);

      return new PortfolioMessage(
        this.createDefaultMetadata(`Portfolio: ${this.amount} USDC`),
        this.amount,
        this.chain,
        strategiesSet
      );
    } catch (error) {
      console.error("⚠️ Failed to fetch live APY, using fallback:", error);

      // Fallback to hardcoded APY if live fetch fails
      const strategiesSet = this.getStrategiesSetByChain(this.chain);

      return new PortfolioMessage(
        this.createDefaultMetadata(`Portfolio: ${this.amount} USDC`),
        this.amount,
        this.chain,
        strategiesSet
      );
    }
  }
}
