import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Exact paths anyone can load. "/" is the marketing page, so it lives here. */
const PUBLIC_PATHS = new Set(["/"]);
/** Prefixes anyone can load (the auth screens and anything nested under them). */
const PUBLIC_PREFIXES = ["/sign-in"];

/**
 * Cheap cookie-presence check only — no DB round trip. Good enough to gate
 * page loads; routes that need a *verified* session still call
 * auth.api.getSession server-side (see apps/api requireAuth middleware).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
