/**
 * Data Access Layer exports
 * All database operations should go through these modules
 */

// Context and utilities
export * from "./context";
export * from "./errors";

// DAL modules
export * as tenantDAL from "./tenant";
export * as todosDAL from "./todos";
export * as passwordResetDAL from "./password-reset";

// Super Admin DAL modules (platform-level, not tenant-scoped)
export * as superAdminDAL from "./super-admin";
export * as adminSessionDAL from "./admin-session";
export * as auditLogDAL from "./audit-log";
