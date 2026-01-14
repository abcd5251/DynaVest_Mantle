import { Address, encodeFunctionData } from "viem";
import { USDC_YIELD } from "@/constants/protocols/usdcYield";
import { ERC20_ABI } from "@/constants/abis/erc20";
import { BaseStrategy, StrategyCall } from "../baseStrategy";
import { GetProtocolChains } from "@/types/strategies";
import { Position } from "@/types/position";

/**
 * @notice USDCYieldStrategy - USDC Yield Layer on Mantle
 */
export class USDCYieldStrategy extends BaseStrategy<typeof USDC_YIELD> {
  // Assuming a vault or router address for USDC Yield - this needs to be verified
  // For now using a placeholder that matches the script or similar logic
  private readonly VAULT_ADDRESS = "0x319B69888b0d11cEC22caA5034e25FfFBDc88421"; // Agni Router from script as placeholder

  constructor(chainId: GetProtocolChains<typeof USDC_YIELD>) {
    super(chainId, USDC_YIELD, "USDCYieldStrategy");
  }

  async investCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    if (!asset)
      throw new Error("USDCYieldStrategy: asset parameter is required");

    // This is a placeholder implementation matching the script logic concept
    // Ideally this should use the specific contract calls for USDC Yield
    return [
      {
        to: asset,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [this.VAULT_ADDRESS, amount],
        }),
      },
      // Actual deposit call would go here
    ];
  }

  async redeemCalls(
    amount: bigint,
    user: Address,
    asset?: Address
  ): Promise<StrategyCall[]> {
    // Placeholder withdrawal logic
    return [];
  }

  async getProfit(user: Address, position: Position): Promise<number> {
    // Placeholder profit calculation
    return 0;
  }
}
