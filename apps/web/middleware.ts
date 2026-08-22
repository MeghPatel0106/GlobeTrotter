import { NextResponse, type NextRequest } from "next/server";

// Define protected and auth-only paths
const protectedRoutes = [
  "/dashboard",
  "/trips",
  "/profile",
  "/search",
  "/community",
  "/calendar",
  "/admin",
];

const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Retrieve token cookie
  const token = request.cookies.get("gt_token")?.value;
  const isAuthenticated = Boolean(token && token.trim().length > 0);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const returnUrl = encodeURIComponent(`${pathname}${search}`);
    const loginUrl = new URL(`/login?returnTo=${returnUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users trying to access login/register -> redirect to /dashboard
  if (isAuthRoute && isAuthenticated) {
    const returnTo = request.nextUrl.searchParams.get("returnTo");
    const destination = returnTo ? decodeURIComponent(returnTo) : "/dashboard";
    const dashboardUrl = new URL(destination, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (static uploads)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
