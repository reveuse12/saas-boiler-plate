# Implementation Plan

- [x] 1. Install shadcn/ui components
  - [x] 1.1 Initialize shadcn/ui and install required components
    - Run `npx shadcn@latest add button input label card alert form`
    - Verify components are added to `src/components/ui/`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Add password reset token schema and migrations
  - [x] 2.1 Add passwordResetTokens table to database schema
    - Add table definition to `src/db/schema.ts`
    - Include id, token, userId, tenantId, expiresAt, usedAt, createdAt fields
    - Add indexes for token lookup and user lookup
    - _Requirements: 1.2, 1.3_
  - [x] 2.2 Generate and run database migration
    - Run `npx drizzle-kit generate` to create migration
    - Run `npx drizzle-kit push` to apply migration
    - _Requirements: 1.2_

- [x] 3. Implement password reset token DAL
  - [x] 3.1 Create password reset token DAL module
    - Create `src/lib/dal/password-reset.ts`
    - Implement createToken, getValidToken, invalidateToken functions
    - Use crypto for secure token generation
    - _Requirements: 1.2, 1.3, 1.5_
  - [ ]* 3.2 Write property test for token generation
    - **Property 1: Token Generation Correctness**
    - **Validates: Requirements 1.2, 1.3**

- [x] 4. Implement forgot password flow
  - [x] 4.1 Create forgot password API route
    - Create `src/app/api/auth/forgot-password/route.ts`
    - Validate email and tenantSlug
    - Generate token and store in database
    - Return generic success message (security)
    - _Requirements: 1.2, 1.3_
  - [x] 4.2 Create forgot password page
    - Create `src/app/(auth)/forgot-password/page.tsx`
    - Use shadcn/ui components for form
    - Handle form submission and display feedback
    - _Requirements: 1.1_

- [x] 5. Implement reset password flow
  - [x] 5.1 Create reset password API route
    - Create `src/app/api/auth/reset-password/route.ts`
    - Validate token and new password
    - Update user password and invalidate token
    - _Requirements: 1.4, 1.5, 1.6_
  - [x] 5.2 Create reset password page
    - Create `src/app/(auth)/reset-password/page.tsx`
    - Read token from URL query params
    - Use shadcn/ui components for form
    - Handle success and error states
    - _Requirements: 1.4, 1.5, 1.6_
  - [ ]* 5.3 Write property test for password reset
    - **Property 2: Password Reset Round Trip**
    - **Validates: Requirements 1.5**

- [x] 6. Implement change password flow
  - [x] 6.1 Create change password API route
    - Create `src/app/api/auth/change-password/route.ts`
    - Validate current password
    - Update password hash if valid
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 6.2 Add change password form to settings page
    - Update `src/app/(platform)/[tenantSlug]/settings/page.tsx`
    - Add ChangePasswordForm client component
    - Use shadcn/ui components
    - _Requirements: 2.1, 2.5_
  - [ ]* 6.3 Write property test for change password
    - **Property 3: Change Password Validation**
    - **Validates: Requirements 2.2, 2.3**

- [x] 7. Implement profile update flow
  - [x] 7.1 Create profile update API route
    - Create `src/app/api/user/profile/route.ts`
    - Validate input against updateUserSchema
    - Update user record in database
    - _Requirements: 3.2, 3.3_
  - [x] 7.2 Add profile edit form to settings page
    - Add ProfileForm client component to settings
    - Use shadcn/ui components
    - Handle success/error feedback
    - _Requirements: 3.1, 3.4_
  - [ ]* 7.3 Write property test for profile update
    - **Property 4: Profile Update Persistence**
    - **Validates: Requirements 3.2, 3.3**

- [x] 8. Create error pages
  - [x] 8.1 Create unauthorized page
    - Create `src/app/unauthorized/page.tsx`
    - Display clear message and navigation options
    - Use shadcn/ui Card component
    - _Requirements: 4.1_
  - [x] 8.2 Create tenant not found page
    - Create `src/app/tenant-not-found/page.tsx`
    - Display helpful message with link to home
    - _Requirements: 4.2_
  - [x] 8.3 Create custom 404 page
    - Create `src/app/not-found.tsx`
    - Display user-friendly 404 message
    - _Requirements: 4.3_
  - [x] 8.4 Create custom error page
    - Create `src/app/error.tsx`
    - Handle client-side errors gracefully
    - _Requirements: 4.4_

- [x] 9. Update existing auth pages with shadcn/ui
  - [x] 9.1 Update login page with shadcn/ui components
    - Replace raw inputs with shadcn/ui Input, Button, Label, Card
    - Update error display with Alert component
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 9.2 Update signup page with shadcn/ui components
    - Replace raw inputs with shadcn/ui components
    - Improve form layout and styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Add validation schemas for new endpoints
  - [x] 11.1 Add forgot password and reset password schemas
    - Add to `src/lib/validations/user.ts`
    - Include forgotPasswordSchema and resetPasswordSchema
    - _Requirements: 1.2, 1.5_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
