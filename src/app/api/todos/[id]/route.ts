/**
 * Single Todo API Routes
 * GET /api/todos/[id] - Get a single todo
 * PATCH /api/todos/[id] - Update a todo
 * DELETE /api/todos/[id] - Delete a todo
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createContext } from "@/lib/dal/context";
import { todosDAL } from "@/lib/dal";
import { updateTodoSchema } from "@/lib/validations/todo";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
} from "@/lib/dal/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = createContext(session);
    const todo = await todosDAL.getTodoByIdOrThrow(ctx, id);

    return NextResponse.json(todo);
  } catch (error) {
    console.error("GET /api/todos/[id] error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to fetch todo" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateTodoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ctx = createContext(session);
    const todo = await todosDAL.updateTodo(ctx, id, parsed.data);

    return NextResponse.json(todo);
  } catch (error) {
    console.error("PATCH /api/todos/[id] error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = createContext(session);
    await todosDAL.deleteTodo(ctx, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/todos/[id] error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
