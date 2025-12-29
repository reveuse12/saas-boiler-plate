# Design Document: Multi-Tenant SaaS Boilerplate

## Overview

This design document outlines the architecture for a production-ready, multi-tenant SaaS boilerplate using Next.js 16 (App Router), TypeScript, Drizzle ORM, NextAuth.js v5, and Tailwind CSS with shadcn/ui. The system implements subdomain-based multi-tenancy where requests to `tenant.app.com` are routed to tenant-specific workspaces with complete data isolation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
│                    (tenant.app.com/dashboard)                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Middleware                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Extract subdomain from hostname                       │   │
│  │ 2. Validate tenant exists                                │   │
│  │ 3. Rewrite URL: /dashboard → /(platform)/[tenantId]/... │   │
│  │ 4. Set tenant context headers                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Route Groups                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ (marketing)  │ │   (auth)     │ │ (platform)   │            │
│  │ Landing Page │ │ Login/Signup │ │ [tenantId]/  │            │
│  │ Public       │ │ Shared       │ │ dashboard/   │            │
│  └──────────────┘ └──────────────┘ │ settings/    │            │
│                                     └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access Layer (DAL)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Automatic tenantId injection on all queries            │   │
│  │ • Session-based tenant context                           │   │
│  │ • Type-safe query builders                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Drizzle ORM)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   tenants   │ │    users    │ │    todos    │               │
│  │ ─────────── │ │ ─────────── │ │ ─────────── │               │
│  │ id          │ │ id          │ │ id          │               │
│  │ name        │ │ email       │ │ title       │               │
│  │ slug        │◄┤ tenantId    │◄┤ tenantId    │               │
│  │ plan        │ │ role        │ │ userId      │               │
│  └─────────────┘ └─────────────┘ │ completed   │               │
│                                   └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Middleware (src/middleware.ts)

The routing brain that handles subdomain detection and request rewriting.

```typescript
interface MiddlewareConfig {
  rootDomain: string;           // e.g., "app.com"
  excludedSubdomains: string[]; // e.g., ["www", "api"]
  publicPaths: string[];        // Paths that don't require tenant context
}

interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}
```

**Responsibilities:**
- Extract subdomain from request hostname
- Validate tenant existence (via edge-compatible lookup)
- Rewrite URLs to include tenantId in path
- Handle localhost development with query param fallback
- Set tenant context in request headers

### 2. Database Schema (src/db/schema.ts)

Drizzle ORM schema with relations and tenant isolation.

```typescript
// Core tables
interface Tenant {
  id: string;           // UUID
  name: string;
  slug: string;         // Subdomain identifier (unique)
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;           // UUID
  email: string;        // Unique per tenant
  name: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'member';
  tenantId: string;     // FK to tenants
  createdAt: Date;
  updatedAt: Date;
}

interface Todo {
  id: string;           // UUID
  title: string;
  completed: boolean;
  userId: string;       // FK to users
  tenantId: string;     // FK to tenants (denormalized for query performance)
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Data Access Layer (src/lib/dal/)

Type-safe abstraction enforcing tenant isolation.

```typescript
interface DALContext {
  tenantId: string;
  userId: string;
}

interface TenantDAL {
  getTenant(slug: string): Promise<Tenant | null>;
  getTenantById(id: string): Promise<Tenant | null>;
}

interface TodoDAL {
  list(ctx: DALContext): Promise<Todo[]>;
  create(ctx: DALContext, data: CreateTodoInput): Promise<Todo>;
  update(ctx: DALContext, id: string, data: UpdateTodoInput): Promise<Todo>;
  delete(ctx: DALContext, id: string): Promise<void>;
}
```

### 4. Authentication (src/lib/auth.ts)

NextAuth.js v5 configuration with tenant-aware sessions.

```typescript
interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    tenantId: string;
    tenantSlug: string;
  };
}

interface AuthCallbacks {
  jwt: (params: { token: JWT; user?: User }) => Promise<JWT>;
  session: (params: { session: Session; token: JWT }) => Promise<Session>;
}
```

### 5. Platform Layout (src/app/(platform)/layout.tsx)

Authenticated layout with sidebar navigation.

```typescript
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  navigation: NavigationItem[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType;
  current: boolean;
}
```

### 6. Validation Schemas (src/lib/validations/)

Zod schemas for runtime validation.

```typescript
// Example schemas
const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
});
```

## Data Models

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     tenants     │       │      users      │       │      todos      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ tenantId (FK)   │       │ id (PK)         │
│ name            │       │ id (PK)         │◄──────┤ userId (FK)     │
│ slug (UNIQUE)   │       │ email           │       │ tenantId (FK)   │──┐
│ plan            │       │ name            │       │ title           │  │
│ createdAt       │       │ passwordHash    │       │ completed       │  │
│ updatedAt       │       │ role            │       │ createdAt       │  │
└─────────────────┘       │ createdAt       │       │ updatedAt       │  │
         ▲                │ updatedAt       │       └─────────────────┘  │
         │                └─────────────────┘                            │
         └───────────────────────────────────────────────────────────────┘
```

### Indexes

- `tenants.slug` - Unique index for subdomain lookup
- `users.email, users.tenantId` - Composite unique index (email unique per tenant)
- `todos.tenantId` - Index for tenant-scoped queries
- `todos.userId` - Index for user-specific queries



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subdomain Extraction Consistency

*For any* valid hostname with a subdomain, extracting the subdomain and reconstructing the URL should produce a path containing the correct tenant identifier.

**Validates: Requirements 1.1**

### Property 2: Root Domain Routing

