import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // IMPORTANT: Include img-src for blob/data and Cloudinary so previews work
  // This complements headers from next.config.mjs; middleware runs for most routes
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' blob: data: https: http:",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "font-src 'self' data:",
    ].join('; ')
  );

  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};