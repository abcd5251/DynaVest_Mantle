import { Message, MessageMetadata } from "./base";
import { PortfolioMessage } from "./portfolio";
import { BuildPortfolioMessage } from "./build-portfolio";
import { StrategiesSet, RiskPortfolioStrategies } from "@/types/strategies";
import { ACTIVE_STRATEGIES } from "@/constants/strategies";

export class DepositMessage extends Message {
  constructor(
    metadata: MessageMetadata,
    public amount: string,
    public readonly chain: number,
    public strategies: RiskPortfolioStrategies[]
  ) {
    super(metadata);
  }

  // Create a simple strategies set from active strategies
  private createStrategiesSet(): StrategiesSet {
    const strategiesWithAllocation = ACTIVE_STRATEGIES.map((strategy, index) => ({
      ...strategy,
      allocation: Math.round(100 / ACTIVE_STRATEGIES.length) // Equal allocation
    }));

    return {
      low: strategiesWithAllocation.filter(s => s.risk === 'low'),
      medium: strategiesWithAllocation.filter(s => s.risk === 'medium'),
      high: strategiesWithAllocation.filter(s => s.risk === 'high')
    };
  }

  next(action: "build" | "portfolio"): Message {
    switch (action) {
      case "portfolio":
        return new PortfolioMessage(
          this.createDefaultMetadata(`Portfolio: ${this.amount} USDC`),
          this.amount,
          this.chain,
          this.createStrategiesSet()
        );
      case "build":
        return new BuildPortfolioMessage(
          this.createDefaultMetadata(""),
          this.amount,
          this.strategies
        );
    }
  }

  execute(): void {
    console.log("Deposit executed successfully");
  }
}
