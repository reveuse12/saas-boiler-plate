# Multi-Tenancy Guidelines

## Core Principle

**All tenant-scoped data MUST be accessed through the Data Access Layer (DAL).**

The DAL automatically enforces tenant isolation by:
1. Injecting `tenantId` filter on all queries
2. Setting `tenantId` from session context on all inserts
3. Rejecting cross-tenant access attempts

## Tenant Resolution

Tenants are resolved via:
- **Production**: Subdomain (e.g., `acme.app.com`)
- **Development**: Query parameter or cookie (`?tenant=acme`)

The middleware handles this resolution and sets context headers.

## DAL Usage

Always use the DAL context pattern:

```typescript
// ✅ Correct - Using DAL with context
import { getDALContext } from "@/lib/auth-utils";
import { todosDAL } from "@/lib/dal";

const ctx = await getDALContext();
const todos = await todosDAL.listTodos(ctx);

// ❌ Wrong - Direct database query (bypasses tenant isolation!)
const todos = await db.query.todos.findMany();
```

## Session Structure

The session includes tenant information:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member";
    tenantId: string;      // Current tenant ID
    tenantSlug: string;    // Current tenant subdomain
  };
}
```

## Adding New Tenant-Scoped Tables

When adding new tables that should be tenant-scoped:

1. Add `tenantId` foreign key to the schema
2. Create a DAL module with CRUD operations
3. Always filter by `tenantId` from context
4. Add appropriate indexes for performance

```typescript
// Schema
export const newTable = pgTable("new_table", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  // ... other fields
}, (table) => [
  index("new_table_tenant_idx").on(table.tenantId),
]);

// DAL
export async function listItems(ctx: DALContext) {
  validateContext(ctx);
  return db.query.newTable.findMany({
    where: eq(newTable.tenantId, ctx.tenantId),
  });
}
```

## Security Checklist

- [ ] All tenant-scoped tables have `tenantId` column
- [ ] All queries go through DAL
- [ ] DAL validates context before every operation
- [ ] Cross-tenant access throws `ForbiddenError`
- [ ] Session includes `tenantId` and `tenantSlug`
