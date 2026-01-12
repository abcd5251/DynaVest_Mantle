import { NextResponse } from 'next/server';
import { liveAPYService } from '@/services/liveAPYService';

export async function GET() {
  try {
    const apyData = await liveAPYService.fetchAllAPYs();

    // Convert Map to object for JSON serialization
    const apyObject: Record<string, number> = {};
    apyData.forEach((apy, strategyId) => {
      apyObject[strategyId] = apy;
    });

    return NextResponse.json({
      success: true,
      data: apyObject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Live APY API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
