import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept any OAuth or email confirmation code that accidentally lands on root or other paths,
  // and route it to /auth/callback for session exchange
  if (request.nextUrl.searchParams.has("code") && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtectedRoute = pathname.startsWith("/app");

  // Redirect unauthenticated users attempting to access protected application routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    if (pathname !== "/app") {
      redirectUrl.searchParams.set("redirectedFrom", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce 2-hour inactivity timeout for authenticated requests
  if (isProtectedRoute && user) {
    const lastActivityCookie = request.cookies.get("nexora_last_activity")?.value;
    if (lastActivityCookie) {
      const lastActivityTime = parseInt(lastActivityCookie, 10);
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (!isNaN(lastActivityTime) && Date.now() - lastActivityTime > twoHoursMs) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("reason", "inactivity");
        const res = NextResponse.redirect(redirectUrl);
        res.cookies.delete("nexora_last_activity");
        return res;
      }
    }

    // Refresh last activity timestamp cookie (expires in 2 hours = 7200s)
    supabaseResponse.cookies.set("nexora_last_activity", Date.now().toString(), {
      path: "/",
      maxAge: 7200,
      sameSite: "lax",
    });
  }

  // Redirect already authenticated users away from login and signup to the application shell
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
