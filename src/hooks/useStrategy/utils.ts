import axios, { AxiosResponse } from "axios";
import { Address } from "viem";

import { StrategyCall } from "@/classes/strategies/baseStrategy";
import { Protocol } from "@/types/strategies";
import { getTokenAddress } from "@/utils/coins";

import { BaseStrategy } from "@/classes/strategies/baseStrategy";
import { MultiStrategy } from "@/classes/strategies/multiStrategy";
import { Token } from "@/types/blockchain";

export type PositionParams = {
  address: Address;
  amount: number;
  token_name: string;
  chain_id: number;
  strategy: string;
};

type PositionResponse = {
  id: string;
  chain_id: number;
  amount: number;
  strategy: string;
  status: string;
};

export async function getRedeemCalls(
  strategy: BaseStrategy<Protocol> | MultiStrategy,
  amount: bigint,
  user: Address,
  token: Token,
  chainId: number
) {
  let calls: StrategyCall[];

  if (token.isNativeToken) {
    calls = await strategy.redeemCalls(amount, user);
  } else {
    calls = await strategy.redeemCalls(
      amount,
      user,
      getTokenAddress(token, chainId)
    );
  }

  if (calls.length === 0) throw new Error("No calls found");
  return calls;
}

export async function getInvestCalls(
  strategy: BaseStrategy<Protocol> | MultiStrategy,
  amount: bigint,
  user: Address,
  token: Token,
  chainId: number
) {
  let calls: StrategyCall[];

  if (token.isNativeToken) {
    calls = await strategy.investCalls(amount, user);
  } else {
    calls = await strategy.investCalls(
      amount,
      user,
      getTokenAddress(token, chainId)
    );
  }

  if (calls.length === 0) throw new Error("No calls found");
  return calls;
}

import { Position } from "@/types/position";
import { SupportedChainIds } from "@/providers/config";

// ... existing imports ...

/**
 * @notice Update the position in the database, if the position doesn't exist, create a new one
 * @param positionParams - The parameters for the position
 * @returns API Axios response or mock response
 */
export async function updatePosition(positionParams: PositionParams) {
  // Mantle Strategy Special Handling (Mock implementation to bypass 404)
  // If chainId is 5000 (Mantle), we handle it locally since backend might not support it yet
  if (positionParams.chain_id === 5000) {
    console.log("Mocking Mantle position update locally", positionParams);
    
    // Save to local storage for persistence across reloads
    const storageKey = `mantle_positions_${positionParams.address}`;
    const existingData = localStorage.getItem(storageKey);
    let positions: Position[] = existingData ? JSON.parse(existingData) : [];
    
    // Check if position already exists
    const existingIndex = positions.findIndex(p => 
        p.strategy === positionParams.strategy && 
        p.chainId === positionParams.chain_id
    );
    
    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
        // Update existing
        positions[existingIndex].amount += positionParams.amount;
        positions[existingIndex].updatedAt = now;
    } else {
        // Create new
        const newPosition: Position = {
            id: `mantle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createAt: now,
            updatedAt: now,
            userId: "user_" + positionParams.address.slice(0, 8),
            amount: positionParams.amount,
            tokenName: positionParams.token_name,
            chainId: positionParams.chain_id as SupportedChainIds,
            strategy: positionParams.strategy as any,
            status: "true",
            entryPrice: 1,
            strategyId: positionParams.strategy
        };
        positions.push(newPosition);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(positions));
    
    // Return a mock Axios response structure
    return {
        data: { success: true, message: "Mantle position updated locally" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any
    };
  }

  // Standard flow for other chains
  // Check user if have any position
  let res: AxiosResponse;
  try {
    res = await axios.get(
      `${process.env.NEXT_PUBLIC_CHATBOT_URL}/positions/${positionParams.address}`
    );
  } catch {
    return await axios.post(
      `${process.env.NEXT_PUBLIC_CHATBOT_URL}/position`,
      positionParams
    );
  }

  // Check user if have the same position
  const position = res.data.find(
    (pos: PositionResponse) =>
      pos.strategy === positionParams.strategy &&
      pos.status === "true" &&
      pos.chain_id === positionParams.chain_id
  );
  if (!position) {
    return await axios.post(
      `${process.env.NEXT_PUBLIC_CHATBOT_URL}/position`,
      positionParams
    );
  } else {
    const newAmount = Number(position.amount) + positionParams.amount;
    return await axios.patch(
      `${process.env.NEXT_PUBLIC_CHATBOT_URL}/positions/${position.position_id}`,
      {
        amount: newAmount,
      }
    );
  }
}
