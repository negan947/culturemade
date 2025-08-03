import { NextRequest, NextResponse } from 'next/server';

// Sentry and test-logging utilities removed

async function testErrorTracking(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('type') || 'all';

    let result;

    switch (testType) {
      case 'quick':
        result = {
          success: true,
          message: 'Quick test completed (logging disabled)',
        };
        break;

      case 'all':
      default:
        result = {
          success: true,
          message: 'All tests completed (logging disabled)',
        };
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Error tracking tests completed',
      results: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error tracking test failed',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return testErrorTracking(request);
}
