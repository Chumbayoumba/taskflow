"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchGlobal } from "@/actions/user";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FolderKanban, CheckSquare, Loader2 } from "lucide-react";
import { STATUS_CONFIG } from "@/lib/constants";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<{
    tasks: { id: string; title: string; projectId: string; status: string }[];
    projects: { id: string; name: string; color: string }[];
  }>({ tasks: [], projects: [] });

  const doSearch = useCallback(
    (q: string) => {
      if (q.trim().length < 2) {
        setResults({ tasks: [], projects: [] });
        return;
      }
      startTransition(async () => {
        const res = await searchGlobal(q);
        setResults(res);
      });
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ tasks: [], projects: [] });
    }
  }, [open]);

  // Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  function navigate(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  const hasResults = results.projects.length > 0 || results.tasks.length > 0;
  const showEmpty = query.trim().length >= 2 && !isPending && !hasResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Поиск</DialogTitle>

        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск задач и проектов..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
            autoFocus
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Projects */}
          {results.projects.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Проекты</p>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent text-sm text-left transition-colors"
                  onClick={() => navigate(`/projects/${p.id}/board`)}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Задачи</p>
              {results.tasks.map((t) => {
                const statusConf = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG];
                return (
                  <button
                    key={t.id}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent text-sm text-left transition-colors"
                    onClick={() => navigate(`/projects/${t.projectId}/board`)}
                  >
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{t.title}</span>
                    {statusConf && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${statusConf.hex}20`,
                          color: statusConf.hex,
                        }}
                      >
                        {statusConf.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {showEmpty && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ничего не найдено
            </p>
          )}

          {query.trim().length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Введите минимум 2 символа для поиска
            </p>
          )}
        </div>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> навигация
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> открыть
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> закрыть
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
