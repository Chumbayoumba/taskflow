"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import type { TaskWithDetails } from "@/types";

interface PromptExportDialogProps {
  task: TaskWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptExportDialog({
  task,
  open,
  onOpenChange,
}: PromptExportDialogProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setPrompt("");

    try {
      const response = await fetch("/api/tasks/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          checklistItems: task.checklistItems,
          tags: task.taskTags,
          assignee: task.assignee,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка генерации промта");
      }

      setPrompt(data.prompt);
      toast.success("Промт успешно сгенерирован");
    } catch (error) {
      console.error("Generate prompt error:", error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось сгенерировать промт"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [task, isGenerating]);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast.success("Промт скопирован в буфер обмена");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать промт");
    }
  }, [prompt]);

  const handleDownload = useCallback(() => {
    if (!prompt) return;

    const blob = new Blob([prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-prompt-${task.id.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Промт скачан");
  }, [prompt, task.id]);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setPrompt("");
        setIsGenerating(false);
        setIsCopied(false);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Экспорт задачи промтом
          </DialogTitle>
          <DialogDescription>
            Сгенерируй детальный промт для AI-ассистента на основе задачи &quot;{task.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {!prompt && !isGenerating && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-6 text-center">
                <Sparkles className="h-10 w-10 text-violet-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  AI проанализирует задачу и создаст детальное техническое задание
                  для выполнения в Claude Opus 4.6 или аналогичной модели.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Промт будет включать: функциональные требования, технический стек,
                  архитектурные решения, UI/UX требования, обработку ошибок,
                  тестирование и многое другое.
                </p>
              </div>
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Сгенерировать промт
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground">
                AI анализирует задачу и создаёт детальный промт...
              </p>
              <p className="text-xs text-muted-foreground">
                Это может занять 10-30 секунд
              </p>
            </div>
          )}

          {prompt && !isGenerating && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Готовый промт для копирования:
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Копировать
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Скачать .md
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Перегенерировать
                  </Button>
                </div>
              </div>

              <Textarea
                value={prompt}
                readOnly
                className="flex-1 min-h-[400px] font-mono text-sm resize-none"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Длина промта: {prompt.length.toLocaleString("ru-RU")} символов
                </span>
                <span>
                  Примерно {(prompt.length / 4).toLocaleString("ru-RU")} токенов
                </span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
