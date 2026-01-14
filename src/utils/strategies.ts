import { base, bsc, mainnet } from "viem/chains";

import {
  GetProtocolChains,
  Protocol,
  type Strategy,
  StrategyMetadata,
} from "@/types";
import {
  BNB,
  ETH,
  FLUID,
  MORPHO,
  PERMIT_EXPIRY,
  STRATEGIES_METADATA,
  UNISWAP,
  wbETH,
  wstETH,
} from "@/constants";
import {
  BaseStrategy,
  MorphoSupply,
  UniswapV3SwapLST,
  AaveV3Supply,
  FluidSupply,
  Re7Strategy,
  BBQStrategy,
  CSStrategy,
  ExtraFiStrategy,
  SteakhousePrimeStrategy,
  HighYieldClearStarStrategy,
  StCeloStaking,
  AnkrFlowStaking,
  IporFusionSupply,
  AvantisVaultSupply,
  HarvestVaultSupply,
  CianVaultSupply,
  USDCYieldStrategy,
} from "@/classes/strategies";
import { AAVE } from "@/constants/protocols/aave";
import { ANKR } from "@/constants/protocols/ankr";
import { IPOR } from "@/constants/protocols/ipor";
import { AVANTIS } from "@/constants/protocols/avantis";
import { HARVEST } from "@/constants/protocols/harvest";
import { CIAN } from "@/constants/protocols/cian";
import { USDC_YIELD } from "@/constants/protocols/usdcYield";

export function isChainSupported<T extends Protocol>(
  protocol: T,
  chainId: number
): chainId is GetProtocolChains<T> {
  return Object.keys(protocol.contracts).map(Number).includes(chainId);
}

export function getDeadline(): bigint {
  const timestampInSeconds = Math.floor(Date.now() / 1000);
  return BigInt(timestampInSeconds) + BigInt(PERMIT_EXPIRY);
}

/**
 * @dev Only used in `getStrategy`
 * @dev Allow `as`, because check chainId if supported before create strategy instance
 */
const STRATEGY_CONFIGS: Record<
  | "MorphoSupply"
  | "AaveV3Supply"
  | "AaveV3SupplyLeveraged"
  | "AaveV3SupplyBSC"
  | "AaveV3SupplyCelo"
  | "AaveV3SupplyUSDTCelo"
  | "AaveV3SupplyPolygon"
  | "AaveV3SupplyArbitrum"
  | "FluidSupply"
  | "Re7Strategy"
  | "BBQStrategy"
  | "CSStrategy"
  | "ExtraFiStrategy"
  | "SteakhousePrimeStrategy"
  | "HighYieldClearStarStrategy"
  | "IporFusionSupply"
  | "AvantisVaultSupply"
  | "HarvestFortyAcresUSDC"
  | "HarvestAutopilotUSDC"
  | "CianVaultSupply"
  | "USDCYieldStrategy"
  | "StCeloStaking"
  | "AnkrFlowStaking"
  | "UniswapV3AddLiquidity"
  | "CamelotStaking"
  | "GMXDeposit"
  | "MultiStrategy",
  {
    protocol: Protocol;
    factory: (chainId: GetProtocolChains<Protocol>) => BaseStrategy<Protocol>;
  }
> = {
  MorphoSupply: {
    protocol: MORPHO,
    factory: (chainId) =>
      new MorphoSupply(chainId as GetProtocolChains<typeof MORPHO>),
  },
  AaveV3Supply: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  AaveV3SupplyLeveraged: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>), // Uses same class as regular AaveV3Supply
  },
  AaveV3SupplyBSC: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  AaveV3SupplyCelo: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  AaveV3SupplyUSDTCelo: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  AaveV3SupplyPolygon: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  AaveV3SupplyArbitrum: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },
  FluidSupply: {
    protocol: FLUID,
    factory: (chainId) =>
      new FluidSupply(chainId as GetProtocolChains<typeof FLUID>),
  },
  Re7Strategy: {
    protocol: MORPHO,
    factory: (chainId) => {
      // Re7Strategy runs on Base network
      console.log('🔧 Re7Strategy factory called with:', { chainId });
      return new Re7Strategy(chainId as GetProtocolChains<typeof MORPHO>);
    },
  },
  BBQStrategy: {
    protocol: MORPHO,
    factory: (chainId) =>
      new BBQStrategy(chainId as GetProtocolChains<typeof MORPHO>),
  },
  CSStrategy: {
    protocol: MORPHO,
    factory: (chainId) =>
      new CSStrategy(chainId as GetProtocolChains<typeof MORPHO>),
  },
  ExtraFiStrategy: {
    protocol: MORPHO,
    factory: (chainId) =>
      new ExtraFiStrategy(chainId as GetProtocolChains<typeof MORPHO>),
  },
  SteakhousePrimeStrategy: {
    protocol: MORPHO,
    factory: (chainId) =>
      new SteakhousePrimeStrategy(chainId as GetProtocolChains<typeof MORPHO>),
  },
  HighYieldClearStarStrategy: {
    protocol: MORPHO,
    factory: (chainId) =>
      new HighYieldClearStarStrategy(chainId as GetProtocolChains<typeof MORPHO>),
  },
  IporFusionSupply: {
    protocol: IPOR,
    factory: (chainId) =>
      new IporFusionSupply(chainId as GetProtocolChains<typeof IPOR>),
  },
  AvantisVaultSupply: {
    protocol: AVANTIS,
    factory: (chainId) =>
      new AvantisVaultSupply(chainId as GetProtocolChains<typeof AVANTIS>),
  },
  HarvestFortyAcresUSDC: {
    protocol: HARVEST,
    factory: (chainId) =>
      new HarvestVaultSupply(
        chainId as GetProtocolChains<typeof HARVEST>,
        "fortyAcresUSDC"
      ),
  },
  HarvestAutopilotUSDC: {
    protocol: HARVEST,
    factory: (chainId) =>
      new HarvestVaultSupply(
        chainId as GetProtocolChains<typeof HARVEST>,
        "autopilotUSDC"
      ),
  },
  CianVaultSupply: {
    protocol: CIAN,
    factory: (chainId) =>
      new CianVaultSupply(chainId as GetProtocolChains<typeof CIAN>),
  },
  USDCYieldStrategy: {
    protocol: USDC_YIELD,
    factory: (chainId) =>
      new USDCYieldStrategy(chainId as GetProtocolChains<typeof USDC_YIELD>),
  },

  // Celo strategies
  StCeloStaking: {
    protocol: AAVE,
    factory: (chainId) =>
      new AaveV3Supply(chainId as GetProtocolChains<typeof AAVE>),
  },

  // Flow strategies
  AnkrFlowStaking: {
    protocol: ANKR,
    factory: (chainId) =>
      new AnkrFlowStaking(chainId as GetProtocolChains<typeof ANKR>),
  },

  UniswapV3AddLiquidity: {
    protocol: UNISWAP,
    factory: () => {
      throw new Error("UniswapV3AddLiquidity not implemented yet");
    },
  },
  CamelotStaking: {
    protocol: MORPHO, // 暫時用 MORPHO，實際應該是 CAMELOT 協議
    factory: () => {
      throw new Error("CamelotStaking not implemented yet");
    },
  },
  GMXDeposit: {
    protocol: MORPHO, // 暫時用 MORPHO，實際應該是 GMX 協議
    factory: () => {
      throw new Error("GMXDeposit not implemented yet");
    },
  },
  MultiStrategy: {
    protocol: MORPHO, // MultiStrategy is special - it can combine multiple protocols
    factory: (chainId) => {
      // For now, create a simple multi-strategy with default components
      // This should be refactored to accept strategy compositions as parameters
      throw new Error("MultiStrategy requires specific strategy composition - use MultiStrategyManager instead");
    },
  },
};

