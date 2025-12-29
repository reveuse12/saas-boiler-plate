/**
 * Todos API Routes
 * GET /api/todos - List all todos for current tenant
 * POST /api/todos - Create a new todo
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createContext } from "@/lib/dal/context";
import { todosDAL } from "@/lib/dal";
import { createTodoSchema } from "@/lib/validations/todo";
import { UnauthorizedError, ForbiddenError, DatabaseError } from "@/lib/dal/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = createContext(session);
    const todos = await todosDAL.listTodos(ctx);

    return NextResponse.json(todos);
  } catch (error) {
    console.error("GET /api/todos error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTodoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ctx = createContext(session);
    const todo = await todosDAL.createTodo(ctx, parsed.data);

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("POST /api/todos error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
