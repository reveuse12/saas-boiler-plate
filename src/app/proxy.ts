/**
 * Next.js 16 Proxy - Multi-Tenant Routing
 * Handles subdomain detection and request rewriting
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/middleware/tenant-resolver";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost:3000";

const PUBLIC_PATHS = ["/api/auth", "/_next", "/favicon.ico", "/public"];
const MARKETING_PATHS = ["/", "/pricing", "/about", "/contact", "/blog"];
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function GET(request: NextRequest) {
  return handleRequest(request);
}

export function POST(request: NextRequest) {
  return handleRequest(request);
}

export function PUT(request: NextRequest) {
  return handleRequest(request);
}

export function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export function DELETE(request: NextRequest) {
  return handleRequest(request);
}

function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || ROOT_DOMAIN;

  // Skip for public/static paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Resolve tenant from hostname
  const { tenantSlug, isRootDomain } = resolveTenant(
    hostname,
    ROOT_DOMAIN,
    request.nextUrl.searchParams,
    request.cookies
  );

  // Root domain handling
  if (isRootDomain) {
    if (AUTH_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    if (MARKETING_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Tenant subdomain handling
  if (tenantSlug) {
    const response = NextResponse.next();
    response.headers.set("x-tenant-slug", tenantSlug);

    if (hostname.includes("localhost")) {
      response.cookies.set("tenant", tenantSlug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (AUTH_PATHS.some((path) => pathname.startsWith(path))) {
      const url = request.nextUrl.clone();
      url.searchParams.set("tenant", tenantSlug);
      return NextResponse.rewrite(url, { headers: response.headers });
    }

    const url = request.nextUrl.clone();
    url.pathname = `/${tenantSlug}${pathname}`;
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  return NextResponse.redirect(new URL("/tenant-not-found", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
