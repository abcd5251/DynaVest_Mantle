import { NextResponse } from 'next/server';
import { runMantleStrategy } from '../../../../scripts/mantle_strategy';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    
    // Run the strategy script
    // Note: This runs on the server using the PRIVATE_KEY from .env
    const result = await runMantleStrategy(amount || "1");
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Mantle strategy execution failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
