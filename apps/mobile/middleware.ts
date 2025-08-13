import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/(en|es)/dashboard(.*)',
  '/(en|es)/profile(.*)',
  '/(en|es)/admin(.*)',
]);

// Define public routes that should skip auth
const _isPublicRoute = createRouteMatcher([
  '/',
  '/(en|es)',
  '/(en|es)/sign-in(.*)',
  '/(en|es)/sign-up(.*)',
  '/(en|es)/test-graphql(.*)',
  '/(en|es)/test-ui(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle protected routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Apply internationalization middleware
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|es)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)',

    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
