import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains } from "@/types/strategies";

import { STAKED_CELO_ABI } from "@/constants/abis/stakeCelo";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { ST_CELO } from "@/constants/protocols/stCelo";
import { coreWagmiConfig } from "@/providers/config";
import { getTokenByName } from "@/utils/coins";

export class StCeloStaking extends BaseStrategy<typeof ST_CELO> {
  constructor(chainId: GetProtocolChains<typeof ST_CELO>) {
    super(chainId, ST_CELO, "StCeloStaking");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset) {
      throw new Error("StCeloStaking: CELO asset address is required");
    }

    const manager = this.getAddress("manager");

    // For StCelo, we need to approve CELO tokens first, then deposit
    return [
      {
        to: asset,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
            },
          ],
          functionName: "approve",
          args: [manager, amount],
        }),
      },
      {
        to: manager,
        value: amount,
        data: encodeFunctionData({
          abi: STAKED_CELO_ABI,
          functionName: "deposit",
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
    const manager = this.getAddress("manager");

    try {
      // Get user's stCELO balance
      const stCeloBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: STAKED_CELO_ABI,
        address: manager,
        functionName: "balanceOf",
        args: [user],
      });

      return [
        {
          to: manager,
          data: encodeFunctionData({
            abi: STAKED_CELO_ABI,
            functionName: "withdraw",
            args: [stCeloBalance],
          }),
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`StCeloStaking redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position): Promise<number> {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);
      const manager = this.getAddress("manager");

      // Get user's stCELO balance
      const stCeloBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: STAKED_CELO_ABI,
        address: manager,
        functionName: "balanceOf",
        args: [user],
      });

      // Convert stCELO to CELO to get current value
      const celoValue = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: STAKED_CELO_ABI,
        address: manager,
        functionName: "toCelo",
        args: [stCeloBalance],
      });

      // Calculate profit: current value - initial amount
      return Number(formatUnits(celoValue, token.decimals)) - amount;
    } catch (error) {
      console.error("StCeloStaking getProfit error:", error);
      return 0; // Return 0 profit on error instead of throwing
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in ST_CELO.contracts;
  }
}
