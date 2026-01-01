# Implementation Plan

- [x] 1. Database schema updates for OAuth accounts
  - [x] 1.1 Add accounts table to database schema
    - Create `accounts` table in `src/db/schema.ts`
    - Include userId, type, provider, providerAccountId, tokens, and timestamps
    - Add unique index on (provider, providerAccountId)
    - Add index on userId for lookups
    - _Requirements: 2.3_
  - [x] 1.2 Make passwordHash nullable in users table
    - Update users table definition to allow null passwordHash
    - This enables OAuth-only user accounts
    - _Requirements: 1.4, 2.2_
  - [x] 1.3 Generate and apply database migration
    - Run `npx drizzle-kit generate` to create migration
    - Run `npx drizzle-kit push` to apply changes
    - _Requirements: 1.4, 2.3_

- [x] 2. Implement OAuth state management utilities
  - [x] 2.1 Create OAuth state encoding/decoding module
    - Create `src/lib/oauth/state.ts`
    - Implement encodeState(tenantSlug, callbackUrl?) function
    - Implement decodeState(state) function with validation
    - Use base64 encoding for state parameter
    - _Requirements: 3.1, 4.2_
  - [ ]* 2.2 Write property test for state round-trip
    - **Property 4: Tenant Context Round-Trip**
    - **Validates: Requirements 3.1**
  - [ ]* 2.3 Write property test for CSRF validation
    - **Property 5: CSRF State Validation**
    - **Validates: Requirements 4.2**

- [x] 3. Implement account linking DAL
  - [x] 3.1 Create accounts DAL module
    - Create `src/lib/dal/accounts.ts`
    - Implement findAccountByProvider(provider, providerAccountId)
    - Implement linkAccount(userId, accountData)
    - Implement unlinkAccount(userId, provider)
    - _Requirements: 1.3, 2.3, 2.4_
  - [ ]* 3.2 Write property test for account linking
    - **Property 2: Account Linking Consistency**
    - **Validates: Requirements 1.3, 2.4**

- [x] 4. Configure NextAuth Google provider
  - [x] 4.1 Add Google OAuth environment variables
    - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to env schema
    - Update `.env.example` with placeholder values
    - _Requirements: 1.1_
  - [x] 4.2 Add Google provider to NextAuth configuration
    - Import and configure Google provider in `src/lib/auth.ts`
    - Set authorization params for consent and offline access
    - _Requirements: 1.1, 1.2_
  - [x] 4.3 Implement signIn callback for OAuth handling
    - Handle tenant context from state parameter
    - Find or create user based on email and tenant
    - Link Google account to user
    - Handle suspended tenant check
    - _Requirements: 1.3, 1.4, 1.5, 3.2_
  - [ ]* 4.4 Write property test for new user creation
    - **Property 3: New User Creation with Correct Tenant**
    - **Validates: Requirements 1.4, 2.2, 3.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create Google OAuth button component
  - [x] 6.1 Create GoogleAuthButton component
    - Create `src/components/auth/google-auth-button.tsx`
    - Accept mode prop ("signin" | "signup") and tenantSlug
    - Use Google branding guidelines for button styling
    - Handle click to initiate OAuth flow with state
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 6.2 Create OAuth separator component
    - Create reusable "or" divider component
    - Style with horizontal lines and centered text
    - _Requirements: 5.3_

- [x] 7. Integrate OAuth buttons into auth pages
  - [x] 7.1 Update login form with Google sign-in
    - Add GoogleAuthButton to `src/components/auth/login-form.tsx`
    - Add separator between OAuth and credentials form
    - Pass tenant slug to OAuth button
    - _Requirements: 5.1, 5.3_
  - [x] 7.2 Update signup page with Google sign-up
    - Add GoogleAuthButton to signup page
    - Add separator between OAuth and credentials form
    - _Requirements: 5.2, 5.3_

- [x] 8. Update credentials provider for nullable password
  - [x] 8.1 Update credentials authorize function
    - Handle case where user has no password (OAuth-only)
    - Return appropriate error for OAuth-only users attempting password login
    - _Requirements: 4.4_
  - [ ]* 8.2 Write property test for password fallback
    - **Property 6: Password Fallback After Unlink**
    - **Validates: Requirements 4.4**

- [x] 9. Handle OAuth errors and edge cases
  - [x] 9.1 Implement OAuth error handling in callbacks
    - Handle user consent denial
    - Handle invalid/missing state parameter
    - Handle tenant not found errors
    - Redirect to login with appropriate error messages
    - _Requirements: 1.5, 4.2, 4.3_
  - [x] 9.2 Update login page to display OAuth errors
    - Read error query parameter
    - Display user-friendly error messages
    - _Requirements: 1.5_

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

