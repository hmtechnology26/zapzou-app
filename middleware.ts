import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV !== 'production';
  const pathname = request.nextUrl.pathname;
  const isNextAsset = pathname.startsWith('/_next/');

  if (isDev || !isNextAsset) {
    // Keep app pages from being cached aggressively so the browser never
    // reuses HTML that points to stale Next.js chunks after a rebuild.
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!favicon.ico|manifest.json|apple-touch-icon.png|icons/).*)',
  ],
};
