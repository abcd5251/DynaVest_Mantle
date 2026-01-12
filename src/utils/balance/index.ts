import { Address, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/providers/config";
import { ERC20_ABI } from "@/constants/abis/erc20";
import { FLUID_ABI } from "@/constants/abis/fluid";
import { MORPHO_ABI } from "@/constants/abis/morpho";
import { getStrategy } from "@/utils/strategies";
import { getTokenByName } from "@/utils/coins";
import type { Position } from "@/types/position";
import type { Strategy } from "@/types/strategies";

/**
 * Get the actual redeemable balance for a position from the blockchain
 * This prevents "burn amount exceeds balance" errors
 */
export async function getActualRedeemableBalance(position: Position): Promise<{
  actualBalance: number;
  canRedeem: boolean;
  balanceInWei: bigint;
}> {
  try {
    const strategy = getStrategy(position.strategy as Strategy, position.chainId);
    const token = getTokenByName(position.tokenName);
    
    // Get strategy-specific balance based on protocol
    let actualBalanceWei: bigint = BigInt(0);
    
    if (position.strategy === 'FluidSupply') {
      // For Fluid: check fUSDC balance (shares)
      const fluidAddress = strategy.getAddress('fUSDC');
      actualBalanceWei = await readContract(wagmiConfig, {
        address: fluidAddress,
        abi: FLUID_ABI