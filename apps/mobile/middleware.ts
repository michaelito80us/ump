import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextFetchEvent } from 'next/server';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es', 'zh-CN'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/(en|es|zh-CN)/dashboard(.*)',
  '/(en|es|zh-CN)/profile(.*)',
  '/(en|es|zh-CN)/admin(.*)',
]);

// Check if we have a valid Clerk key
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey =
  publishableKey &&
  !publishableKey.includes('placeholder') &&
  !publishableKey.includes('Y2xlcmstdGVzdC1rZXk');

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // If no valid Clerk key, just apply intl middleware
  if (!hasValidClerkKey) {
    return intlMiddleware(req);
  }

  // Use Clerk middleware when we have a valid key
  return clerkMiddleware(async (auth, request) => {
    // Handle protected routes
    if (isProtectedRoute(request)) {
      await auth.protect();
    }

    // Apply internationalization middleware
    return intlMiddleware(request);
  })(req, event);
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|es)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)/',

    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|manifest\\.json|sw\\.js|workbox-[^/]*\\.js|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
