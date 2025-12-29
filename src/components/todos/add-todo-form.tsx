/**
 * Add Todo Form Component
 */
"use client";

import { useState } from "react";
import { useCreateTodo } from "@/hooks/use-todos";
import { Plus } from "lucide-react";

export function AddTodoForm() {
  const [title, setTitle] = useState("");
  const createTodo = useCreateTodo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTodo.mutate(title.trim(), {
      onSuccess: () => setTitle(""),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1 px-3 py-2 border rounded-md bg-background"
        disabled={createTodo.isPending}
      />
      <button
        type="submit"
        disabled={createTodo.isPending || !title.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
    </form>
  );
}
