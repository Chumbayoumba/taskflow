"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject, deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Trash2,
  Palette,
  AlertTriangle,
  FolderEdit,
} from "lucide-react";

interface ProjectSettingsProps {
  projectId: string;
  project: {
    name: string;
    description: string | null;
    color: string;
  };
  currentRole: string;
}

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#2563eb", "#64748b", "#1e293b",
];

export function ProjectSettings({
  projectId,
  project,
  currentRole,
}: ProjectSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isOwner = currentRole === "OWNER";

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("color", color);

    startTransition(async () => {
      const result = await updateProject(projectId, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Настройки сохранены!" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка" });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.success) {
        router.push("/projects");
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка удаления" });
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* General Settings */}
      <div className="rounded-lg border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FolderEdit className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Основные настройки</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Название проекта</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой проект"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Описание</Label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта..."
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Цвет проекта
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0"
              />
              <span className="text-sm text-muted-foreground font-mono">{color}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Сохранить
            </Button>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone — Owner only */}
      {isOwner && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Опасная зона</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Удаление проекта необратимо. Все задачи, участники и данные будут удалены навсегда.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить проект
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Введите <span className="font-bold">{project.name}</span> для подтверждения:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.name}
                className="border-red-300 dark:border-red-800"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText !== project.name || isPending}
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Подтвердить удаление
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
