import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const resolvedParams = await params;
  const { size } = resolvedParams;
  
  // Parse size (e.g., "200x128")
  const [width = '200', height = '200'] = size.split('x');
  const w = parseInt(width, 10);
  const h = parseInt(height, 10);
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="14" fill="#6b7280">
        ${w}×${h}
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}