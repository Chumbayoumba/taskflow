"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Send, Pencil, Trash2, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createComment, updateComment, deleteComment } from "@/actions/comments";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  currentUserId: string;
}

export function TaskComments({ taskId, comments, currentUserId }: TaskCommentsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleCreate = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await createComment(taskId, newComment.trim());
      setNewComment("");
      router.refresh();
    });
  };

  const handleUpdate = (commentId: string) => {
    if (!editContent.trim()) return;
    startTransition(async () => {
      await updateComment(commentId, editContent.trim());
      setEditingId(null);
      router.refresh();
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      await deleteComment(commentId);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Комментарии
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Пока нет комментариев
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {comment.author.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground" title={format(new Date(comment.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}>
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                    {comment.updatedAt > comment.createdAt && (
                      <span className="text-xs text-muted-foreground">(изменён)</span>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(comment.id)}
                          disabled={isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Сохранить
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      {comment.author.id === currentUserId && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditContent(comment.content);
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Изменить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New comment form */}
        <div className="border-t pt-4 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleCreate();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ctrl + Enter для отправки</span>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !newComment.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              Отправить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
