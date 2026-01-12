import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { Token } from "@/types";
import { fetchTokensPrices } from "../../hooks/useBalance/utils";

export function useBatchTokenPrices(tokens: Token[]) {
  const account = useAccount();

  // Safety check to prevent undefined error
  const safeTokens = tokens || [];

  return useQuery({
    queryKey: ["batchTokenPrices", safeTokens.map((t) => t.name).sort()],
    queryFn: () => fetchTokensPrices(safeTokens),
    enabled: safeTokens.length > 0,
    placeholderData: {},
    retry: 2, // Retry up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 60000, // Consider data fresh for 1 minute
    
    // Don't throw errors - return empty object instead
    throwOnError: false,
  });
}
