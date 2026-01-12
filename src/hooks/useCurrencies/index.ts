import { useCallback } from "react";
import { useChainId } from "wagmi";
import { getBalance } from "@wagmi/core";
import { useQuery } from "@tanstack/react-query";

import { wagmiConfig as config } from "@/providers/config";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { Token } from "@/types";
import { getTokenAddress, isTokenSupportedOnChain } from "@/utils/coins";

export interface TokenData {
  token: Token;
  balance: bigint;
}

// Define chains that are supported by smart wallets in Privy dashboard
const SMART_WALLET_SUPPORTED_CHAINS = [
  8453, // Base
  // Add other chain IDs that are configured in your Privy dashboard
  // 1, // Ethereum - commented out until configured in dashboard
];

export default function useCurrencies(tokens: Token[] = []) {
  const { client } = useSmartWallets();
  const chainId = useChainId();

  const initialTokensData = tokens.map((token) => ({
    token,
    balance: BigInt(0),
  }));

  const fetchBalances = useCallback(
    async (tokensData: TokenData[]): Promise<TokenData[]> => {
      if (!client || !tokens || tokens.length === 0) return tokensData;

      // Only switch chain if it's supported by smart wallets
      if (SMART_WALLET_SUPPORTED_CHAINS.includes(chainId)) {
        try {
          await client.switchChain({ id: chainId });
        } catch (error) {
          console.error(`Failed to switch smart wallet to chain ${chainId}:`, error);
          // For unsupported chains, we can still try to fetch balances without switching
        }
      }

      const user = client.account.address;
      if (!user) return tokensData;

      const balancePromises = tokensData.map(async (tokenData, index) => {
        const token = tokenData.token;

        // Skip tokens not supported on this chain
        if (!isTokenSupportedOnChain(token, chainId)) {
          console.log(`Token ${token.name} not supported on chain ${chainId}, skipping balance fetch`);
          tokensData[index].balance = BigInt(0);
          return;
        }

        try {
          const params = {
            address: user,
            ...(token.isNativeToken
              ? {}
              : { token: getTokenAddress(token, chainId) }),
          };

          const { value } = await getBalance(config, params);
          tokensData[index].balance = value;
        } catch (error) {
          console.error(`Failed to fetch balance for ${token.name} on chain ${chainId}:`, error);
          // Keep the default balance of 0
        }
      });

      await Promise.all(balancePromises);
      return tokensData;
    },
    [client, tokens, chainId]
  );

  // Use a single React Query for fetching and caching all token data
  return useQuery({
    queryKey: ["tokenData", chainId, tokens.map((t) => t.name).join(",")],
    queryFn: () => fetchBalances(initialTokensData),
    enabled: tokens.length > 0 && !!client,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    placeholderData: initialTokensData,
    retry: 2,
    throwOnError: (error) => {
      console.error("TokensQuery", error);
      return false;
    },
  });
}
