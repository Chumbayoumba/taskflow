"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTask } from "@/actions/tasks";
import type { TaskWithDetails } from "@/types";

interface TaskDescriptionProps {
  task: TaskWithDetails;
}

export function TaskDescription({ task }: TaskDescriptionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", task.id);
      formData.append("description", description.trim());
      formData.append("projectId", task.projectId);
      await updateTask(task.id, formData);
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Описание
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание задачи..."
              rows={6}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                <Check className="h-4 w-4 mr-1" />
                Сохранить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDescription(task.description || "");
                  setIsEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-muted-foreground whitespace-pre-wrap cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors min-h-[60px]"
            onClick={() => setIsEditing(true)}
          >
            {task.description || "Нажмите чтобы добавить описание..."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
