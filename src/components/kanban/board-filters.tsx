"use client";

import { useState } from "react";
import {
  Filter,
  X,
  Users,
  Tag,
  Calendar,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  TASK_PRIORITIES,
  PRIORITY_CONFIG,
  FILTER_DEADLINE_OPTIONS,
} from "@/lib/constants";
import type { BoardFilters } from "@/types";

interface BoardFiltersProps {
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  members: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  tags: { id: string; name: string; color: string }[];
}

export function BoardFiltersBar({
  filters,
  onFiltersChange,
  members,
  tags,
}: BoardFiltersProps) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const activeCount =
    filters.assigneeIds.length +
    filters.priorities.length +
    filters.tagIds.length +
    (filters.deadlineFilter !== "all" ? 1 : 0);

  const toggleAssignee = (id: string) => {
    const next = filters.assigneeIds.includes(id)
      ? filters.assigneeIds.filter((a) => a !== id)
      : [...filters.assigneeIds, id];
    onFiltersChange({ ...filters, assigneeIds: next });
  };

  const togglePriority = (priority: string) => {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: next });
  };

  const toggleTag = (id: string) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((t) => t !== id)
      : [...filters.tagIds, id];
    onFiltersChange({ ...filters, tagIds: next });
  };

  const setDeadline = (value: BoardFilters["deadlineFilter"]) => {
    onFiltersChange({ ...filters, deadlineFilter: value });
    setDeadlineOpen(false);
  };

  const resetFilters = () => {
    onFiltersChange({
      assigneeIds: [],
      priorities: [],
      tagIds: [],
      deadlineFilter: "all",
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Фильтры</span>
        {activeCount > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 px-1.5 text-xs font-semibold"
          >
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Assignee filter */}
      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              filters.assigneeIds.length > 0 &&
                "border-primary/50 bg-primary/5"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Исполнитель
            {filters.assigneeIds.length > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-semibold ml-0.5"
              >
                {filters.assigneeIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-1.5">
                Нет участников
              </p>
            ) : (
              members.map((member) => {
                const selected = filters.assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member.id)}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                      selected && "bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{member.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Priority filter */}
      <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              filters.priorities.length > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Приоритет
            {filters.priorities.length > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-semibold ml-0.5"
              >
                {filters.priorities.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start">
          <div className="space-y-1">
            {TASK_PRIORITIES.map((priority) => {
              const config = PRIORITY_CONFIG[priority];
              const selected = filters.priorities.includes(priority);
              return (
                <button
                  key={priority}
                  onClick={() => togglePriority(priority)}
                  className={cn(
                    "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                    selected && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.hex }}
                  />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Tag filter */}
      <Popover open={tagOpen} onOpenChange={setTagOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              filters.tagIds.length > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            Теги
            {filters.tagIds.length > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-semibold ml-0.5"
              >
                {filters.tagIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-1.5">
                Нет тегов
              </p>
            ) : (
              tags.map((tag) => {
                const selected = filters.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                      selected && "bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Deadline filter */}
      <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              filters.deadlineFilter !== "all" &&
                "border-primary/50 bg-primary/5"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {filters.deadlineFilter === "all"
              ? "Дедлайн"
              : FILTER_DEADLINE_OPTIONS.find(
                  (o) => o.value === filters.deadlineFilter
                )?.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {FILTER_DEADLINE_OPTIONS.map((option) => {
              const selected = filters.deadlineFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setDeadline(
                      option.value as BoardFilters["deadlineFilter"]
                    )
                  }
                  className={cn(
                    "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                    selected && "bg-accent font-medium"
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                  <span className={cn(!selected && "ml-[22px]")}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Reset button */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={resetFilters}
        >
          <X className="h-3.5 w-3.5" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
