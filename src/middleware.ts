// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

const ROLE_PREFIXES: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const PUBLIC_PATHS = [
  "/auth/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/password-expired",
  "/verify-otp",        // ← ADD THIS
  "/verify-2fa",        // ← ADD THIS too (you'll need it later)
  "/suspended",
  "/api/auth",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/icons",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getPortalPrefix(role: string): string {
  return ROLE_PREFIXES[role] ?? "/auth/login";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) return NextResponse.next();

  // Get token from cookie or Authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  // No token → redirect to login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token
 let payload: {
    id: string;
    role: string;
    school_id?: string;
    is_active?: boolean;
    locked_until?: string;
    fee_blocked?: boolean;
    last_password_change?: string;
  };

  try {
    const { payload: p } = await jwtVerify(token, SECRET);
    payload = p as typeof payload;
  } catch {
    // Invalid/expired token → redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const { role, is_active, locked_until, fee_blocked } = payload;

  // Suspended/inactive student → /suspended
  if (
    role === "student" &&
    (!is_active || fee_blocked) &&
    pathname !== "/suspended"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/suspended";
    return NextResponse.redirect(url);
  }

  // Locked account (brute force) → back to login with message
  if (locked_until && new Date(locked_until) > new Date()) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("locked", "true");
    return NextResponse.redirect(url);
  }
// Password expiry check — skip for API and auth routes
  if (!pathname.startsWith("/api") && !pathname.startsWith("/password-expired")) {
    const lastChange = payload.last_password_change as string | undefined;
    const isExpired = !lastChange ||
      (Date.now() - new Date(lastChange).getTime()) > 7 * 24 * 60 * 60 * 1000;
    if (isExpired) {
      const url = req.nextUrl.clone();
      url.pathname = "/password-expired";
      url.searchParams.set("userId", payload.id);
      return NextResponse.redirect(url);
    }
  }
  // Determine which portal this request is for
  const requestedPortal = Object.entries(ROLE_PREFIXES).find(([, prefix]) =>
    pathname.startsWith(prefix)
  );

  if (requestedPortal) {
    const [requiredRole, prefix] = requestedPortal;

    // Wrong role trying to access this portal → redirect to their own portal
    if (role !== requiredRole) {
      const url = req.nextUrl.clone();
      url.pathname = getPortalPrefix(role);
      return NextResponse.redirect(url);
    }

    // Super admin can only access /super-admin/*
    if (role === "super_admin" && !pathname.startsWith("/super-admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/super-admin";
      return NextResponse.redirect(url);
    }

    // Correct role — allow through
    void prefix; // used above
    return NextResponse.next();
  }

  // Root path → redirect to correct portal
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = getPortalPrefix(role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Added api fallback inside the exclusion group
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