*For any* request to the root domain (without subdomain), the middleware should route to marketing pages and never inject a tenantId into the path.

**Validates: Requirements 1.2**

### Property 3: Development Mode Fallback

*For any* localhost request with a tenant query parameter or cookie, the middleware should extract the tenant identifier identically to subdomain extraction in production.

**Validates: Requirements 1.3**

### Property 4: Invalid Tenant Rejection

*For any* subdomain that does not exist in the tenant registry, the middleware should redirect to an error page rather than proceeding with an invalid tenant context.

**Validates: Requirements 1.4**

### Property 5: Tenant-Scoped Record Integrity

*For any* record in a tenant-scoped table (users, todos), the tenantId field must be non-null and reference a valid tenant.

**Validates: Requirements 2.2**

### Property 6: DAL Query Isolation

*For any* query executed through the DAL with a given tenant context, the results should only contain records where tenantId matches the context's tenantId.

**Validates: Requirements 3.1**

### Property 7: DAL Record Creation Isolation

*For any* record created through the DAL, the resulting record's tenantId should equal the session context's tenantId, regardless of any tenantId provided in the input.

**Validates: Requirements 3.2**

### Property 8: Cross-Tenant Access Prevention

*For any* attempt to read, update, or delete a record with a tenantId different from the session context, the DAL should reject the operation with an authorization error.

**Validates: Requirements 3.3**

### Property 9: DAL Response Serialization Round-Trip

*For any* valid DAL response object, serializing to JSON and deserializing should produce an equivalent object.

**Validates: Requirements 3.4**

### Property 10: Session Structure Completeness

*For any* successfully authenticated user, the resulting session should contain all required fields: userId, email, tenantId, and role.

**Validates: Requirements 4.1, 4.2**

### Property 11: Password Verification Correctness

*For any* user with a stored password hash, verifying with the correct password should succeed, and verifying with any other password should fail.

**Validates: Requirements 4.4**

### Property 12: Dashboard Tenant Data Isolation

*For any* dashboard render with a given tenant context, all displayed data should have tenantId matching the current session's tenantId.

**Validates: Requirements 6.3**

### Property 13: Optimistic Update Consistency

*For any* successful mutation, the final UI state after reconciliation should match the server response exactly.

**Validates: Requirements 8.1, 8.3**

### Property 14: Optimistic Rollback on Failure

*For any* failed mutation, the UI state should revert to the pre-mutation state with no residual optimistic changes.

**Validates: Requirements 8.2**

### Property 15: Concurrent Mutation Ordering

*For any* sequence of mutations applied to the same resource, the final state should reflect the mutations in their server-confirmed order.

**Validates: Requirements 8.4**

### Property 16: Validation Error Descriptiveness

*For any* invalid input submitted to a Zod-validated endpoint, the error response should contain field-specific error messages that identify which fields failed validation.

**Validates: Requirements 9.3**

## Error Handling

### Middleware Errors

| Error Condition | Response | Status Code |
|----------------|----------|-------------|
| Invalid subdomain format | Redirect to root domain | 302 |
| Tenant not found | Redirect to `/tenant-not-found` | 302 |
| Middleware timeout | Pass through to default routing | - |

### Authentication Errors

| Error Condition | Response | Status Code |
|----------------|----------|-------------|
| Invalid credentials | Return error message | 401 |
| Session expired | Redirect to login | 302 |
| Missing session | Redirect to login | 302 |
| Insufficient permissions | Return forbidden error | 403 |

### DAL Errors

| Error Condition | Response | Status Code |
|----------------|----------|-------------|
| No session context | Throw `UnauthorizedError` | 401 |
| Cross-tenant access | Throw `ForbiddenError` | 403 |
| Record not found | Throw `NotFoundError` | 404 |
| Database connection failure | Throw `DatabaseError` | 500 |

### Validation Errors

| Error Condition | Response | Status Code |
|----------------|----------|-------------|
| Invalid input | Return Zod error with field details | 400 |
| Missing required field | Return specific field error | 400 |

## Testing Strategy

### Property-Based Testing Library

**Library:** [fast-check](https://github.com/dubzzz/fast-check) for TypeScript

fast-check is chosen for its:
- Native TypeScript support with excellent type inference
- Rich set of built-in arbitraries
- Shrinking capabilities for minimal failing examples
- Integration with Jest/Vitest

### Unit Testing Approach

Unit tests will cover:
- Specific edge cases (empty strings, boundary values)
- Error conditions and exception handling
- Integration points between components
- Snapshot tests for UI components

### Property-Based Testing Approach

Each correctness property will be implemented as a property-based test:

1. **Middleware Properties (1-4):** Generate random hostnames, paths, and tenant configurations
2. **DAL Properties (5-9):** Generate random tenant contexts, records, and queries
3. **Auth Properties (10-11):** Generate random user credentials and session data
4. **UI Properties (12-16):** Generate random mutations and state transitions

### Test Configuration

```typescript
// Property tests should run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });
```

### Test File Organization

```
src/
├── __tests__/
│   ├── middleware.test.ts      # Properties 1-4
│   ├── dal/
│   │   └── tenant.test.ts      # Properties 5-9
│   ├── auth.test.ts            # Properties 10-11
│   └── hooks/
│       └── useTodos.test.ts    # Properties 13-15
├── lib/
│   └── validations/
│       └── __tests__/
│           └── schemas.test.ts # Property 16
```

### Test Annotations

All property-based tests must include:
```typescript
/**
 * **Feature: multi-tenant-saas-boilerplate, Property 6: DAL Query Isolation**
 * **Validates: Requirements 3.1**
 */
```
