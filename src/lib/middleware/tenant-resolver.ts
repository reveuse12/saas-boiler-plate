/**
 * Tenant Resolution Logic for Middleware
 * Handles subdomain extraction and localhost fallback
 */

// Reserved subdomains that should not be treated as tenant slugs
const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app", "dashboard"];

export interface TenantResolution {
  tenantSlug: string | null;
  isRootDomain: boolean;
}

/**
 * Extract tenant slug from hostname
 * Handles both production (subdomain) and development (query param/cookie) modes
 */
export function resolveTenant(
  hostname: string,
  rootDomain: string,
  searchParams?: URLSearchParams,
  cookies?: { get: (name: string) => { value: string } | undefined }
): TenantResolution {
  // Normalize hostname (remove port if present)
  const normalizedHostname = hostname.split(":")[0];
  const normalizedRootDomain = rootDomain.split(":")[0];

  // Check if we're on localhost (development mode)
  const isLocalhost =
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname.endsWith(".localhost");

  if (isLocalhost) {
    return resolveLocalhostTenant(searchParams, cookies);
  }

  return resolveSubdomainTenant(normalizedHostname, normalizedRootDomain);
}

/**
 * Resolve tenant from subdomain in production
 */
function resolveSubdomainTenant(
  hostname: string,
  rootDomain: string
): TenantResolution {
  // Check if hostname matches root domain exactly
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return { tenantSlug: null, isRootDomain: true };
  }

  // Check if hostname is a subdomain of root domain
  if (!hostname.endsWith(`.${rootDomain}`)) {
    // Not our domain at all
    return { tenantSlug: null, isRootDomain: true };
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, "");

  // Check for reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return { tenantSlug: null, isRootDomain: true };
  }

  // Check for nested subdomains (not allowed)
  if (subdomain.includes(".")) {
    return { tenantSlug: null, isRootDomain: true };
  }

  return { tenantSlug: subdomain, isRootDomain: false };
}

/**
 * Resolve tenant from query param or cookie in development
 */
function resolveLocalhostTenant(
  searchParams?: URLSearchParams,
  cookies?: { get: (name: string) => { value: string } | undefined }
): TenantResolution {
  // Priority 1: Query parameter
  const queryTenant = searchParams?.get("tenant");
  if (queryTenant && !RESERVED_SUBDOMAINS.includes(queryTenant.toLowerCase())) {
    return { tenantSlug: queryTenant, isRootDomain: false };
  }

  // Priority 2: Cookie
  const cookieTenant = cookies?.get("tenant")?.value;
  if (cookieTenant && !RESERVED_SUBDOMAINS.includes(cookieTenant.toLowerCase())) {
    return { tenantSlug: cookieTenant, isRootDomain: false };
  }

  // No tenant context - treat as root domain
  return { tenantSlug: null, isRootDomain: true };
}

/**
 * Build the rewritten URL for tenant routes
 */
export function buildTenantUrl(
  pathname: string,
  tenantId: string
): string {
  // Remove leading slash for cleaner path building
  const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

  // Rewrite to platform route group with tenant ID
  return `/(platform)/${tenantId}/${cleanPath}`;
}
