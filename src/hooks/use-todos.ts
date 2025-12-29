/**
 * Todo hooks with TanStack Query
 * Implements optimistic updates with rollback on failure
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Todo } from "@/db/schema";

// Query keys
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (tenantId: string) => [...todoKeys.lists(), tenantId] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

// API functions
async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos");
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

async function createTodo(title: string): Promise<Todo> {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

async function updateTodo({
  id,
  ...data
}: {
  id: string;
  title?: string;
  completed?: boolean;
}): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete todo");
}

// Hooks
export function useTodos() {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: fetchTodos,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    // Optimistic update
    onMutate: async (title) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.lists());

      // Optimistically add new todo
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title,
        completed: false,
        userId: "",
        tenantId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<Todo[]>(todoKeys.lists(), (old) => [
        optimisticTodo,
        ...(old || []),
      ]);

      return { previousTodos };
    },
    // Rollback on error
    onError: (_err, _title, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    // Optimistic update
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.lists());

      queryClient.setQueryData<Todo[]>(todoKeys.lists(), (old) =>
        old?.map((todo) =>
          todo.id === updatedTodo.id
            ? { ...todo, ...updatedTodo, updatedAt: new Date() }
            : todo
        )
      );

      return { previousTodos };
    },
    onError: (_err, _updatedTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.lists());

      queryClient.setQueryData<Todo[]>(todoKeys.lists(), (old) =>
        old?.filter((todo) => todo.id !== id)
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo({ id, completed }),
    // Optimistic update
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.lists());

      queryClient.setQueryData<Todo[]>(todoKeys.lists(), (old) =>
        old?.map((todo) =>
          todo.id === id ? { ...todo, completed, updatedAt: new Date() } : todo
        )
      );

      return { previousTodos };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
