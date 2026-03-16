"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Plus, X, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { addDependency, removeDependency } from "@/actions/dependencies";
import { TASK_STATUS_MAP } from "@/lib/constants";
import { toast } from "sonner";

interface DepTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Dependency {
  id: string;
  dependsOn: DepTask;
}

interface DependedOnBy {
  id: string;
  task: DepTask;
}

interface TaskDependenciesProps {
  taskId: string;
  dependencies: Dependency[];
  dependedOnBy: DependedOnBy[];
  projectTasks: Pick<DepTask, "id" | "title" | "status" | "priority">[];
  projectId: string;
}

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-400",
  REVIEW: "bg-purple-400",
  DONE: "bg-green-400",
};

export function TaskDependencies({
  taskId,
  dependencies,
  dependedOnBy,
  projectTasks,
  projectId,
}: TaskDependenciesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Filter out already-linked tasks
  const linkedIds = new Set([
    ...dependencies.map((d) => d.dependsOn.id),
    ...dependedOnBy.map((d) => d.task.id),
  ]);
  const available = projectTasks.filter((t) => !linkedIds.has(t.id));

  const handleAdd = (dependsOnId: string) => {
    startTransition(async () => {
      const result = await addDependency(taskId, dependsOnId);
      if (!result.success) {
        toast.error(result.error || "Ошибка при добавлении зависимости");
      }
      setOpen(false);
      router.refresh();
    });
  };

  const handleRemove = (dependsOnId: string) => {
    startTransition(async () => {
      await removeDependency(taskId, dependsOnId);
      router.refresh();
    });
  };

  const handleRemoveReverse = (depTaskId: string) => {
    startTransition(async () => {
      // Remove dependency where depTaskId depends on this task
      await removeDependency(depTaskId, taskId);
      router.refresh();
    });
  };

  const hasAnyDeps = dependencies.length > 0 || dependedOnBy.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Зависимости
        </CardTitle>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <Command>
              <CommandInput placeholder="Поиск задачи..." />
              <CommandList>
                <CommandEmpty>Задачи не найдены</CommandEmpty>
                <CommandGroup heading="Эта задача зависит от:">
                  {available.map((task) => (
                    <CommandItem
                      key={task.id}
                      value={task.title}
                      onSelect={() => handleAdd(task.id)}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${STATUS_DOT[task.status] || "bg-gray-400"}`} />
                      <span className="truncate">{task.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyDeps && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Нет зависимостей
          </p>
        )}

        {/* Blocked by (this task depends on these) */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Блокируется задачами ({dependencies.length})
            </h4>
            {dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[dep.dependsOn.status] || "bg-gray-400"}`} />
                <a
                  href={`/projects/${projectId}/tasks/${dep.dependsOn.id}`}
                  className="text-sm truncate flex-1 hover:underline"
                >
                  {dep.dependsOn.title}
                </a>
                <Badge variant="outline" className="text-[10px] h-5">
                  {TASK_STATUS_MAP[dep.dependsOn.status] || dep.dependsOn.status}
                </Badge>
                {dep.dependsOn.status !== "DONE" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemove(dep.dependsOn.id)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Blocks (these tasks depend on this one) */}
        {dependedOnBy.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              Блокирует задачи ({dependedOnBy.length})
            </h4>
            {dependedOnBy.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[dep.task.status] || "bg-gray-400"}`} />
                <a
                  href={`/projects/${projectId}/tasks/${dep.task.id}`}
                  className="text-sm truncate flex-1 hover:underline"
                >
                  {dep.task.title}
                </a>
                <Badge variant="outline" className="text-[10px] h-5">
                  {TASK_STATUS_MAP[dep.task.status] || dep.task.status}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemoveReverse(dep.task.id)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
