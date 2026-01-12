import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useCallback } from "react";

export const useSmartWalletChainSupport = () => {
  const { client } = useSmartWallets();

  const checkChainSupport = useCallback(
    async (chainId: number): Promise<boolean> => {
      if (!client) return false;

      try {
        await client.switchChain({ id: chainId });
        return true;
      } catch (error) {
        console.warn(`Chain ${chainId} not supported by smart wallet:`, error);
        return false;
      }
    },
    [client]
  );

  return { checkChainSupport };
};
