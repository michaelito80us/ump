import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/setup(.*)',
  '/tournaments(.*)',
  '/admin(.*)',
]);

// Define public routes that should skip auth
// const _isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/test-ui(.*)',
//   '/schedule-test(.*)',
// ]);

// Check if we have a valid Clerk key
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey =
  publishableKey &&
  !publishableKey.includes('placeholder') &&
  !publishableKey.includes('Y2xlcmstdGVzdC1rZXk');

export default function middleware(req: NextRequest, event: any) {
  // If no valid Clerk key, just continue without auth
  if (!hasValidClerkKey) {
    return NextResponse.next();
  }

  // Use Clerk middleware when we have a valid key
  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  })(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
