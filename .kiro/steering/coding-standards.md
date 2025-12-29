# Coding Standards

## TypeScript

- Use strict mode (enabled in tsconfig.json)
- Never use `any` type - use `unknown` if type is truly unknown
- Prefer interfaces over types for object shapes
- Export types alongside their implementations

```typescript
// ✅ Good
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function createTodo(data: CreateTodoInput): Promise<Todo> {
  // ...
}

// ❌ Bad
export function createTodo(data: any): Promise<any> {
  // ...
}
```

## React Components

- Use Server Components by default
- Add "use client" directive only when needed (hooks, event handlers)
- Use Suspense boundaries for loading states
- Prefer composition over prop drilling

```typescript
// ✅ Server Component (default)
export default async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// ✅ Client Component (when needed)
"use client";
export function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  // ...
}
```

## Data Fetching

- Use RSC for initial data fetching
- Use TanStack Query for client-side mutations
- Always go through the DAL for database operations
- Never query the database directly in components

```typescript
// ✅ Good - Using DAL
const ctx = await getDALContext();
const todos = await todosDAL.listTodos(ctx);

// ❌ Bad - Direct DB query
const todos = await db.query.todos.findMany();
```

## Validation

- Use Zod for all input validation
- Validate on both client and server
- Return descriptive error messages

```typescript
const parsed = createTodoSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Validation failed", details: parsed.error.flatten() },
    { status: 400 }
  );
}
```

## Error Handling

- Use custom error classes from `@/lib/dal/errors`
- Handle errors at API boundaries
- Log errors server-side, return safe messages to client
