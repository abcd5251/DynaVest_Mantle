import { NextResponse } from 'next/server';

// For now, let's create a simple mock that returns realistic live-looking data
// We can replace this with real API calls once we figure out the correct Morpho schema

const MOCK_LIVE_DATA = {
  SmokehouseStrategy: {
    apy: 10.83, // Based on your screenshot
    tvl: 177.16, // Based on your screenshot  
    dailyRate: 0.0297,
    lastUpdated: new Date().toISOString(),
    source: 'morpho'
  },
  Re7Strategy: {
    apy: 8.85,
    tvl: 45.2,
    dailyRate: 0.0242,
    lastUpdated: new Date().toISOString(),
    source: 'morpho'
  },
  MevCapitalStrategy: {
    apy: 9.12,
    tvl: 89.7,
    dailyRate: 0.0250,
    lastUpdated: new Date().toISOString(),
    source: 'morpho'
  },
  MorphoSupply: {
    apy: 7.34,
    tvl: 12.8,
    dailyRate: 0.0201,
    lastUpdated: new Date().toISOString(),
    source: 'morpho'
  },
  // AAVE strategies (fallback data)
  AaveV3Supply: {
    apy: 6.1,
    tvl: 94.3,
    dailyRate: 0.0167,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  AaveV3SupplyLeveraged: {
    apy: 10.1,
    tvl: 41.2,
    dailyRate: 0.0277,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  // Fluid strategy (fallback data)
  FluidSupply: {
    apy: 6.23,
    tvl: 92.1,
    dailyRate: 0.0171,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  // Coming soon strategies (fallback data)
  UniswapV3SwapLST: {
    apy: 2.8,
    tvl: 15.4,
    dailyRate: 0.0077,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  AaveV3SupplyArbitrum: {
    apy: 4.5,
    tvl: 23.1,
    dailyRate: 0.0123,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  AaveV3SupplyBSC: {
    apy: 4.3,
    tvl: 18.7,
    dailyRate: 0.0118,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  MorphoSupplyFlow: {
    apy: 4.3,
    tvl: 8.9,
    dailyRate: 0.0118,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  },
  // Multi strategy
  MultiStrategy: {
    apy: 0,
    tvl: 0,
    dailyRate: 0,
    lastUpdated: new Date().toISOString(),
    source: 'hardcoded'
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: MOCK_LIVE_DATA,
      timestamp: new Date().toISOString(),
      note: 'Using realistic mock data - will be replaced with real API calls'
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
