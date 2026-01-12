import { Address, encodeFunctionData } from "viem";
import { readContract } from "@wagmi/core";

import { CIAN } from "@/constants/protocols/cian";
import { ERC20_ABI } from "@/constants/abis/erc20";
import { CIAN_VAULT_ABI } from "@/constants/abis/cian";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { Position } from "@/types/position";
import { coreWagmiConfig as config } from "@/providers/config";
import { GetProtocolChains } from "@/types/strategies";

/**
 * @notice CianVaultSupply - Cian Vault for USDC on Mantle
 */
export class CianVaultSupply extends BaseStrategy<typeof CIAN> {
  private readonly VAULT_ADDRESS = "0x6B2BA8F249cC1376f2A02A9FaF8BEcA5D7718DCf";

  constructor(chainId: GetProtocolChains<typeof CIAN>) {
    super(chainId, CIAN, "CianVaultSupply");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset)
      throw new Error("CianVaultSupply: asset parameter is required");

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
          abi: CIAN_VAULT_ABI,
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
      console.log(`🔄 CianVaultSupply Withdrawal Request:`, {
        requestedAmount: amount.toString(),
        user,
        vaultAddress: this.VAULT_ADDRESS
      });

      return [
        {
          to: this.VAULT_ADDRESS,
          data: encodeFunctionData({
            abi: CIAN_VAULT_ABI,
            functionName: "withdraw",
            args: [amount, user, user],
          }),
        },
      ];
    } catch (error) {
      console.error("❌ CianVaultSupply redeemCalls error:", error);

      // Fallback: Calculate shares manually and use redeem
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
              abi: CIAN_VAULT_ABI,
              functionName: "redeem",
              args: [sharesToRedeem, user, user],
            }),
          },
        ];
      } catch (fallbackError) {
        console.error("❌ Fallback redeem calculation failed:", fallbackError);
        throw new Error(`CianVaultSupply withdrawal failed: ${fallbackError}`);
      }
    }
  }

  async getSharesForAmount(assetAmount: bigint): Promise<bigint> {
    try {
      return await readContract(config, {
        chainId: this.chainId,
        abi: CIAN_VAULT_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "convertToShares",
        args: [assetAmount],
      });
    } catch (error) {
      console.error("Error getting shares for amount:", error);

      const totalAssets = await this.getTotalAssets();
      const totalSupply = await readContract(config, {
        chainId: this.chainId,
        abi: CIAN_VAULT_ABI,
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
        abi: CIAN_VAULT_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "convertToAssets",
        args: [oneShare],
      });

      const currentSharePrice = Number(currentAssetsForOneShare) / Number(oneShare);
      const profitPercentage = ((currentSharePrice - position.entryPrice) / position.entryPrice) * 100;

      return profitPercentage;
    } catch (error) {
      console.error("Error calculating Cian profit:", error);

      const { createAt } = position;
      const now = new Date();
      const createdAt = new Date(createAt);
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const estimatedAPY = 0.0708; // 7.08%
      const dailyRate = estimatedAPY / 365;
      const estimatedProfit = dailyRate * diffDays * 100;

      return estimatedProfit;
    }
  }

  async getTotalAssets(): Promise<bigint> {
    try {
      return await readContract(config, {
        chainId: this.chainId,
        abi: CIAN_VAULT_ABI,
        address: this.VAULT_ADDRESS,
        functionName: "totalAssets",
      });
    } catch (error) {
      console.error("Error getting total assets:", error);
      return BigInt(0);
    }
  }
}
