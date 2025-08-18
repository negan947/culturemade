import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Redirect to the main category endpoint with products=true parameter
  const { searchParams } = new URL(request.url);
  
  // Preserve all existing search parameters
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('products', 'true');
  
  // Construct the new URL pointing to the parent category route
  const baseUrl = request.nextUrl.origin;
  const categoryUrl = `${baseUrl}/api/categories/${params.id}?${newSearchParams.toString()}`;
  
  // Make internal request to the main category endpoint
  const response = await fetch(categoryUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch category products',
      details: 'Internal request failed'
    }, { status: response.status });
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}