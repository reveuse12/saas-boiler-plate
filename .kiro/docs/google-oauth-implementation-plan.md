# Google OAuth Implementation Plan

## The Multi-Tenant OAuth Challenge

Your app has a unique constraint: **users belong to specific tenants**. Google OAuth only gives us an email - it doesn't know which tenant the user belongs to.

---

## Options Considered

### Option 1: Invite-First (Recommended for Phase 1)

**Flow:**
```
1. Owner invites user@gmail.com to "Acme" tenant
2. User receives invite email
3. User clicks invite link → lands on signup page
4. User sees two options:
   - "Set password" (current flow)
   - "Continue with Google" (new)
5. If Google: we verify email matches invitation, create account linked to tenant
6. User can now login with Google to that tenant
```

**Pros:**
- Maintains tenant isolation
- User is always tied to correct tenant
- Simple UX - tenant context comes from invitation

**Cons:**
- Can't use Google OAuth for brand new signups (owner creating first account)

---

### Option 2: Tenant Selection During OAuth

**Flow:**
```
1. User clicks "Sign in with Google" on login page
2. Google authenticates user
3. We check: does this email exist in any tenant?
   - If ONE tenant: auto-login
   - If MULTIPLE tenants: show tenant picker
   - If ZERO tenants: "No account found, need invitation"
```

**Pros:**
- Works for existing users across multiple tenants
- Familiar OAuth flow

**Cons:**
- More complex
- Still can't create new accounts without invitation

---

### Option 3: Tenant in URL (Simplest)

**Flow:**
```
1. User goes to login page with tenant: /login?tenant=acme
2. User clicks "Sign in with Google"
3. After OAuth, we look up user by email + tenant
4. If found: login. If not: "No account in this organization"
```

**Pros:**
- Simplest implementation
- Tenant context is explicit

**Cons:**
- User must know their tenant slug

---

## How Big Players Do It

| App | Approach | How It Works |
|-----|----------|--------------|
| **Slack** | Subdomain + Email Domain | `acme.slack.com` - Google OAuth checks if email domain matches workspace settings |
| **Notion** | Email Lookup | OAuth first, then shows list of workspaces user belongs to |
| **Linear** | Email Lookup + Invite | OAuth returns email, system finds all workspaces, user picks one |
| **Figma** | Email Lookup | Single account, multiple team memberships |
| **Jira/Atlassian** | Subdomain | `acme.atlassian.net` - tenant known before OAuth |

---

## Production Patterns

### Pattern A: Subdomain-Based (Most Common for B2B SaaS)
```
User visits: acme.yourapp.com/login
→ Tenant "acme" is known from URL
→ "Sign in with Google" passes tenant context
→ After OAuth, match email + tenant
→ If no match: "You're not a member of Acme. Request access?"
```
**Used by:** Slack, Jira, Zendesk

### Pattern B: Email Domain Auto-Join
```
Company configures: "Anyone with @acme.com email can join"
→ User signs in with Google (john@acme.com)
→ System auto-creates account in Acme tenant
→ No invitation needed for verified domains
```
**Used by:** Google Workspace, Microsoft 365, Slack

### Pattern C: Central Account + Workspace Picker
```
User has ONE account across all tenants
→ OAuth creates/finds central user record
→ User sees: "Select workspace" (list of tenants they belong to)
→ Separate membership table links users to tenants
```
**Used by:** Notion, Linear, Figma

---

## Recommended Implementation Phases

### Phase 1 (Now): Subdomain + Invite ✅ RECOMMENDED TO START
- Tenant known from subdomain/URL
- OAuth only for invited/existing users
- Simple, secure, works today

**Implementation Steps:**
1. Add Google provider to NextAuth config
2. Make `passwordHash` nullable in users table (for OAuth-only users)
3. Add `accounts` table for OAuth provider linking (NextAuth standard)
4. Update login page with "Sign in with Google" button
5. Handle OAuth callback to match users by email + tenant
6. Update invite acceptance to allow "Continue with Google"

### Phase 2 (Later): Add Email Domain Auto-Join
- Enterprise feature: "Allow @company.com to auto-join"
- Stored in tenant settings
- Great for larger customers

### Phase 3 (Optional): Central Identity
- Refactor to separate `identities` and `memberships` tables
- One Google account → multiple tenant memberships
- More complex but most flexible

---

## Technical Requirements for Phase 1

### Environment Variables Needed
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database Changes
1. Make `users.passwordHash` nullable
2. Add `accounts` table (standard NextAuth OAuth accounts table)

### Files to Modify
- `src/lib/auth.ts` - Add Google provider
- `src/db/schema.ts` - Add accounts table, make passwordHash nullable
- `src/components/auth/login-form.tsx` - Add Google button
- `src/app/(auth)/invite/[token]/page.tsx` - Add Google option for invite acceptance

---

## Decision Made
**Approach:** Combine Option 1 + 3 (Invite-First + Tenant in URL)

| Scenario | Flow |
|----------|------|
| New user | Invited → Accept with Google or password |
| Existing user | Go to `/login?tenant=acme` → Login with Google or password |
| User in multiple tenants | Login to each tenant separately (different sessions per subdomain) |
