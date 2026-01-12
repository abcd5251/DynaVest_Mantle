import { Address, encodeFunctionData, Hex, toHex } from "viem";
import { readContract } from "@wagmi/core";
import { base } from "viem/chains";
import type { Config } from "@wagmi/core";

import { MORPHO, ERC20_ABI, MORPHO_ABI } from "@/constants";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { Position } from "@/types/position";
import { coreWagmiConfig } from "@/providers/config";
import { GetProtocolChains } from "@/types/strategies";

/**
 * @notice MorphoSupply is a strategy that allows users to supply USDC to Morpho
 * @notice Currently supports Base chain only with proper validation
 */
export class MorphoSupply extends BaseStrategy<typeof MORPHO> {
  // USDC market on Base - this should be verified as correct market ID
  private readonly USDC_MARKET_ID =
    "0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda";
  
  // USDC contract address on Base
  private readonly USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

  constructor(chainId: GetProtocolChains<typeof MORPHO>) {
    super(chainId, MORPHO, "MorphoSupply");
    
    // Validate chain support - currently only Base has morpho address
    if (chainId !== base.id) {
      throw new Error(`MorphoSupply: Chain ${chainId} not supported. Only Base (${base.id}) is currently supported.`);
    }
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    // Input validation
    if (!asset) {
      throw new Error("MorphoSupply: Asset address is required");
    }
    
    if (asset.toLowerCase() !== this.USDC_BASE.toLowerCase()) {
      throw new Error(`MorphoSupply: Only USDC (${this.USDC_BASE}) is supported on Base`);
    }

    if (amount <= BigInt(0)) {
      throw new Error("MorphoSupply: Amount must be greater than 0");
    }

    // Get morpho contract address (Base chain only)
    const morphoAddress = MORPHO.contracts[base.id].morpho;

    try {
      // Get and validate market parameters
      const marketParams = await this.getMarketParams(this.USDC_MARKET_ID);
      
      // Verify the market's loan token matches our asset
      if (marketParams.loanToken.toLowerCase() !== asset.toLowerCase()) {
        throw new Error(
          `MorphoSupply: Market loan token ${marketParams.loanToken} doesn't match supplied asset ${asset}`
        );
      }

      return [
        // 1. Approve Morpho to spend USDC
        {
          to: asset,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [morphoAddress, amount],
          }),
        },
        // 2. Supply USDC to Morpho market
        {
          to: morphoAddress,
          data: encodeFunctionData({
            abi: MORPHO_ABI,
            functionName: "supply",
            args: [marketParams, amount, BigInt(0), user, toHex("")],
          }),
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`MorphoSupply investCalls failed: ${errorMessage}`);
    }
  }

  async redeemCalls(
    amount: bigint, 
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    // Input validation
    if (amount <= BigInt(0)) {
      throw new Error("MorphoSupply: Amount must be greater than 0");
    }

    const morphoAddress = MORPHO.contracts[base.id].morpho;

    try {
      const marketParams = await this.getMarketParams(this.USDC_MARKET_ID);

      return [
        {
          to: morphoAddress,
          data: encodeFunctionData({
            abi: MORPHO_ABI,
            functionName: "withdraw",
            args: [marketParams, amount, BigInt(0), user, user],
          }),
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`MorphoSupply redeemCalls failed: ${errorMessage}`);
    }
  }

  async getProfit(user: Address, position: Position): Promise<number> {
    if (!position.createAt) {
      console.warn("MorphoSupply: Position creation date missing, returning 0 profit");
      return 0;
    }

    const now = new Date();
    const createdAt = new Date(position.createAt);
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 0;

    // Use updated APY from your documentation (6.7% for MorphoSupply)
    const APY = 0.067; // 6.7%
    const dailyRate = APY / 365;
    const profit = position.amount * dailyRate * diffDays;

    return profit;
  }

  /**
   * Get market parameters from Morpho contract with proper error handling
   * @private
   */
  private async getMarketParams(marketId: Hex) {
    const morphoAddress = MORPHO.contracts[base.id].morpho;

    try {
      const result = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: MORPHO_ABI,
        address: morphoAddress as Address,
        functionName: "idToMarketParams",
        args: [marketId],
      });

      // Validate the response - result is a tuple from the contract
      if (!result) {
        throw new Error("No market parameters returned from contract");
      }

      // The result is already a tuple with named properties from the ABI
      const [loanToken, collateralToken, oracle, irm, lltv] = result as readonly [Address, Address, Address, Address, bigint];

      // Basic validation that addresses are not zero
      if (loanToken === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid market: loan token is zero address");
      }

      return {
        loanToken,
        collateralToken,
        oracle,
        irm,
        lltv,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get market parameters for market ${marketId}: ${errorMessage}`);
    }
  }

  /**
   * Get user's position in the Morpho market (useful for debugging)
   */
  async getUserPosition(user: Address) {
    const morphoAddress = MORPHO.contracts[base.id].morpho;

    try {
      const result = await readContract(coreWagmiConfig, {
        chainId: this.chainId,
        abi: MORPHO_ABI,
        address: morphoAddress as Address,
        functionName: "position",
        args: [this.USDC_MARKET_ID, user],
      });

      const [supplyShares, borrowShares, collateral] = result as readonly [bigint, bigint, bigint];

      return {
        supplyShares,
        borrowShares,
        collateral,
        marketId: this.USDC_MARKET_ID,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get user position: ${errorMessage}`);
    }
  }

  /**
   * Validate if current chain is supported by this strategy
   */
  static isChainSupported(chainId: number): boolean {
    return chainId === base.id;
  }
}
