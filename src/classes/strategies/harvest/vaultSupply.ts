import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains, GetProtocolContractNames } from "@/types/strategies";

import { HARVEST_VAULT_ABI, ERC20_ABI } from "@/constants/abis";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { HARVEST } from "@/constants/protocols/harvest";
import { coreWagmiConfig } from "@/providers/config";
import { getTokenByName } from "@/utils/coins";

/**
 * Harvest Finance Vault Supply Strategy
 *
 * Supports depositing assets into Harvest Finance vaults and receiving fTokens.
 * Works with any Harvest vault on supported chains.
 *
 * Features:
 * - Simple 1-step deposit/withdrawal (LOW complexity)
 * - No lock-up periods
 * - No deposit or withdrawal fees
 * - Instant liquidity (subject to vault liquidity)
 *
 * Note: This strategy is flexible and can work with different Harvest vaults
 * by specifying the vault contract name in the constructor.
 */
export class HarvestVaultSupply extends BaseStrategy<typeof HARVEST> {
  private vaultContractName: GetProtocolContractNames<typeof HARVEST>;

  constructor(
    chainId: GetProtocolChains<typeof HARVEST>,
    vaultContractName: GetProtocolContractNames<typeof HARVEST>
  ) {
    // Generate unique strategy name based on vault
    const strategyName = `HarvestVaultSupply_${vaultContractName}`;
    super(chainId, HARVEST, strategyName);
    this.vaultContractName = vaultContractName;
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset) {
      throw new Error("HarvestVaultSupply: asset address is required");
    }

    const vault = this.getAddress(this.vaultContractName);

    return [
      // Step 1: Approve vault to spend underlying tokens
      {
        to: asset,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vault, amount],
        }),
      },
      // Step 2: Deposit into vault to receive fTokens
      {
        to: vault,
        data: encodeFunctionData({
          abi: HARVEST_VAULT_ABI,
          functionName: "deposit",
          args: [amount],
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
      throw new Error("HarvestVaultSupply: asset is required");
    }

    const vault = this.getAddress(this.vaultContractName);

    try {
      // Get user's fToken (vault share) balance
      const shareBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: HARVEST_VAULT_ABI,
        address: vault,
        functionName: "balanceOf",
        args: [user],
      });

      // Single step: Withdraw by burning all fTokens
      return [
        {
          to: vault,
          data: encodeFunctionData({
            abi: HARVEST_VAULT_ABI,
            functionName: "withdraw",
            args: [shareBalance],
          }),
        },
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`HarvestVaultSupply redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position) {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);
      const vault = this.getAddress(this.vaultContractName);

      // Get user's current underlying balance (including earned yield)
      // This function returns the total underlying tokens the user can withdraw
      const currentBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: HARVEST_VAULT_ABI,
        address: vault,
        functionName: "underlyingBalanceWithInvestmentForHolder",
        args: [user],
      });

      // Calculate profit: current balance - initial deposit
      const currentValue = Number(formatUnits(currentBalance, token.decimals));
      return currentValue - amount;
    } catch (error) {
      console.error("HarvestVaultSupply getProfit error:", error);
      return 0;
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in HARVEST.contracts;
  }
}
