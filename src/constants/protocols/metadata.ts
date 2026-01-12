// Protocol metadata with status information
export const PROTOCOLS_METADATA: Record<
  string,
  { icon: string; description: string; status: 'active' | 'coming_soon' }
> = {
  Aave: {
    icon: "/crypto-icons/aave.svg",
    description: "Most popular lending protocol on EVM",
    status: "active",
  },
  Morpho: {
    icon: "/crypto-icons/morpho.svg",
    description: "Lending protocol for lending and borrowing assets",
    status: "active",
  },
  UniswapV3: {
    icon: "/crypto-icons/uniswap.svg",
    description: "Leading decentralized exchange with concentrated liquidity",
    status: "active",
  },
  Fluid: {
    icon: "/crypto-icons/fluid.svg",
    description: "Advanced lending protocol with dynamic parameters",
    status: "active",
  },
  Camelot: {
    icon: "/crypto-icons/camelot.svg",
    description: "DEX and yield farming protocol on Arbitrum",
    status: "coming_soon",
  },
  StCelo: {
    icon: "/crypto-icons/celo.svg",
    description: "Liquid staking protocol for CELO tokens",
    status: "active",
  },
  GMX: {
    icon: "/crypto-icons/gmx.svg",
    description: "Decentralized perpetual exchange",
    status: "coming_soon",
  },
  Lido: {
    icon: "/crypto-icons/lido.png",
    description: "Liquid staking protocol for ETH",
    status: "coming_soon",
  },
  CIAN: {
    icon: "/crypto-icons/cian.svg",
    description: "Yield Layer of DeFi",
    status: "active",
  },
};

export const STRATEGIES_PROTOCOLS_MAPPING: Record<
  string,
  { icon: string; description: string; status: 'active' | 'coming_soon' }
> = {
  AaveV3Supply: PROTOCOLS_METADATA.Aave,
  MorphoSupply: PROTOCOLS_METADATA.Morpho,
  CamelotStaking: PROTOCOLS_METADATA.Camelot,
  StCeloStaking: PROTOCOLS_METADATA.StCelo,
  GMXDeposit: PROTOCOLS_METADATA.GMX,
  UniswapV3SwapLST: PROTOCOLS_METADATA.Lido,
  UniswapV3AddLiquidity: PROTOCOLS_METADATA.UniswapV3,
  FluidSupply: PROTOCOLS_METADATA.Fluid,
  CianVaultSupply: PROTOCOLS_METADATA.CIAN,
};

export function getProtocolMetadata(strategy: string) {
  const protocol = STRATEGIES_PROTOCOLS_MAPPING[strategy];
  if (!protocol) {
    throw new Error(`Protocol ${strategy} not found`);
  }

  return protocol;
}

export function isProtocolActive(protocolName: string): boolean {
  const protocol = PROTOCOLS_METADATA[protocolName];
  return protocol?.status === 'active';
}

export function getActiveProtocols() {
  return Object.entries(PROTOCOLS_METADATA)
    .filter(([_, data]) => data.status === 'active')
    .map(([name, data]) => ({ name, ...data }));
}

export function getComingSoonProtocols() {
  return Object.entries(PROTOCOLS_METADATA)
    .filter(([_, data]) => data.status === 'coming_soon')
    .map(([name, data]) => ({ name, ...data }));
}
