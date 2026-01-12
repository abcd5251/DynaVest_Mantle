import { NextRequest, NextResponse } from 'next/server';

// NOTE: This API key should be moved to environment variables
const EXPAND_API_KEY = process.env.EXPAND_API_KEY || 'MMRPCYrmFr7kw4RR7oQio3NY6qytHj8M6l5LK5B2';

// Updated endpoints based on Expand Network documentation
const EXPAND_API_BASE = 'https://api.expand.network/lendborrow';

const PROTOCOL_CONFIG = {
  // Base chain protocols  
  'AaveV3Supply': {
    lendborrowId: '1206', // Base AAVE V3
    chain: 'base',
    endpoint: 'getpool',
    asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC on Base
  },
  'AaveV3SupplyLeveraged': {
    lendborrowId: '1206', // Base AAVE V3  
    chain: 'base',
    endpoint: 'getpool',
    asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC on Base
  },
  'MorphoSupply': {
    lendborrowId: '1402', // Base Morpho
    chain: 'base', 
    endpoint: 'getpools',
    asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC on Base
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    // Check if strategy is supported
    const config = PROTOCOL_CONFIG[strategyId as keyof typeof PROTOCOL_CONFIG];
    if (!config) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Strategy not supported for Expand Network API: ${strategyId}`,
          supportedStrategies: Object.keys(PROTOCOL_CONFIG)
        },
        { status: 400 }
      );
    }

    // Build the API URL
    let apiUrl = `${EXPAND_API_BASE}/${config.endpoint}?lendborrowId=${config.lendborrowId}`;
    if (config.asset) {
      apiUrl += `&asset=${config.asset}`;
    }

    console.log(`Fetching from Expand API: ${apiUrl}`);

    // Make the API request with proper error handling
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': EXPAND_API_KEY,
        // Try alternative authentication headers
        'Authorization': `Bearer ${EXPAND_API_KEY}`,
        'api-key': EXPAND_API_KEY
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log(`Expand API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Expand API error: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Expand Network API error: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 200) // Truncate for security
        },
        { status: 500 }
      );
    }

    const apiData = await response.json();
    console.log(`Expand API response:`, JSON.stringify(apiData, null, 2));

    // Transform the response
    const transformedData = transformExpandResponse(apiData, strategyId, config);

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Expand API route error:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${errorMessage}`,
        errorType: errorName,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function transformExpandResponse(apiData: any, strategyId: string, config: any) {
  try {
    // Handle different response formats based on endpoint
    if (config.endpoint === 'getpool') {
      // Single pool response
      return transformSinglePoolResponse(apiData, strategyId);
    } else if (config.endpoint === 'getpools') {
      // Multiple pools response
      return transformMultiplePoolsResponse(apiData, strategyId, config);
    } else {
      throw new Error(`Unknown endpoint type: ${config.endpoint}`);
    }
  } catch (error) {
    console.error(`Error transforming response for ${strategyId}:`, error);
    throw error;
  }
}

function transformSinglePoolResponse(apiData: any, strategyId: string) {
  // For AAVE V3 single pool responses
  const apy = parseFloat(apiData.stableSupplyRate || apiData.variableSupplyRate || '0');
  const tvl = parseInt(apiData.totalSupply || apiData.reserveSize || '0') / 1e6; // Convert to millions
  const utilizationRate = parseFloat(apiData.utilizationRate || '0');
  
  return {
    apy: Math.round(apy * 100) / 100, // Round to 2 decimal places
    tvl: Math.round(tvl * 100) / 100,
    dailyRate: Math.round((apy / 365) * 10000) / 10000,
    utilizationRate,
    lastUpdated: new Date().toISOString(),
    source: 'expand'
  };
}

function transformMultiplePoolsResponse(apiData: any, strategyId: string, config: any) {
  // For multiple pools (Morpho on Base)
  if (strategyId === 'MorphoSupply') {
    // Find the USDC market in the response
    const usdcMarket = apiData.markets?.find((market: any) => 
      market.asset?.toLowerCase() === config.asset.toLowerCase()
    );
    
    if (!usdcMarket) {
      throw new Error(`USDC market not found in Morpho response`);
    }
    
    const apy = parseFloat(usdcMarket.supplyRate || '0');
    const tvl = parseInt(usdcMarket.totalSupplyAssets || '0') / 1e6;
    
    return {
      apy: Math.round(apy * 100) / 100,
      tvl: Math.round(tvl * 100) / 100,
      dailyRate: Math.round((apy / 365) * 10000) / 10000,
      lastUpdated: new Date().toISOString(),
      source: 'expand'
    };
  }
  
  throw new Error(`Unsupported multi-pool strategy: ${strategyId}`);
}
