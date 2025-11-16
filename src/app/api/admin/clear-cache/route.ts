import { NextRequest, NextResponse } from 'next/server';

// Clear translation cache endpoint
export async function POST(request: NextRequest) {
  try {
    // Force reload by making a timestamp-based request
    const timestamp = Date.now();

    // Clear server-side module cache if needed
    if (global.translationsCache) {
      global.translationsCache = new Map();
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}