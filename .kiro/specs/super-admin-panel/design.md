# Design Document: Super Admin Panel

## Overview

This design document outlines the architecture for a Super Admin Panel that provides platform-wide administrative capabilities. The system uses a separate `super_admins` table completely isolated from tenant users, with its own authentication flow, session management, and tiered permission system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI Layer                            │
│  /admin/login, /admin/dashboard, /admin/tenants, etc.       │
├─────────────────────────────────────────────────────────────┤
│                    Admin API Layer                           │
│  /api/admin/auth, /api/admin/tenants, /api/admin/users      │
├─────────────────────────────────────────────────────────────┤
│                    Admin DAL Layer                           │
│  superAdminDAL, auditLogDAL                                 │
├─────────────────────────────────────────────────────────────┤
│                  Database Layer                              │
│  super_admins, admin_sessions, audit_logs                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Tables

```typescript
// super_admins table
export const superAdmins = pgTable("super_admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'primary_admin' | 'admin'
  isActive: boolean("is_active").notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// admin_sessions table
export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => superAdmins.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivityAt: timestamp("last_activity_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// audit_logs table
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"), // 'tenant' | 'user' | 'admin'
  targetId: text("target_id"),
  details: text("details"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/auth/login` | POST | Admin login |
| `/api/admin/auth/logout` | POST | Admin logout |
| `/api/admin/auth/me` | GET | Get current admin |
| `/api/admin/dashboard/stats` | GET | Platform statistics |
| `/api/admin/tenants` | GET | List all tenants |
| `/api/admin/tenants/[id]` | GET | Get tenant details |
| `/api/admin/tenants/[id]` | PATCH | Update tenant |
| `/api/admin/tenants/[id]` | DELETE | Delete tenant |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/[id]` | GET | Get user details |
| `/api/admin/users/[id]/reset-password` | POST | Reset user password |
| `/api/admin/audit-logs` | GET | List audit logs |
| `/api/admin/admins` | GET | List super admins |
| `/api/admin/admins` | POST | Create super admin |
| `/api/admin/admins/[id]` | DELETE | Delete super admin |

### Pages

| Path | Description |
|------|-------------|
| `/admin/login` | Admin login page |
| `/admin/dashboard` | Platform overview |
| `/admin/tenants` | Tenant list |
| `/admin/tenants/[id]` | Tenant details |
| `/admin/users` | User list |
| `/admin/users/[id]` | User details |
| `/admin/audit-logs` | Audit log viewer |
| `/admin/admins` | Super admin management (primary only) |

## Data Models

### Super Admin

```typescript
interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  role: 'primary_admin' | 'admin';
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}
```

### Admin Session

```typescript
interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  expiresAt: Date;
  lastActivityAt: Date;
}
```

### Audit Log Entry

```typescript
interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'tenant' | 'user' | 'admin' | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Protection

*For any* admin route under `/admin/*` (except `/admin/login`), an unauthenticated request SHALL be redirected to `/admin/login`.

**Validates: Requirements 1.3**

### Property 2: Tenant Plan Distribution Accuracy

*For any* set of tenants in the database, the plan distribution statistics SHALL accurately reflect the count of tenants per plan type.

**Validates: Requirements 2.2**

### Property 3: Tenant Suspension Blocks Login

*For any* suspended tenant, all users belonging to that tenant SHALL be unable to authenticate.

**Validates: Requirements 3.4**

### Property 4: Tenant Deletion Cascade

*For any* deleted tenant, all associated users, todos, and other tenant-scoped data SHALL be removed from the database.

**Validates: Requirements 3.5**

### Property 5: Audit Log Creation

*For any* administrative action (create, update, delete on tenants/users/admins), an audit log entry SHALL be created with the admin ID, action type, and timestamp.

**Validates: Requirements 5.1**

### Property 6: Non-Primary Admin Restriction

*For any* super admin with role 'admin' (non-primary), attempts to create, update, or delete other super admins SHALL be denied.

**Validates: Requirements 6.4**

### Property 7: Primary Admin Minimum

*For any* deletion of a primary admin, the system SHALL ensure at least one primary admin remains active.

**Validates: Requirements 6.5**

### Property 8: Account Lockout

*For any* admin account with 5 or more failed login attempts within 15 minutes, subsequent login attempts SHALL be rejected until the lockout period expires.

**Validates: Requirements 7.1**

## Error Handling

| Error | HTTP Status | Message |
|-------|-------------|---------|
| Invalid credentials | 401 | "Invalid email or password" |
| Account locked | 423 | "Account temporarily locked" |
| Unauthorized | 401 | "Authentication required" |
| Forbidden | 403 | "Insufficient permissions" |
| Tenant not found | 404 | "Tenant not found" |
| Cannot delete last primary | 400 | "Cannot delete the last primary admin" |

## Testing Strategy

### Unit Testing

- Validation schema tests
- Password hashing verification
- Session token generation
- Audit log formatting

### Property-Based Testing

Property-based tests will use `fast-check` library to verify:
- Route protection for all admin routes
- Plan distribution calculation accuracy
- Tenant suspension blocks all tenant users
- Cascade deletion removes all related data
- Audit logs created for all admin actions
- Non-primary admin restrictions enforced
- Primary admin minimum maintained
- Account lockout after failed attempts

Each property-based test MUST:
- Run a minimum of 100 iterations
- Be tagged with format: `**Feature: super-admin-panel, Property {number}: {property_text}**`
