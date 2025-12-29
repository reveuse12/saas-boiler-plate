/**
 * Todo Item Component
 */
"use client";

import { useState } from "react";
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos";
import type { Todo } from "@/db/schema";
import { Check, Trash2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();
  const updateTodo = useUpdateTodo();

  const handleToggle = () => {
    toggleTodo.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id);
  };

  const handleEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      updateTodo.mutate({ id: todo.id, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit();
    } else if (e.key === "Escape") {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border bg-card transition-colors",
        todo.completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggleTodo.isPending}
        className={cn(
          "h-5 w-5 rounded border flex items-center justify-center transition-colors",
          todo.completed
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input hover:border-primary"
        )}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border rounded bg-background"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm",
            todo.completed && "line-through text-muted-foreground"
          )}
        >
          {todo.title}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {isEditing ? (
          <button
            onClick={() => {
              setEditTitle(todo.title);
              setIsEditing(false);
            }}
            className="p-1 rounded hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteTodo.isPending}
          className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
