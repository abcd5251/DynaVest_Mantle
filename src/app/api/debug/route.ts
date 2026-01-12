import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test') || 'morpho';

  try {
    if (test === 'morpho') {
      return await testMorphoAPI();
    } else if (test === 'expand') {
      return await testExpandAPI();
    } else {
      return NextResponse.json({
        message: 'Available tests: ?test=morpho or ?test=expand',
        tests: ['morpho', 'expand']
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

async function testMorphoAPI() {
  const query = `
    query GetVaultData {
      vault(address: "0xBEeFFF209270748ddd194831b3fa287a5386f5bC") {
        apy
        netApy
        totalAssets
        totalSupply
        name
        state {
          totalAssets
        }
      }
    }
  `;

  const response = await fetch('https://blue-api.morpho.org/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();

  return NextResponse.json({
    test: 'morpho',
    status: response.status,
    success: response.ok,
    data: data
  });
}

async function testExpandAPI() {
  const EXPAND_API_KEY = process.env.EXPAND_API_KEY;
  
  if (!EXPAND_API_KEY) {
    return NextResponse.json({
      test: 'expand',
      error: 'EXPAND_API_KEY not found in environment variables'
    }, { status: 400 });
  }

  const url = 'https://api.expand.network/lendborrow/getpool?lendborrowId=1206&asset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': EXPAND_API_KEY
      },
      signal: AbortSignal.timeout(5000)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }

    return NextResponse.json({
      test: 'expand',
      url: url,
      status: response.status,
      success: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    });

  } catch (error) {
    return NextResponse.json({
      test: 'expand',
      url: url,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}
