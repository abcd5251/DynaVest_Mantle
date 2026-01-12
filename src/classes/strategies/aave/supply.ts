import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains } from "@/types/strategies";

import { AAVE_V3_ABI, ERC20_ABI } from "@/constants/abis";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { AAVE } from "@/constants/protocols/aave";
import { coreWagmiConfig } from "@/providers/config"; // ✅ Use the correct config for @wagmi/core
import { getTokenByName } from "@/utils/coins";

export class AaveV3Supply extends BaseStrategy<typeof AAVE> {
  constructor(chainId: GetProtocolChains<typeof AAVE>) {
    super(chainId, AAVE, "AaveV3Supply");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset) {
      throw new Error("AaveV3Supply: asset is required");
    }

    const pool = this.getAddress("pool");

    return [
      {
        to: asset,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [pool, amount],
        }),
      },
      {
        to: pool,
        data: encodeFunctionData({
          abi: AAVE_V3_ABI,
          functionName: "supply",
          args: [asset, amount, user, 0],
        }),
      },
    ];
  }

  async redeemCalls(
    amount: bigint,
    user: Address,
    underlyingAsset?: Address
  ): Promise<StrategyCall[]> {
    if (!underlyingAsset) {
      throw new Error("AaveV3Supply: asset is required");
    }
    
    const pool = this.getAddress("pool");

    try {
      // ✅ Fixed: Use coreWagmiConfig with chainId parameter
      const aTokenAddress = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: AAVE_V3_ABI,
        address: pool,
        functionName: "getReserveAToken",
        args: [underlyingAsset],
      });

      const aTokenBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: ERC20_ABI,
        address: aTokenAddress as Address,
        functionName: "balanceOf",
        args: [user],
      });

      return [
        {
          to: pool,
          data: encodeFunctionData({
            abi: AAVE_V3_ABI,
            functionName: "withdraw",
            args: [underlyingAsset, aTokenBalance, user],
          }),
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`AaveV3Supply redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position) {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);

      const underlyingAsset = token.chains![this.chainId];
      const pool = this.getAddress("pool");

      // ✅ Fixed: Use coreWagmiConfig with chainId parameter
      const aTokenAddress = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: AAVE_V3_ABI,
        address: pool,
        functionName: "getReserveAToken",
        args: [underlyingAsset],
      });

      const aTokenBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: ERC20_ABI,
        address: aTokenAddress as Address,
        functionName: "balanceOf",
        args: [user],
      });

      return Number(formatUnits(aTokenBalance, token.decimals)) - amount;
    } catch (error) {
      console.error("AaveV3Supply getProfit error:", error);
      return 0; // Return 0 profit on error instead of throwing
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in AAVE.contracts;
  }
}
