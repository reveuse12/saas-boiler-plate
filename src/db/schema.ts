/**
 * Database schema with multi-tenant isolation
 * All tenant-scoped tables include tenantId foreign key
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  integer,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const superAdminRoleEnum = pgEnum("super_admin_role", ["primary_admin", "admin"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired", "revoked"]);

// ============================================================================
// TENANTS TABLE
// ============================================================================

export const tenants = pgTable(
  "tenants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(), // Subdomain identifier
    plan: planEnum("plan").notNull().default("free"),
    isSuspended: boolean("is_suspended").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Unique index on slug for fast subdomain lookup
    uniqueIndex("tenants_slug_idx").on(table.slug),
  ]
);

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"), // Nullable for OAuth-only users
    role: roleEnum("role").notNull().default("member"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Email unique per tenant (not globally)
    uniqueIndex("users_email_tenant_idx").on(table.email, table.tenantId),
    // Index for tenant-scoped queries
    index("users_tenant_idx").on(table.tenantId),
  ]
);

// ============================================================================
// TODOS TABLE (Example tenant-scoped resource)
// ============================================================================

export const todos = pgTable(
  "todos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Denormalized tenantId for query performance
    // Allows filtering by tenant without joining users table
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Index for tenant-scoped queries
    index("todos_tenant_idx").on(table.tenantId),
    // Index for user-specific queries
    index("todos_user_idx").on(table.userId),
  ]
);

// ============================================================================
// INVITATIONS TABLE
// ============================================================================

export const invitations = pgTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    role: roleEnum("role").notNull().default("member"),
    token: text("token").notNull(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invitations_tenant_idx").on(table.tenantId),
    index("invitations_email_idx").on(table.email),
    uniqueIndex("invitations_token_idx").on(table.token),
  ]
);

// ============================================================================
// PASSWORD RESET TOKENS TABLE
// ============================================================================

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull(), // Hashed token
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Unique index on token for fast lookup
    uniqueIndex("password_reset_tokens_token_idx").on(table.token),
    // Index for user lookup
    index("password_reset_tokens_user_idx").on(table.userId),
  ]
);

// ============================================================================
// SUPER ADMIN TABLES (Platform-level, isolated from tenants)
// ============================================================================

export const superAdmins = pgTable(
  "super_admins",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"), // Nullable - set when admin completes setup
    role: superAdminRoleEnum("role").notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("super_admins_email_idx").on(table.email),
  ]
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id")
      .notNull()
      .references(() => superAdmins.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    lastActivityAt: timestamp("last_activity_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_idx").on(table.token),
    index("admin_sessions_admin_idx").on(table.adminId),
  ]
);

// ============================================================================
// ADMIN SETUP TOKENS TABLE (for new admin password setup)
// ============================================================================

export const adminSetupTokens = pgTable(
  "admin_setup_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id")
      .notNull()
      .references(() => superAdmins.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("admin_setup_tokens_token_idx").on(table.token),
    index("admin_setup_tokens_admin_idx").on(table.adminId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id").notNull(),
    adminEmail: text("admin_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"), // 'tenant' | 'user' | 'admin'
    targetId: text("target_id"),
    details: text("details"), // JSON string
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_admin_idx").on(table.adminId),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// ============================================================================
// ACCOUNTS TABLE (OAuth provider connections)
// ============================================================================

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "oauth" | "credentials"
    provider: text("provider").notNull(), // "google" | "credentials"
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_idx").on(table.provider, table.providerAccountId),
    index("accounts_user_idx").on(table.userId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  todos: many(todos),
  passwordResetTokens: many(passwordResetTokens),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  todos: many(todos),
  passwordResetTokens: many(passwordResetTokens),
  sentInvitations: many(invitations),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [todos.tenantId],
    references: [tenants.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [passwordResetTokens.tenantId],
    references: [tenants.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

export const superAdminsRelations = relations(superAdmins, ({ many }) => ({
  sessions: many(adminSessions),
  setupTokens: many(adminSetupTokens),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(superAdmins, {
    fields: [adminSessions.adminId],
    references: [superAdmins.id],
  }),
}));

export const adminSetupTokensRelations = relations(adminSetupTokens, ({ one }) => ({
  admin: one(superAdmins, {
    fields: [adminSetupTokens.adminId],
    references: [superAdmins.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type SuperAdmin = typeof superAdmins.$inferSelect;
export type NewSuperAdmin = typeof superAdmins.$inferInsert;

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type AdminSetupToken = typeof adminSetupTokens.$inferSelect;
export type NewAdminSetupToken = typeof adminSetupTokens.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
