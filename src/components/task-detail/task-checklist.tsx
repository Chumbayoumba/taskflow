"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckSquare, Square, Pencil, Check, X, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
} from "@/actions/checklist";
import type { ChecklistItem } from "@/generated/prisma/client";

interface TaskChecklistProps {
  taskId: string;
  items: ChecklistItem[];
}

export function TaskChecklist({ taskId, items }: TaskChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await addChecklistItem(taskId, newTitle.trim());
      setNewTitle("");
      router.refresh();
    });
  };

  const handleToggle = (itemId: string) => {
    startTransition(async () => {
      await toggleChecklistItem(itemId);
      router.refresh();
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      await deleteChecklistItem(itemId);
      router.refresh();
    });
  };

  const handleEdit = (itemId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    startTransition(async () => {
      await updateChecklistItem(itemId, editTitle.trim());
      setEditingId(null);
      router.refresh();
    });
  };

  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Чеклист
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({completed}/{total})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-muted/50"
            >
              <button
                onClick={() => handleToggle(item.id)}
                disabled={isPending}
                className="flex-shrink-0"
              >
                {item.completed ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {editingId === item.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleEdit(item.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm cursor-pointer ${
                      item.completed ? "line-through text-muted-foreground" : ""
                    }`}
                    onClick={() => {
                      setEditingId(item.id);
                      setEditTitle(item.title);
                    }}
                  >
                    {item.title}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Добавить пункт..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={isPending || !newTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
