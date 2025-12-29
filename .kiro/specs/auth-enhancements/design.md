# Design Document: Auth Enhancements

## Overview

This design document outlines the architecture for enhancing the authentication system with password reset flow, profile management, change password functionality, error pages, and shadcn/ui component integration. The implementation follows the existing multi-tenant architecture patterns and DAL-based data access.

## Architecture

The auth enhancements follow the existing layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer                                │
│  (Pages, Components with shadcn/ui)                         │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                 │
│  (Route Handlers for password reset, profile, etc.)         │
├─────────────────────────────────────────────────────────────┤
│                    DAL Layer                                 │
│  (User operations, token management)                        │
├─────────────────────────────────────────────────────────────┤
│                  Database Layer                              │
│  (Drizzle ORM - users, password_reset_tokens)               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Database Table: Password Reset Tokens

```typescript
// src/db/schema.ts - addition
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_token_idx").on(table.token),
    index("password_reset_tokens_user_idx").on(table.userId),
  ]
);
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/forgot-password` | POST | Generate password reset token |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |
| `/api/user/profile` | PATCH | Update user profile |

### Pages

| Path | Description |
|------|-------------|
| `/forgot-password` | Request password reset form |
| `/reset-password` | Reset password with token |
| `/unauthorized` | Unauthorized access error page |
| `/tenant-not-found` | Invalid tenant error page |
| `/not-found` | Custom 404 page |
| `/error` | Custom 500 page |

### shadcn/ui Components to Install

- `button` - Primary action buttons
- `input` - Form text inputs
- `label` - Form field labels
- `card` - Content containers
- `alert` - Success/error messages
- `form` - Form wrapper with validation

## Data Models

### Password Reset Token

```typescript
interface PasswordResetToken {
  id: string;
  token: string;           // Hashed token stored in DB
  userId: string;
  tenantId: string;
  expiresAt: Date;         // 1 hour from creation
  usedAt: Date | null;     // Set when token is used
  createdAt: Date;
}
```

### API Request/Response Types

```typescript
// Forgot Password
interface ForgotPasswordRequest {
  email: string;
  tenantSlug: string;
}

interface ForgotPasswordResponse {
  message: string;
}

// Reset Password
interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Change Password
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Update Profile
interface UpdateProfileRequest {
  name?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the prework, the following properties were identified as providing unique validation value:

- Properties 1.2 and 1.3 can be combined: token generation always produces a valid token with correct expiration
- Properties 2.2 and 2.3 can be combined: password change validates current password and updates correctly
- Properties 3.2 and 3.3 can be combined: profile update validates and persists correctly
- Property 1.5 stands alone: password reset with valid token updates password and invalidates token

### Property 1: Token Generation Correctness

*For any* valid email and tenant slug combination where the user exists, generating a password reset token SHALL produce a token with an expiration time exactly 1 hour from creation.

**Validates: Requirements 1.2, 1.3**

### Property 2: Password Reset Round Trip

*For any* valid password reset token and new password, resetting the password SHALL result in the new password being verifiable via login AND the token being invalidated (unusable for subsequent resets).

**Validates: Requirements 1.5**

### Property 3: Change Password Validation

*For any* authenticated user with a known current password, submitting the correct current password with a valid new password SHALL update the password hash such that the new password is verifiable and the old password is not.

**Validates: Requirements 2.2, 2.3**

### Property 4: Profile Update Persistence

*For any* valid profile update input, updating the profile SHALL result in the database containing the updated values when queried.

**Validates: Requirements 3.2, 3.3**

## Error Handling

### Password Reset Errors

| Error | HTTP Status | Message |
|-------|-------------|---------|
| User not found | 200 | Generic success (security) |
| Invalid token | 400 | "Invalid or expired reset link" |
| Expired token | 400 | "Invalid or expired reset link" |
| Token already used | 400 | "This reset link has already been used" |

### Change Password Errors

| Error | HTTP Status | Message |
|-------|-------------|---------|
| Incorrect current password | 400 | "Current password is incorrect" |
| Passwords don't match | 400 | "Passwords don't match" |
| Validation failed | 400 | Field-specific errors |

### Profile Update Errors

| Error | HTTP Status | Message |
|-------|-------------|---------|
| Validation failed | 400 | Field-specific errors |
| Unauthorized | 401 | "Unauthorized" |

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Validation schema correctness
- Token generation and hashing
- Password hashing and comparison
- Error message formatting

### Property-Based Testing

Property-based tests will use `fast-check` library to verify:
- Token expiration is always 1 hour from creation
- Password reset invalidates tokens
- Password change updates hash correctly
- Profile updates persist correctly

Each property-based test MUST:
- Run a minimum of 100 iterations
- Be tagged with format: `**Feature: auth-enhancements, Property {number}: {property_text}**`
- Reference the correctness property from this design document
