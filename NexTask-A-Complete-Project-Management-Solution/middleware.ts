import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Define allowed origins - include your React app on port 5173
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  const response = NextResponse.next();

  // Check if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Set CORS headers - use specific origin if allowed, otherwise allow all in dev
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow all origins (but no credentials with wildcard)
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-org-slug, x-org-id');

  // Handle preflight requests (OPTIONS method)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

// Optional: Configure the middleware to run only on specific paths (e.g., API routes)
export const config = {
  matcher: '/api/:path*', // This applies the middleware only to routes starting with /api
};