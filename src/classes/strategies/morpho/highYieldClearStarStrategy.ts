import { Address, encodeFunctionData } from "viem";
import { readContract } from "@wagmi/core";
import { base } from "viem/chains";

import { MORPHO } from "@/constants/protocols/morpho";
import { ERC20_ABI } from "@/constants/abis/erc20";
import { METAMORPHO_ABI } from "@/constants/abis/metamorpho";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { Position } from "@/types/position";
import { coreWagmiConfig as config } from "@/providers/config";
import { GetProtocolChains } from "@/types/strategies";

/**
 * @notice HighYieldClearStarStrategy - High Yield ClearStar USDC vault
 * @notice High-yield MetaMorpho vault curated by ClearStar
 */
export class HighYieldClearStarStrategy extends BaseStrategy<typeof MORPHO> {
  private readonly VAULT_ADDRESS = "0xE74c499fA461AF1844fCa84204490877787cED56";

  constructor(chainId: GetProtocolChains<typeof MORPHO>) {
    super(chainId, MORPHO, "HighYieldClearStarStrategy");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset)
      throw new Error("HighYieldClearStarStrategy: asset parameter is required");

    return [
      {
        to: asset,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [this.VAULT_ADDRESS, amount],
        }),
      },
      {
        to: this.VAULT_ADDRESS,
        data: encodeFunctionData({
          abi: METAMORPHO_ABI,
          functionName: "deposit",
          args: [amount, user],
        }),
      },
    ];
  }

  async redeemCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    try {
      console.log(`🔄 HighYieldClearStarStrategy Withdrawal Request:`, {
        requestedAmount: amount.toString(),
        user,
        vaultAddress: this.VAULT_ADDRESS
      });

      return [
        {
          to: this.VAULT_ADDRESS,
          data: encodeFunctionData({
            abi: METAMORPHO_ABI,
            functionName: "withdraw",
            args: [amount, user, user],
          }),
        },
      ];
    } catch (error) {
      console.error("❌ HighYieldClearStarStrategy redeemCalls error:", error);

      try {
        const sharesToRedeem = await this.getSharesForAmount(amount);

        console.log(`🔄 Fallback: Using redeem with calculated shares:`, {
          assetAmount: amount.toString(),
          sharesToRedeem: sharesToRedeem.toString()
        });

        return [
          {
            to: this.VAULT_ADDRESS,
            data: encodeFunctionData({
              abi: METAMORPHO_ABI,
              functionName: "redeem",
              args: [sharesToRedeem, user, user],
            }),
          },
        ];
      } catch (fallbackError) {
        console.error("❌ Fallback redeem calculation failed:", fallbackError);
        throw new Error(`HighYieldClearStarStrategy withdrawal failed: ${fallbackError}`);
      }
    }
  }

  async getSharesForAmount(assetAmount: bigint): Promise<bigint> {
    try {
      return await readContract(config, {
        chainId: this.chainId,
        abi: METAMORPHO_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "previewWithdraw",
        args: [assetAmount],
      });
    } catch (error) {
      console.error("Error getting shares for amount:", error);

      const totalAssets = await this.getTotalAssets();
      const totalSupply = await readContract(config, {
        chainId: this.chainId,
        abi: METAMORPHO_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "totalSupply",
      });

      if (totalAssets === BigInt(0)) return BigInt(0);

      return (assetAmount * totalSupply) / totalAssets;
    }
  }

  async getProfit(user: Address, position: Position): Promise<number> {
    try {
      const oneShare = BigInt(10 ** 18);

      const currentAssetsForOneShare = await readContract(config, {
        chainId: this.chainId,
        abi: METAMORPHO_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "convertToAssets",
        args: [oneShare],
      });

      const currentSharePrice = Number(currentAssetsForOneShare) / Number(oneShare);
      const profitPercentage = ((currentSharePrice - position.entryPrice) / position.entryPrice) * 100;

      return profitPercentage;
    } catch (error) {
      console.error("Error calculating HighYieldClearStar profit:", error);

      const { createAt } = position;
      const now = new Date();
      const createdAt = new Date(createAt);
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const estimatedAPY = 0.072; // 7.2%
      const dailyRate = estimatedAPY / 365;
      const estimatedProfit = dailyRate * diffDays * 100;

      return estimatedProfit;
    }
  }

  async getCurrentSharePrice(): Promise<number> {
    try {
      const oneShare = BigInt(10 ** 18);
      const assetsForOneShare = await readContract(config, {
        chainId: this.chainId,
        abi: METAMORPHO_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "convertToAssets",
        args: [oneShare],
      });

      return Number(assetsForOneShare) / Number(oneShare);
    } catch (error) {
      console.error("Error getting current share price:", error);
      return 1.0;
    }
  }

  async getTotalAssets(): Promise<bigint> {
    try {
      return await readContract(config, {
        chainId: this.chainId,
        abi: METAMORPHO_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "totalAssets",
      });
    } catch (error) {
      console.error("Error getting total assets:", error);
      return BigInt(0);
    }
  }

  getVaultInfo() {
    return {
      curator: "ClearStar",
      network: "Base",
      chainId: base.id,
      vault: this.VAULT_ADDRESS,
      tvl: "$2.07M",
      performanceFee: "Variable",
      riskLevel: "Medium",
      description: "High Yield USDC vault curated by ClearStar for maximum returns",
      externalLink: `https://app.morpho.org/base/vault/${this.VAULT_ADDRESS}/high-yield-clearstar-usdc`,
    };
  }
}
