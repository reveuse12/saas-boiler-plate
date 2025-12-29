/**
 * Dashboard Page
 * RSC-based data fetching with tenant isolation
 */
import { Suspense } from "react";
import { getDALContext } from "@/lib/auth-utils";
import { todosDAL, tenantDAL } from "@/lib/dal";
import { CheckSquare, Users, TrendingUp, Clock } from "lucide-react";

interface DashboardPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your workspace
        </p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<RecentActivityLoading />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

async function DashboardStats() {
  const ctx = await getDALContext();
  const todos = await todosDAL.listTodos(ctx);
  const tenant = await tenantDAL.getTenantById(ctx.tenantId);

  const completedTodos = todos.filter((t) => t.completed).length;
  const pendingTodos = todos.filter((t) => !t.completed).length;

  const stats = [
    {
      name: "Total Todos",
      value: todos.length,
      icon: CheckSquare,
    },
    {
      name: "Completed",
      value: completedTodos,
      icon: TrendingUp,
    },
    {
      name: "Pending",
      value: pendingTodos,
      icon: Clock,
    },
    {
      name: "Plan",
      value: tenant?.plan || "free",
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <stat.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {stat.name}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold capitalize">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

async function RecentActivity() {
  const ctx = await getDALContext();
  const todos = await todosDAL.listTodos(ctx);
  const recentTodos = todos.slice(0, 5);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Todos</h2>
      {recentTodos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No todos yet. Create your first todo to get started!
        </p>
      ) : (
        <div className="space-y-4">
          {recentTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  todo.completed ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    todo.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {todo.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivityLoading() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-3 w-3 bg-muted animate-pulse rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
