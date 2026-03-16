"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag as TagIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addTagToTask, removeTagFromTask, createTag } from "@/actions/tags";
import { DEFAULT_TAG_COLORS } from "@/lib/constants";
import type { Tag, TaskTag } from "@/generated/prisma/client";

interface TaskTagItem extends TaskTag {
  tag: Tag;
}

interface TaskTagsProps {
  taskId: string;
  taskTags: TaskTagItem[];
  projectTags: Tag[];
  projectId: string;
}

export function TaskTags({ taskId, taskTags, projectTags, projectId }: TaskTagsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TAG_COLORS[0]);

  const assignedTagIds = new Set(taskTags.map((tt) => tt.tagId));
  const availableTags = projectTags.filter((t) => !assignedTagIds.has(t.id));

  const handleAddTag = (tagId: string) => {
    startTransition(async () => {
      await addTagToTask(taskId, tagId);
      router.refresh();
    });
  };

  const handleRemoveTag = (tagId: string) => {
    startTransition(async () => {
      await removeTagFromTask(taskId, tagId);
      router.refresh();
    });
  };

  const handleCreateAndAdd = () => {
    if (!newTagName.trim()) return;
    startTransition(async () => {
      const result = await createTag(projectId, { name: newTagName.trim(), color: selectedColor });
      if (result.success && result.data) {
        await addTagToTask(taskId, result.data.id);
      }
      setNewTagName("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Теги
        </CardTitle>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              {/* Existing tags */}
              {availableTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Добавить тег</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:opacity-80"
                        style={{ borderColor: tag.color, color: tag.color }}
                        onClick={() => handleAddTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Create new tag */}
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Создать тег</p>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Название тега..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateAndAdd();
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        selectedColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCreateAndAdd}
                  disabled={isPending || !newTagName.trim()}
                >
                  Создать и добавить
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        {taskTags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Нет тегов</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {taskTags.map((tt) => (
              <Badge
                key={tt.tagId}
                variant="secondary"
                className="gap-1 pr-1"
                style={{ backgroundColor: tt.tag.color + "20", color: tt.tag.color, borderColor: tt.tag.color }}
              >
                {tt.tag.name}
                <button
                  onClick={() => handleRemoveTag(tt.tagId)}
                  className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
