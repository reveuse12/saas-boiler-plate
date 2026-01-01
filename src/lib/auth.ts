/**
 * NextAuth.js v5 Configuration
 * Includes tenant-aware session callbacks
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { env, isDev, isLocalhost } from "@/lib/env";
import { findAccountByProvider, linkAccount } from "@/lib/dal/accounts";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "owner" | "admin" | "member";
      tenantId: string;
      tenantSlug: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member";
    tenantId: string;
    tenantSlug?: string;
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth provider (optional - only enabled if credentials are configured)
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.tenantSlug) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const tenantSlug = credentials.tenantSlug as string;

        // Find tenant by slug
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.slug, tenantSlug),
        });

        if (!tenant) {
          return null;
        }

        // Check if tenant is suspended
        if (tenant.isSuspended) {
          throw new Error("TenantSuspended");
        }

        // Find user by email within tenant
        const user = await db.query.users.findFirst({
          where: and(
            eq(users.email, email),
            eq(users.tenantId, tenant.id)
          ),
        });

        if (!user) {
          return null;
        }

        // Check if user has a password (OAuth-only users don't)
        if (!user.passwordHash) {
          throw new Error("OAuthOnlyUser");
        }

        // Verify password
        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * SignIn callback - handles OAuth account linking and tenant context
     * For OAuth providers, extracts tenant from cookie and handles user creation/linking
     */
    async signIn({ user, account, profile }) {
      // Skip for credentials provider - already handled in authorize
      if (account?.provider === "credentials") {
        return true;
      }

      // Handle OAuth providers (Google)
      if (account?.provider === "google") {
        // Check if user denied consent (no profile or email)
        if (!profile?.email) {
          console.error("OAuth consent denied or no email provided");
          return `/login?error=OAuthAccessDenied`;
        }

        try {
          // Extract tenant context from cookie (set before OAuth redirect)
          const cookieStore = await cookies();
          const tenantSlug = cookieStore.get("oauth_tenant_slug")?.value;

          if (!tenantSlug) {
            console.error("OAuth tenant context missing from cookie");
            return `/login?error=InvalidState`;
          }

          // Find tenant by slug
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.slug, tenantSlug),
          });

          if (!tenant) {
            console.error("Tenant not found:", tenantSlug);
            return `/login?error=TenantNotFound`;
          }

          // Check if tenant is suspended
          if (tenant.isSuspended) {
            console.error("Tenant is suspended:", tenantSlug);
            return `/login?error=TenantSuspended`;
          }

          // Check if this Google account is already linked to a different user
          const existingAccount = await findAccountByProvider(
            account.provider,
            account.providerAccountId
          );

          if (existingAccount) {
            // Account already linked - find the user and verify tenant
            const existingUser = await db.query.users.findFirst({
              where: eq(users.id, existingAccount.userId),
            });

            if (existingUser && existingUser.tenantId !== tenant.id) {
              // Google account is linked to a user in a different tenant
              return `/login?error=AccountLinkedToOtherTenant`;
            }

            if (existingUser) {
              // User exists with linked account - populate user object for session
              user.id = existingUser.id;
              user.email = existingUser.email;
              user.name = existingUser.name;
              user.role = existingUser.role;
              user.tenantId = existingUser.tenantId;
              user.tenantSlug = tenant.slug;
              return true;
            }
          }

          // Find existing user by email in this tenant
          const existingUser = await db.query.users.findFirst({
            where: and(
              eq(users.email, profile.email),
              eq(users.tenantId, tenant.id)
            ),
          });

          if (existingUser) {
            // Link Google account to existing user
            await linkAccount(existingUser.id, {
              type: "oauth",
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            });

            // Populate user object for session
            user.id = existingUser.id;
            user.email = existingUser.email;
            user.name = existingUser.name;
            user.role = existingUser.role;
            user.tenantId = existingUser.tenantId;
            user.tenantSlug = tenant.slug;
            return true;
          }

          // Create new user for this tenant
          const [newUser] = await db
            .insert(users)
            .values({
              email: profile.email,
              name: profile.name || profile.email.split("@")[0],
              passwordHash: null, // OAuth-only user
              role: "member",
              tenantId: tenant.id,
            })
            .returning();

          // Link Google account to new user
          await linkAccount(newUser.id, {
            type: "oauth",
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          });

          // Populate user object for session
          user.id = newUser.id;
          user.email = newUser.email;
          user.name = newUser.name;
          user.role = newUser.role;
          user.tenantId = newUser.tenantId;
          user.tenantSlug = tenant.slug;
          return true;
        } catch (error) {
          console.error("OAuth sign-in error:", error);
          return `/login?error=OAuthError`;
        }
      }

      return true;
    },

    /**
     * Redirect callback - handles post-login redirect to tenant subdomain
     */
    async redirect({ url, baseUrl }) {
      // Handle logout - go to home
      if (url.includes("/logout")) {
        return baseUrl;
      }

      // Parse the URL to check for tenant info
      const urlObj = new URL(url, baseUrl);
      const tenantSlug = urlObj.searchParams.get("tenantSlug");

      if (tenantSlug) {
        // Redirect to tenant dashboard
        if (isLocalhost) {
          // Development: use query param approach
          return `${env.PROTOCOL}://${env.ROOT_DOMAIN}/${tenantSlug}/dashboard`;
        }
        // Production: use subdomain
        return `${env.PROTOCOL}://${tenantSlug}.${env.ROOT_DOMAIN}/dashboard`;
      }

      // Default: return to the requested URL or base
      return url.startsWith(baseUrl) ? url : baseUrl;
    },

    /**
     * JWT callback - runs when JWT is created or updated
     * Adds tenant and role information to the token
     */
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in - add user data to token
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name!;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug!;
      }
      return token;
    },

    /**
     * Session callback - runs when session is checked
     * Exposes tenant data to the client
     */
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.role = token.role as "owner" | "admin" | "member";
      session.user.tenantId = token.tenantId as string;
      session.user.tenantSlug = token.tenantSlug as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Cookie configuration for multi-tenant subdomain support
  cookies: {
    sessionToken: {
      name: isDev ? "next-auth.session-token" : "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
        // Allow cookie to be read on all subdomains in production
        domain: !isDev && !isLocalhost ? `.${env.ROOT_DOMAIN}` : undefined,
      },
    },
  },
});
