/**
 * NextAuth.js v5 Configuration
 * Includes tenant-aware session callbacks
 */
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { env, isDev, isLocalhost } from "@/lib/env";

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
