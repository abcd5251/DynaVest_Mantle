import { Position } from "@/types/position";
import type { Address } from "viem";
import { encodeFunctionData, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { GetProtocolChains } from "@/types/strategies";

import { IPOR_FUSION_ABI, ERC20_ABI } from "@/constants/abis";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { IPOR } from "@/constants/protocols/ipor";
import { coreWagmiConfig } from "@/providers/config";
import { getTokenByName } from "@/utils/coins";

/**
 * DEPRECATED: IPOR Fusion Supply Strategy
 *
 * This strategy has been deprecated due to its complex 2-step withdrawal process
 * requiring Alpha keeper intervention. New deposits are disabled.
 *
 * Existing positions can still be withdrawn using the standard redeem function.
 * Note: IPOR's proper withdrawal flow requires requestShares() + Alpha intervention,
 * but we're using the basic redeem() as a fallback for user convenience.
 */
export class IporFusionSupply extends BaseStrategy<typeof IPOR> {
  constructor(chainId: GetProtocolChains<typeof IPOR>) {
    super(chainId, IPOR, "IporFusionSupply");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    throw new Error(
      "IPOR Fusion strategy is deprecated. New deposits are not allowed. " +
      "This strategy was removed due to its complex 2-step withdrawal process requiring Alpha keeper intervention. " +
      "If you have existing positions, you can still withdraw them."
    );
  }

  async redeemCalls(
    amount: bigint,
    user: Address,
    underlyingAsset?: Address
  ): Promise<StrategyCall[]> {
    if (!underlyingAsset) {
      throw new Error("IporFusionSupply: asset is required");
    }

    const vault = this.getAddress("yoUSDVault");

    try {
      // Get user's vault share balance
      const shareBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: IPOR_FUSION_ABI,
        address: vault,
        functionName: "balanceOf",
        args: [user],
      });

      // Use standard ERC-4626 redeem as fallback
      // NOTE: This may not work if IPOR requires the 2-step process
      // In that case, users will need to use IPOR's UI directly
      return [
        {
          to: vault,
          data: encodeFunctionData({
            abi: IPOR_FUSION_ABI,
            functionName: "redeem",
            args: [shareBalance, user, user],
          }),
        },
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `IporFusionSupply withdrawal failed: ${errorMessage}. ` +
        `Due to IPOR's complex withdrawal process, you may need to withdraw directly through ` +
        `IPOR's interface at https://app.ipor.io/fusion/base/0x1166250d1d6b5a1dbb73526257f6bb2bbe235295`
      );
    }
  }

  async getProfit(user: Address, position: Position) {
    try {
      const { amount, tokenName } = position;
      const token = getTokenByName(tokenName);
      const vault = this.getAddress("yoUSDVault");

      // Get user's share balance
      const shareBalance = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: IPOR_FUSION_ABI,
        address: vault,
        functionName: "balanceOf",
        args: [user],
      });

      // Convert shares to underlying assets
      const assetsValue = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: IPOR_FUSION_ABI,
        address: vault,
        functionName: "convertToAssets",
        args: [shareBalance],
      });

      return Number(formatUnits(assetsValue, token.decimals)) - amount;
    } catch (error) {
      console.error("IporFusionSupply getProfit error:", error);
      return 0;
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in IPOR.contracts;
  }
}
