# Project Structure Guidelines

## Directory Structure

This project follows a strict `src/` directory pattern with Next.js App Router route groups:

```
src/
├── app/
│   ├── (marketing)/      # Public landing pages (root domain)
│   ├── (auth)/           # Login/Signup pages (shared)
│   ├── (platform)/       # SaaS app (tenant subdomain)
│   │   └── [tenantSlug]/ # Dynamic tenant routes
│   │       ├── dashboard/
│   │       ├── todos/
│   │       └── settings/
│   └── api/              # API routes
├── components/
│   ├── auth/             # Auth-related components
│   ├── platform/         # Platform layout components
│   ├── providers/        # React context providers
│   ├── todos/            # Todo feature components
│   └── ui/               # shadcn/ui components
├── db/                   # Drizzle ORM schema and connection
├── hooks/                # Custom React hooks
├── lib/
│   ├── dal/              # Data Access Layer
│   ├── middleware/       # Middleware utilities
│   └── validations/      # Zod schemas
└── middleware.ts         # Next.js middleware
```

## Import Conventions

Always use the `@/` path alias for imports:

```typescript
// ✅ Good
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// ❌ Bad
import { db } from "../../../db";
import { auth } from "../../lib/auth";
```

## File Naming

- Use kebab-case for file names: `todo-item.tsx`, `use-todos.ts`
- Use PascalCase for component names: `TodoItem`, `AddTodoForm`
- Use camelCase for hooks: `useTodos`, `useCreateTodo`
- Suffix test files with `.test.ts` or `.test.tsx`
