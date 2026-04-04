"use client";

import { useState, useCallback, useTransition } from "react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useKanbanStore } from "@/store/kanban-store";
import { createTask } from "@/actions/tasks";
import { getProjectTasksForBoard } from "@/actions/tasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Square,
  Loader2,
  Send,
  RotateCcw,
  Check,
  CheckCheck,
  Plus,
  AlertCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PRIORITY_CONFIG } from "@/lib/constants";
import type { TaskWithRelations } from "@/types";

interface VoiceTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  selected: boolean;
}

type DialogStep =
  | "idle"
  | "recording"
  | "recorded"
  | "transcribing"
  | "transcribed"
  | "analyzing"
  | "results";

interface VoiceTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function VoiceTaskDialog({
  open,
  onOpenChange,
  projectId,
}: VoiceTaskDialogProps) {
  const [step, setStep] = useState<DialogStep>("idle");
  const [tasks, setTasks] = useState<VoiceTask[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");

  // Preserved data for retries (never lost until explicitly cleared)
  const [savedAudioBlob, setSavedAudioBlob] = useState<Blob | null>(null);
  const [savedTranscript, setSavedTranscript] = useState<string>("");

  const { setTasks: setStoreTasks } = useKanbanStore();

  const {
    isRecording,
    duration,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = useCallback(async () => {
    setError(null);
    await startRecording();
    setStep("recording");
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setStep("recorded");
  }, [stopRecording]);

  const handleTranscribe = useCallback(async () => {
    const blob = audioBlob || savedAudioBlob;
    if (!blob) return;

    // Save blob for retry
    setSavedAudioBlob(blob);
    setStep("transcribing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка распознавания речи");
        setStep("recorded");
        return;
      }

      setTranscript(data.transcript);
      setSavedTranscript(data.transcript);
      setStep("transcribed");
    } catch {
      setError("Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
      setStep("recorded");
    }
  }, [audioBlob, savedAudioBlob]);

  const handleAnalyze = useCallback(async () => {
    const text = editingTranscript ? editedTranscript : (transcript || savedTranscript);
    if (!text) return;

    setSavedTranscript(text);
    setStep("analyzing");
    setError(null);

    try {
      const response = await fetch("/api/voice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка анализа");
        setStep("transcribed");
        return;
      }

      const newTasks: VoiceTask[] = data.tasks.map(
        (t: Omit<VoiceTask, "selected">) => ({
          ...t,
          selected: true,
        })
      );

      setTasks((prev) => [...prev, ...newTasks]);
      setStep("results");
      setEditingTranscript(false);
    } catch {
      setError("Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
      setStep("transcribed");
    }
  }, [transcript, savedTranscript, editingTranscript, editedTranscript]);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, selected: !t.selected } : t))
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allSelected = tasks.every((t) => t.selected);
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  }, [tasks]);

  const handleRemoveTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleAddMore = useCallback(() => {
    resetRecording();
    setTranscript("");
    setEditedTranscript("");
    setEditingTranscript(false);
    setError(null);
    setStep("idle");
  }, [resetRecording]);

  const handleReset = useCallback(() => {
    resetRecording();
    setStep("idle");
    setTasks([]);
    setTranscript("");
    setSavedTranscript("");
    setSavedAudioBlob(null);
    setError(null);
    setEditingTranscript(false);
    setEditedTranscript("");
  }, [resetRecording]);

  const handleCreateTasks = useCallback(async () => {
    const selectedTasks = tasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) {
      toast.error("Выберите хотя бы одну задачу");
      return;
    }

    setIsCreating(true);
    let created = 0;

    startTransition(async () => {
      for (const task of selectedTasks) {
        const formData = new FormData();
        formData.set("title", task.title);
        formData.set("description", task.description);
        formData.set("priority", task.priority);

        const result = await createTask(projectId, formData);
        if (result.success) {
          created++;
        }
      }

      // Refresh tasks in store
      const freshTasks = await getProjectTasksForBoard(projectId);
      setStoreTasks(freshTasks as unknown as TaskWithRelations[]);

      setIsCreating(false);

      if (created === selectedTasks.length) {
        toast.success(`Создано задач: ${created}`);
        handleReset();
        onOpenChange(false);
      } else {
        toast.error(
          `Создано ${created} из ${selectedTasks.length} задач. Некоторые задачи не удалось создать.`
        );
      }
    });
  }, [tasks, projectId, startTransition, setStoreTasks, onOpenChange, handleReset]);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        if (isRecording) {
          stopRecording();
        }
        resetRecording();
        setStep("idle");
        setTasks([]);
        setTranscript("");
        setSavedTranscript("");
        setSavedAudioBlob(null);
        setError(null);
        setEditingTranscript(false);
        setEditedTranscript("");
      }
      onOpenChange(isOpen);
    },
    [isRecording, stopRecording, resetRecording, onOpenChange]
  );

  const selectedCount = tasks.filter((t) => t.selected).length;
  const allSelected = tasks.length > 0 && tasks.every((t) => t.selected);

  const priorityLabel = (p: string) =>
    PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.label || p;
  const priorityColor = (p: string) =>
    PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.bgColor || "bg-gray-100";
  const priorityTextColor = (p: string) =>
    PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.textColor || "text-gray-600";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI создание задач
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Error display */}
          {(error || recorderError) && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error || recorderError}</span>
            </div>
          )}

          {/* Step: Idle — show record button */}
          {step === "idle" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <button
                onClick={handleStartRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-all hover:bg-violet-200 hover:scale-105 active:scale-95 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-900/70"
              >
                <Mic className="h-10 w-10" />
              </button>
              <p className="text-muted-foreground text-sm">
                Нажмите для записи голосового описания задач
              </p>
              {tasks.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Уже распознано задач: {tasks.length}. Запишите ещё для
                  добавления.
                </p>
              )}
            </div>
          )}

          {/* Step: Recording */}
          {step === "recording" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="absolute inset-0 h-24 w-24 animate-ping rounded-full bg-red-200 opacity-30" />
                <button
                  onClick={handleStopRecording}
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 transition-all hover:bg-red-200 active:scale-95 dark:bg-red-900/50 dark:text-red-300"
                >
                  <Square className="h-8 w-8" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="font-mono text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatDuration(duration)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Идёт запись... Нажмите для остановки
              </p>
            </div>
          )}

          {/* Step: Recorded — ready to transcribe */}
          {step === "recorded" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 dark:bg-green-950/50">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Голос записан ({formatDuration(duration)})
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTranscribe} className="gap-2">
                  <Send className="h-4 w-4" />
                  Отправить на расшифровку
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetRecording();
                    setStep("idle");
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Перезаписать
                </Button>
              </div>
            </div>
          )}

          {/* Step: Transcribing */}
          {step === "transcribing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-muted-foreground text-sm">
                Расшифровка голоса...
              </p>
            </div>
          )}

          {/* Step: Transcribed — show text, ready to analyze */}
          {step === "transcribed" && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Расшифровка:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTranscript(!editingTranscript);
                      setEditedTranscript(transcript);
                    }}
                  >
                    {editingTranscript ? "Отмена" : "Редактировать"}
                  </Button>
                </div>
                {editingTranscript ? (
                  <Textarea
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {transcript}
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={handleAnalyze} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Анализировать задачи
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTranscribe}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Повторить расшифровку
                </Button>
              </div>
            </div>
          )}

          {/* Step: Analyzing */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-muted-foreground text-sm">
                AI анализирует задачи...
              </p>
            </div>
          )}

          {/* Step: Results — task list with checkboxes */}
          {step === "results" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Распознано задач: {tasks.length}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-1 text-xs"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {allSelected ? "Снять все" : "Выбрать все"}
                </Button>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      task.selected
                        ? "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/30"
                        : "border-transparent bg-muted/30 opacity-60"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        task.selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {task.selected && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium leading-tight">
                          {task.title}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-[10px] px-1.5 py-0 ${priorityColor(task.priority)} ${priorityTextColor(task.priority)}`}
                        >
                          {priorityLabel(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateTasks}
                    disabled={selectedCount === 0 || isCreating || isPending}
                    className="flex-1 gap-2"
                  >
                    {isCreating || isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Добавить{selectedCount > 0 ? ` (${selectedCount})` : ""}{" "}
                    задач
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAddMore}
                    className="gap-2"
                    disabled={isCreating || isPending}
                  >
                    <Mic className="h-4 w-4" />
                    Добавить ещё
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
