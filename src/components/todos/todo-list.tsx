/**
 * Todo List Component
 */
"use client";

import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";

export function TodoList() {
  const { data: todos, isLoading, error } = useTodos();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
        Failed to load todos. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddTodoForm />

      {todos?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No todos yet. Add your first todo above!
        </div>
      ) : (
        <div className="space-y-2">
          {todos?.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}
