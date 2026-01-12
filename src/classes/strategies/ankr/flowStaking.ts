import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains } from "@/types/strategies";

import { ANKR_FLOW_ABI } from "@/constants/abis/ankrFlow";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { ANKR } from "@/constants/protocols/ankr";
import { coreWagmiConfig } from "@/providers/config";
import { getTokenByName } from "@/utils/coins";

export class AnkrFlowStaking extends BaseStrategy<typeof ANKR> {
  constructor(chainId: GetProtocolChains<typeof ANKR>) {
    super(chainId, ANKR, "AnkrFlowStaking");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    const ankrFlowAddress = this.getAddress("ankrFLOW");

    // For Ankr Flow staking, we send FLOW directly to stake
    return [
      {
        to: ankrFlowAddress,
        value: amount, // Send FLOW as native token
        data: encodeFunctionData({
          abi: ANKR_FLOW_ABI,
          functionName: "stake",
          args: [],
        }),
      },
    ];
  }

  async redeemCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    const ankrFlowAddress = this.getAddress("ankrFLOW");

    try {
      // Get user's ankrFLOW balance
      const ankrFlowBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: ANKR_FLOW_ABI,
        address: ankrFlowAddress,
        functionName: "balanceOf",
        args: [user],
      });

      return [
        {
          to: ankrFlowAddress,
          data: encodeFunctionData({
            abi: ANKR_FLOW_ABI,
            functionName: "unstake",
            args: [ankrFlowBalance],
          }),
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`AnkrFlowStaking redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position): Promise<number> {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);
      const ankrFlowAddress = this.getAddress("ankrFLOW");

      // Get user's ankrFLOW balance
      const ankrFlowBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: ANKR_FLOW_ABI,
        address: ankrFlowAddress,
        functionName: "balanceOf",
        args: [user],
      });

      // Convert ankrFLOW to FLOW to get current value
      const flowValue = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: ANKR_FLOW_ABI,
        address: ankrFlowAddress,
        functionName: "sharesToBonds",
        args: [ankrFlowBalance],
      });

      // Calculate profit: current value - initial amount
      return Number(formatUnits(flowValue, token.decimals)) - amount;
    } catch (error) {
      console.error("AnkrFlowStaking getProfit error:", error);
      return 0; // Return 0 profit on error instead of throwing
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in ANKR.contracts;
  }
}
