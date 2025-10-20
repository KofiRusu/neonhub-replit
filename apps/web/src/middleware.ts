import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Open-redirect protection
const isSafeUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return ['https:', 'http:'].includes(u.protocol);
  } catch {
    return false;
  }
};

function securityHeaders(req: NextRequest) {
  const res = NextResponse.next();

  // Strict security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Content-Security-Policy (adjust for actual asset hosts)
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https: data:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
    "connect-src 'self' https: wss: http://localhost:*",
    "object-src 'none'",
    "form-action 'self'",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);

  // Sanitize redirect param
  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect');
  if (redirect && !isSafeUrl(redirect)) {
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return res;
}

export default withAuth(
  function middleware(req) {
    return securityHeaders(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public paths
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname === '/favicon.ico'
        ) {
          return true;
        }
        // Protected paths require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
