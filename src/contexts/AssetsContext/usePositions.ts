import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Position } from "@/types/position";
import { Strategy } from "@/types/strategies";
import { SupportedChainIds } from "@/providers/config";

type PositionResponse = {
  position_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  amount: number;
  token_name: string;
  chain_id: number;
  strategy: string;
  status: string;
};

const getPositions = async (address: string): Promise<Position[]> => {
  // Check if backend URL is configured
  if (!process.env.NEXT_PUBLIC_CHATBOT_URL) {
    console.warn("NEXT_PUBLIC_CHATBOT_URL not configured - positions feature disabled");
    return [];
  }

  try {
    const response = await axios.get<PositionResponse[]>(
      `${process.env.NEXT_PUBLIC_CHATBOT_URL}/positions/${address}`,
      {
        timeout: 5000, // 5 second timeout
      }
    );
    
    // Check if we need to add mock Mantle positions
    // This uses a local storage key to persist the mock positions across reloads
    const storedMantlePositions = localStorage.getItem(`mantle_positions_${address}`);
    let mantlePositions: Position[] = [];
    
    if (storedMantlePositions) {
        try {
            mantlePositions = JSON.parse(storedMantlePositions);
        } catch (e) {
            console.error("Failed to parse mantle positions", e);
        }
    }

    const backendPositions: Position[] = response.data.map((position) => ({
      id: position.position_id,
      createAt: position.created_at,
      strategy: position.strategy as Strategy,
      tokenName: position.token_name,
      amount: position.amount,
      chainId: position.chain_id as SupportedChainIds,
      status: position.status,
      entryPrice: 1, // Default to 1 if not provided by backend yet
      updatedAt: position.updated_at,
      userId: position.user_id,
      strategyId: position.strategy // Using strategy enum as ID for now
    }));
    
    return [...backendPositions, ...mantlePositions];
  } catch (error) {
    console.warn("Backend API not available - using local mock data if available", error);
    
    // Fallback to local storage even if backend fails
    const storedMantlePositions = localStorage.getItem(`mantle_positions_${address}`);
    if (storedMantlePositions) {
        try {
            return JSON.parse(storedMantlePositions);
        } catch (e) {
            console.error("Failed to parse mantle positions", e);
        }
    }
    
    return [];
  }
};

export const usePositions = () => {
  const { client } = useSmartWallets();
  const address = client?.account?.address;

  return useQuery({
    queryKey: ["positions", address],
    queryFn: () => getPositions(address || ""),
    enabled: !!address && !!process.env.NEXT_PUBLIC_CHATBOT_URL,
    retry: false, // Don't retry failed requests
    throwOnError: false, // Don't throw errors - return empty data instead
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
