import { createConfig } from "@privy-io/wagmi";
import { createConfig as createCoreConfig } from "@wagmi/core";
import { celo, flowMainnet, base, bsc, arbitrum, polygon, mainnet, mantle } from "viem/chains";
import { http } from "wagmi";

export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Check if Alchemy API key is available
const hasAlchemyKey = !!ALCHEMY_API_KEY;

// Fallback to public RPC endpoints if Alchemy key is missing
const getHttpTransport = (chainId: number, alchemyUrl?: string) => {
  if (hasAlchemyKey && alchemyUrl) {
    return http(`${alchemyUrl}/${ALCHEMY_API_KEY}`);
  }
  
  // Fallback to public RPC endpoints
  switch (chainId) {
    case mainnet.id:
      return http("https://eth-mainnet.public.blastapi.io");
    case base.id:
      return http("https://mainnet.base.org");
    case arbitrum.id:
      return http("https://arb1.arbitrum.io/rpc");
    case polygon.id:
      return http("https://polygon-rpc.com");
    case bsc.id:
      return http("https://bsc-dataseed1.binance.org");
    case celo.id:
      return http("https://forno.celo.org");
    case flowMainnet.id:
      return http("https://access-mainnet-beta.onflow.org");
    case mantle.id:
      return http("https://1rpc.io/mantle");
    default:
      return http();
  }
};

// Privy wagmi config (for WagmiProvider)
export const wagmiConfig = createConfig({
  chains: [base, mantle, mainnet, arbitrum, celo, flowMainnet, bsc, polygon],
  transports: {
    [mainnet.id]: getHttpTransport(mainnet.id, "https://eth-mainnet.g.alchemy.com/v2"),
    [celo.id]: getHttpTransport(celo.id, "https://celo-mainnet.g.alchemy.com/v2"),
    [flowMainnet.id]: getHttpTransport(flowMainnet.id, "https://flow-mainnet.g.alchemy.com/v2"),
    [base.id]: getHttpTransport(base.id, "https://base-mainnet.g.alchemy.com/v2"),
    [bsc.id]: getHttpTransport(bsc.id, "https://bnb-mainnet.g.alchemy.com/v2"),
    [arbitrum.id]: getHttpTransport(arbitrum.id, "https://arb-mainnet.g.alchemy.com/v2"),
    [polygon.id]: getHttpTransport(polygon.id, "https://polygon-mainnet.g.alchemy.com/v2"),
    [mantle.id]: getHttpTransport(mantle.id), // Mantle doesn't have a default Alchemy URL in this pattern usually, or I can check. For now use public/fallback.
  },
});

// Regular wagmi config (for @wagmi/core functions like readContract)
export const coreWagmiConfig = createCoreConfig({
  chains: [base, mantle, mainnet, arbitrum, celo, flowMainnet, bsc, polygon],
  transports: {
    [mainnet.id]: getHttpTransport(mainnet.id, "https://eth-mainnet.g.alchemy.com/v2"),
    [celo.id]: getHttpTransport(celo.id, "https://celo-mainnet.g.alchemy.com/v2"),
    [flowMainnet.id]: getHttpTransport(flowMainnet.id, "https://flow-mainnet.g.alchemy.com/v2"),
    [base.id]: getHttpTransport(base.id, "https://base-mainnet.g.alchemy.com/v2"),
    [bsc.id]: getHttpTransport(bsc.id, "https://bnb-mainnet.g.alchemy.com/v2"),
    [arbitrum.id]: getHttpTransport(arbitrum.id, "https://arb-mainnet.g.alchemy.com/v2"),
    [polygon.id]: getHttpTransport(polygon.id, "https://polygon-mainnet.g.alchemy.com/v2"),
    [mantle.id]: getHttpTransport(mantle.id),
  },
});

// Create a mapped type for chain IDs from wagmiConfig.chains
export type SupportedChainIds = (typeof wagmiConfig.chains)[number]["id"];

// Helper function to validate chain support
export function isSupportedChain(chainId: number): chainId is SupportedChainIds {
  return wagmiConfig.chains.some(chain => chain.id === chainId);
}

// Log configuration status
if (typeof window !== 'undefined') {
  console.log(`🔗 Blockchain config: ${hasAlchemyKey ? 'Alchemy API' : 'Public RPC'} endpoints`);
}
