"use client";

import { useState, useTransition } from "react";
import { addMember, removeMember, changeMemberRole } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Loader2,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
  Mail,
  ChevronDown,
} from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface MemberManagementProps {
  projectId: string;
  members: Member[];
  currentUserRole: string;
  currentUserId: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  OWNER: { label: "Владелец", icon: Crown, color: "text-amber-500" },
  ADMIN: { label: "Админ", icon: ShieldCheck, color: "text-blue-500" },
  MEMBER: { label: "Участник", icon: Shield, color: "text-slate-500" },
};

export function MemberManagement({
  projectId,
  members,
  currentUserRole,
  currentUserId,
}: MemberManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "OWNER";

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setMessage(null);

    startTransition(async () => {
      const result = await addMember(projectId, email.trim(), role);
      if (result.success) {
        setMessage({ type: "success", text: "Участник добавлен!" });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка" });
      }
    });
  }

  function handleRemove(userId: string) {
    setRemovingId(userId);
    setMessage(null);

    startTransition(async () => {
      const result = await removeMember(projectId, userId);
      if (result.success) {
        setMessage({ type: "success", text: "Участник удалён" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка" });
      }
      setRemovingId(null);
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    setMessage(null);

    startTransition(async () => {
      const result = await changeMemberRole(projectId, userId, newRole);
      if (result.success) {
        setMessage({ type: "success", text: "Роль изменена" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка" });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      {canManage && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Пригласить участника</h3>
          </div>

          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="w-36 space-y-1">
              <Label>Роль</Label>
              <Select
                value={role}
                onValueChange={(v: string | null) => setRole(v ?? "MEMBER")}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {ROLE_CONFIG[role]?.label ?? "Участник"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN" label="Админ">Админ</SelectItem>
                  <SelectItem value="MEMBER" label="Участник">Участник</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending && !removingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              Добавить
            </Button>
          </form>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>
      )}

      {/* Member List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Участники ({members.length})
        </h3>

        <div className="divide-y rounded-lg border">
          {members.map((m) => {
            const config = ROLE_CONFIG[m.role] || ROLE_CONFIG.MEMBER;
            const RoleIcon = config.icon;
            const isCurrentUser = m.user.id === currentUserId;
            const canRemove =
              canManage && !isCurrentUser && m.role !== "OWNER";

            return (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {m.user.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {m.user.name}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-1">(вы)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role display — OWNER can change roles of non-owner members */}
                  {isOwner && !isCurrentUser && m.role !== "OWNER" ? (
                    <Select
                      value={m.role}
                      onValueChange={(v: string | null) => {
                        if (v) handleRoleChange(m.user.id, v);
                      }}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1 px-2 border-0 bg-secondary/50 hover:bg-secondary">
                        <RoleIcon className={`h-3 w-3 ${config.color}`} />
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-blue-500" />
                            Админ
                          </span>
                        </SelectItem>
                        <SelectItem value="MEMBER">
                          <span className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-slate-500" />
                            Участник
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`gap-1 ${config.color}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  )}

                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleRemove(m.user.id)}
                      disabled={isPending && removingId === m.user.id}
                    >
                      {isPending && removingId === m.user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
