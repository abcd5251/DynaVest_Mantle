import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains } from "@/types/strategies";

import { AVANTIS_VAULT_ABI, ERC20_ABI } from "@/constants/abis";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { AVANTIS } from "@/constants/protocols/avantis";
import { coreWagmiConfig } from "@/providers/config";
import { getTokenByName } from "@/utils/coins";

export class AvantisVaultSupply extends BaseStrategy<typeof AVANTIS> {
  constructor(chainId: GetProtocolChains<typeof AVANTIS>) {
    super(chainId, AVANTIS, "AvantisVaultSupply");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset) {
      throw new Error("AvantisVaultSupply: asset address is required");
    }

    const vault = this.getAddress("avUSDCVault");

    return [
      {
        to: asset,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vault, amount],
        }),
      },
      {
        to: vault,
        data: encodeFunctionData({
          abi: AVANTIS_VAULT_ABI,
          functionName: "deposit",
          args: [amount, user],
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
      throw new Error("AvantisVaultSupply: asset is required");
    }

    const vault = this.getAddress("avUSDCVault");

    try {
      // Get user's vault share balance
      const shareBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: AVANTIS_VAULT_ABI,
        address: vault,
        functionName: "balanceOf",
        args: [user],
      });

      return [
        {
          to: vault,
          data: encodeFunctionData({
            abi: AVANTIS_VAULT_ABI,
            functionName: "redeem",
            args: [shareBalance, user, user],
          }),
        },
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`AvantisVaultSupply redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position) {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);
      const vault = this.getAddress("avUSDCVault");

      // Get user's share balance
      const shareBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: AVANTIS_VAULT_ABI,
        address: vault,
        functionName: "balanceOf",
        args: [user],
      });

      // Convert shares to underlying assets
      const assetsValue = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: AVANTIS_VAULT_ABI,
        address: vault,
        functionName: "convertToAssets",
        args: [shareBalance],
      });

      // Note: Actual withdrawal would incur 0.5% fee, but we show gross profit here
      return Number(formatUnits(assetsValue, token.decimals)) - amount;
    } catch (error) {
      console.error("AvantisVaultSupply getProfit error:", error);
      return 0;
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in AVANTIS.contracts;
  }
}
