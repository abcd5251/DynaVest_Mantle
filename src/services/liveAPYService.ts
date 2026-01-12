/**
 * Live APY Fetching Service
 * Fetches real-time APY data from DeFiLlama yields API
 * Primary source: https://yields.llama.fi/pools
 */

export interface LiveAPYData {
  strategyId: string;
  apy: number;
  source: string;
  lastUpdated: string;
  success: boolean;
  error?: string;
}

interface DeFiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  pool: string;
}

interface StrategyMapping {
  chain: string;
  project: string;
  symbol?: string;
  fallbackAPY: number;
}

class LiveAPYService {
  private cache: Map<string, { data: LiveAPYData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Strategy to DeFiLlama pool mapping
   * Chain names: Must match DeFiLlama exactly (e.g., "Binance" not "BSC")
   * Project names: Lowercase hyphenated (e.g., "aave-v3", "morpho")
   * Note: Some strategies may not have good DeFiLlama coverage, will use fallback
   */
  private readonly STRATEGY_MAPPINGS: Record<string, StrategyMapping> = {
    // Base chain strategies (main bot focus)
    'AaveV3Supply': {
      chain: 'Base',
      project: 'aave-v3',
      symbol: 'USDC',
      fallbackAPY: 4.5,
    },
    'AaveV3SupplyLeveraged': {
      chain: 'Base',
      project: 'aave-v3',
      symbol: 'USDC',
      fallbackAPY: 8.0, // ~2x leveraged
    },
    'MorphoSupply': {
      chain: 'Base',
      project: 'morpho-blue', // Try morpho-blue instead of morpho
      symbol: 'USDC',
      fallbackAPY: 8.5,
    },
    'FluidSupply': {
      chain: 'Base',
      project: 'fluid',
      symbol: 'USDC',
      fallbackAPY: 5.7,
    },
    'Re7Strategy': {
      chain: 'Base',
      project: 'morpho-v1', // Re7 vault on Morpho v1
      symbol: 'RE7USDC',
      fallbackAPY: 8.2,
    },
    'IporFusionSupply': {
      chain: 'Base',
      project: 'ipor-fusion', // yoUSD Loooper vault
      symbol: 'USDC',
      fallbackAPY: 18.9,
    },
    'AvantisVaultSupply': {
      chain: 'Base',
      project: 'avantis', // Perpetuals vault
      symbol: 'USDC',
      fallbackAPY: 20.2,
    },

    // Other chains
    'StCeloStaking': {
      chain: 'Celo',
      project: 'aave-v3', // Using AAVE V3 USDC on Celo instead of stCELO (better DeFiLlama coverage)
      symbol: 'USDC',
      fallbackAPY: 3.3,
    },
    'AaveV3SupplyCelo': {
      chain: 'Celo',
      project: 'aave-v3',
      symbol: 'CELO',
      fallbackAPY: 2.5,
    },
    'AaveV3SupplyBSC': {
      chain: 'Binance',
      project: 'aave-v3',
      symbol: 'WBNB',
      fallbackAPY: 1.6,
    },
    'AaveV3SupplyPolygon': {
      chain: 'Polygon',
      project: 'aave-v3',
      symbol: 'USDC',
      fallbackAPY: 3.8,
    },
    'AaveV3SupplyArbitrum': {
      chain: 'Arbitrum',
      project: 'aave-v3',
      symbol: 'USDC',
      fallbackAPY: 4.2,
    },
    'AnkrFlowStaking': {
      chain: 'Flow',
      project: 'ankr-staking', // Try ankr-staking or ankr-liquid-staking
      fallbackAPY: 10.8,
    },
    'AsterdexBNBStaking': {
      chain: 'Binance',
      project: 'asterdex',
      symbol: 'BNB',
      fallbackAPY: 6.0,
    },
  };

  /**
   * Fetch live APY for all strategies from DeFiLlama
   */
  async fetchAllAPYs(): Promise<Map<string, number>> {
    const apyMap = new Map<string, number>();

    try {
      // Fetch all pools from DeFiLlama
      const response = await fetch('https://yields.llama.fi/pools', {
        headers: {
          'User-Agent': 'DynaVest/1.0',
        },
      });

      if (!response.ok) {
        console.error('❌ DeFiLlama API failed, using fallback values');
        return this.getFallbackAPYs();
      }

      const data = await response.json();
      const pools: DeFiLlamaPool[] = data.data || [];

      console.log(`📊 Fetched ${pools.length} pools from DeFiLlama`);

      // Debug: Log available projects on our chains
      this.logAvailableProjects(pools);

      // Match pools to our strategies
      for (const [strategyId, mapping] of Object.entries(this.STRATEGY_MAPPINGS)) {
        const matchedPool = this.findMatchingPool(pools, mapping);

        if (matchedPool) {
          const apy = this.calculateAPY(strategyId, matchedPool);
          apyMap.set(strategyId, apy);

          console.log(`✅ ${strategyId}: ${apy}% (${matchedPool.project} on ${matchedPool.chain}, TVL: $${(matchedPool.tvlUsd / 1e6).toFixed(1)}M)`);

          // Cache the result
          const liveData: LiveAPYData = {
            strategyId,
            apy,
            source: 'defillama',
            lastUpdated: new Date().toISOString(),
            success: true,
          };
          this.setCache(liveData);
        } else {
          // Use fallback APY if pool not found
          console.log(`⚠️  ${strategyId}: No pool found (looking for ${mapping.project} on ${mapping.chain}), using fallback: ${mapping.fallbackAPY}%`);
          apyMap.set(strategyId, mapping.fallbackAPY);
        }
      }

      console.log(`✅ Fetched ${apyMap.size} live APY rates`);
      return apyMap;

    } catch (error) {
      console.error('❌ Error fetching live APYs:', error);
      return this.getFallbackAPYs();
    }
  }

  /**
   * Debug helper: Log available projects on each chain
   */
  private logAvailableProjects(pools: DeFiLlamaPool[]): void {
    const targetChains = ['Base', 'Celo', 'Binance', 'Flow', 'Polygon', 'Arbitrum'];

    console.log('\n🔍 Available projects on target chains:');

    for (const chain of targetChains) {
      const chainPools = pools.filter(p => p.chain === chain);
      const projects = new Set(chainPools.map(p => p.project));

      if (projects.size > 0) {
        console.log(`  ${chain}: ${Array.from(projects).sort().join(', ')}`);
      }
    }
    console.log('');
  }

  /**
   * Find matching pool in DeFiLlama data
   */
  private findMatchingPool(pools: DeFiLlamaPool[], mapping: StrategyMapping): DeFiLlamaPool | null {
    // Filter by chain and project
    const candidates = pools.filter(pool =>
      pool.chain === mapping.chain &&
      pool.project === mapping.project
    );

    if (candidates.length === 0) return null;

    // If symbol specified, filter by symbol
    if (mapping.symbol) {
      const symbolMatch = candidates.find(pool =>
        pool.symbol?.toUpperCase().includes(mapping.symbol!.toUpperCase())
      );
      if (symbolMatch) return symbolMatch;
    }

    // Return highest TVL pool if multiple matches
    return candidates.sort((a, b) => b.tvlUsd - a.tvlUsd)[0];
  }

  /**
   * Calculate APY for specific strategy
   * Special handling for leveraged and vault strategies
   */
  private calculateAPY(strategyId: string, pool: DeFiLlamaPool): number {
    let apy = pool.apy;

    // Special cases
    if (strategyId === 'AaveV3SupplyLeveraged') {
      // Leveraged strategy gets ~2x the base APY
      const basePool = pool.apyBase || pool.apy;
      apy = basePool * 2;
    } else if (strategyId === 'Re7Strategy') {
      // Re7 is a specific Morpho vault, might need to find exact vault
      // For now use the best Morpho USDC pool on Base
      apy = pool.apy;
    }

    return Math.round(apy * 10) / 10;
  }

  /**
   * Get fallback APYs when API fails
   */
  private getFallbackAPYs(): Map<string, number> {
    const fallbackMap = new Map<string, number>();

    for (const [strategyId, mapping] of Object.entries(this.STRATEGY_MAPPINGS)) {
      fallbackMap.set(strategyId, mapping.fallbackAPY);
    }

    console.log('📊 Using fallback APY values');
    return fallbackMap;
  }

  /**
   * Get cached data if available and not expired
   */
  private getCached(strategyId: string): LiveAPYData | null {
    const cached = this.cache.get(strategyId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache APY data
   */
  private setCache(data: LiveAPYData): void {
    this.cache.set(data.strategyId, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const liveAPYService = new LiveAPYService();