export function getStrategy<
  T extends keyof typeof STRATEGY_CONFIGS
>(
  strategy: T,
  chainId: number
): BaseStrategy<Protocol> {
  let config = STRATEGY_CONFIGS[strategy];

  // Fallback: If strategy ID is not found in config, try to match by Title or legacy IDs
  // This handles cases where strategy title was stored instead of ID (e.g. legacy data)
  if (!config) {
    const metadata = STRATEGIES_METADATA.find((s) => s.title === (strategy as unknown as string));
    if (metadata && STRATEGY_CONFIGS[metadata.id as keyof typeof STRATEGY_CONFIGS]) {
      config = STRATEGY_CONFIGS[metadata.id as keyof typeof STRATEGY_CONFIGS];
    }
    
    // Explicit legacy mapping for Harvest strategies which might be stored with different keys
    if ((strategy as unknown as string) === "HarvestVaultSupply_fortyAcresUSDC") {
       config = STRATEGY_CONFIGS["HarvestFortyAcresUSDC"];
    }
    if ((strategy as unknown as string) === "HarvestVaultSupply_autopilotUSDC") {
       config = STRATEGY_CONFIGS["HarvestAutopilotUSDC"];
    }
  }

  try {
    if (!config) {
       throw new Error(`Strategy config not found for ${strategy}`);
    }

    // All active strategies operate directly on their native chains
    if (isChainSupported(config.protocol, chainId)) {
      return config.factory(chainId);
    }
    throw new Error(`Strategy ${strategy} not found on chain ${chainId}`);
  } catch (error) {
    console.error(error);
    throw new Error(`Strategy ${strategy} not found on chain ${chainId}`);
  }
}

export function getStrategyMetadata(
  strategy: Strategy,
  chainId: number
): StrategyMetadata {
  let strategyMetadata = STRATEGIES_METADATA.find(
    (s) => s.id === strategy && s.chainId === chainId
  );

  // Fallback 1: Match by Title (legacy data fix)
  if (!strategyMetadata) {
    strategyMetadata = STRATEGIES_METADATA.find(
      (s) => s.title === (strategy as unknown as string) && s.chainId === chainId
    );
  }

  // Fallback 2: Match by ID ignoring ChainID (cross-chain display)
  if (!strategyMetadata) {
    strategyMetadata = STRATEGIES_METADATA.find(
      (s) => s.id === strategy
    );
  }

  // Fallback 3: Match by Title ignoring ChainID
  if (!strategyMetadata) {
    strategyMetadata = STRATEGIES_METADATA.find(
      (s) => s.title === (strategy as unknown as string)
    );
  }

  if (!strategyMetadata) {
    console.warn(`Strategy metadata not found for ${strategy} on chain ${chainId}. Using fallback.`);
    // Return a dummy metadata to prevent UI crash
    // We need to import constants but we are inside a function.
    // Ideally we should import them at top level.
    // For now, let's try to return the first available strategy as a safe fallback
    // or construct a minimal valid object if imports are available.
    if (STRATEGIES_METADATA.length > 0) {
        return {
            ...STRATEGIES_METADATA[0],
            title: `Unknown (${strategy})`,
            id: strategy,
            chainId: chainId
        };
    }
    throw new Error(`Strategy metadata not found for ${strategy}`);
  }
  
  return strategyMetadata;
}
