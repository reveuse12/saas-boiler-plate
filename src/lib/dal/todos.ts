/**
 * Todos Data Access Layer
 * All operations automatically enforce tenant isolation
 */
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { todos, type Todo, type NewTodo } from "@/db/schema";
import { type DALContext, validateContext } from "./context";
import { NotFoundError, ForbiddenError, DatabaseError } from "./errors";

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * List all todos for the current tenant
 * Automatically filters by tenantId from context
 */
export async function listTodos(ctx: DALContext): Promise<Todo[]> {
  validateContext(ctx);

  try {
    return await db.query.todos.findMany({
      where: eq(todos.tenantId, ctx.tenantId),
      orderBy: [desc(todos.createdAt)],
    });
  } catch (error) {
    console.error("Failed to list todos:", error);
    throw new DatabaseError("Failed to fetch todos");
  }
}

/**
 * Get a single todo by ID
 * Enforces tenant isolation - throws ForbiddenError if todo belongs to different tenant
 */
export async function getTodoById(ctx: DALContext, id: string): Promise<Todo | null> {
  validateContext(ctx);

  try {
    const todo = await db.query.todos.findFirst({
      where: eq(todos.id, id),
    });

    if (!todo) {
      return null;
    }

    // Enforce tenant isolation
    if (todo.tenantId !== ctx.tenantId) {
      throw new ForbiddenError("Access denied to this resource");
    }

    return todo;
  } catch (error) {
    if (error instanceof ForbiddenError) throw error;
    console.error("Failed to get todo:", error);
    throw new DatabaseError("Failed to fetch todo");
  }
}

/**
 * Get todo by ID or throw NotFoundError
 */
export async function getTodoByIdOrThrow(ctx: DALContext, id: string): Promise<Todo> {
  const todo = await getTodoById(ctx, id);
  if (!todo) {
    throw new NotFoundError("Todo", id);
  }
  return todo;
}

// ============================================================================
// MUTATION OPERATIONS
// ============================================================================

/**
 * Create a new todo
 * Automatically sets tenantId and userId from context
 */
export async function createTodo(ctx: DALContext, input: CreateTodoInput): Promise<Todo> {
  validateContext(ctx);

  try {
    const [todo] = await db
      .insert(todos)
      .values({
        title: input.title,
        tenantId: ctx.tenantId, // Always from context, never from input
        userId: ctx.userId,
      })
      .returning();

    return todo;
  } catch (error) {
    console.error("Failed to create todo:", error);
    throw new DatabaseError("Failed to create todo");
  }
}

/**
 * Update a todo
 * Enforces tenant isolation via compound where clause
 */
export async function updateTodo(
  ctx: DALContext,
  id: string,
  input: UpdateTodoInput
): Promise<Todo> {
  validateContext(ctx);

  // First verify the todo exists and belongs to this tenant
  await getTodoByIdOrThrow(ctx, id);

  try {
    const [updated] = await db
      .update(todos)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(todos.id, id),
          eq(todos.tenantId, ctx.tenantId) // Double-check tenant isolation
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Todo", id);
    }

    return updated;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error("Failed to update todo:", error);
    throw new DatabaseError("Failed to update todo");
  }
}

/**
 * Delete a todo
 * Enforces tenant isolation via compound where clause
 */
export async function deleteTodo(ctx: DALContext, id: string): Promise<void> {
  validateContext(ctx);

  // First verify the todo exists and belongs to this tenant
  await getTodoByIdOrThrow(ctx, id);

  try {
    await db
      .delete(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.tenantId, ctx.tenantId) // Double-check tenant isolation
        )
      );
  } catch (error) {
    console.error("Failed to delete todo:", error);
    throw new DatabaseError("Failed to delete todo");
  }
}

/**
 * Toggle todo completion status
 */
export async function toggleTodo(ctx: DALContext, id: string): Promise<Todo> {
  const todo = await getTodoByIdOrThrow(ctx, id);
  return updateTodo(ctx, id, { completed: !todo.completed });
}
