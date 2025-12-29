/**
 * Todos Page
 * Client-side todo management with optimistic updates
 */
import { TodoList } from "@/components/todos/todo-list";

export default function TodosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Todos</h1>
        <p className="text-muted-foreground">
          Manage your tasks with optimistic updates
        </p>
      </div>

      <TodoList />
    </div>
  );
}
