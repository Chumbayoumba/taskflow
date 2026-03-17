"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { updateProfile, getNotificationPrefs, saveNotificationPrefs } from "@/actions/user";
import type { NotificationPrefs } from "@/actions/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Bell, Shield, Camera } from "lucide-react";

interface SettingsFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences (persisted to DB)
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifStatusChanged, setNotifStatusChanged] = useState(true);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [notifInvited, setNotifInvited] = useState(true);
  const [notifLoaded, setNotifLoaded] = useState(false);

  // Load notification prefs from DB on mount
  useEffect(() => {
    getNotificationPrefs().then((prefs) => {
      setNotifAssigned(prefs.assigned);
      setNotifStatusChanged(prefs.statusChanged);
      setNotifDeadline(prefs.deadline);
      setNotifInvited(prefs.invited);
      setNotifLoaded(true);
    });
  }, []);

  // Save notification prefs when changed (after initial load)
  function handleNotifChange(key: keyof NotificationPrefs, value: boolean) {
    const setters: Record<keyof NotificationPrefs, (v: boolean) => void> = {
      assigned: setNotifAssigned,
      statusChanged: setNotifStatusChanged,
      deadline: setNotifDeadline,
      invited: setNotifInvited,
    };
    setters[key](value);

    const currentPrefs: NotificationPrefs = {
      assigned: key === "assigned" ? value : notifAssigned,
      statusChanged: key === "statusChanged" ? value : notifStatusChanged,
      deadline: key === "deadline" ? value : notifDeadline,
      invited: key === "invited" ? value : notifInvited,
    };

    saveNotificationPrefs(currentPrefs);
  }

  function handleSaveProfile() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile({ name });
      if (result.success) {
        setMessage({ type: "success", text: "Профиль обновлён" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка" });
      }
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }

      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
      setMessage({ type: "success", text: "Аватар обновлён" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Ошибка загрузки" });
    } finally {
      setIsUploading(false);
    }
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Профиль
          </CardTitle>
          <CardDescription>
            Ваша личная информация
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Фото профиля</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP или GIF. Макс. 5 МБ.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Загрузка..." : "Загрузить фото"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email нельзя изменить
            </p>
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}

          <Button onClick={handleSaveProfile} disabled={isPending || name === user.name}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Сохранить
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
          </CardTitle>
          <CardDescription>
            Настройте, какие уведомления вы хотите получать
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Назначение задачи</p>
              <p className="text-xs text-muted-foreground">
                Когда вам назначают задачу
              </p>
            </div>
            <Switch
              checked={notifAssigned}
              onCheckedChange={(v) => handleNotifChange("assigned", v)}
              disabled={!notifLoaded}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Смена статуса</p>
              <p className="text-xs text-muted-foreground">
                Когда статус вашей задачи меняется
              </p>
            </div>
            <Switch
              checked={notifStatusChanged}
              onCheckedChange={(v) => handleNotifChange("statusChanged", v)}
              disabled={!notifLoaded}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Дедлайны</p>
              <p className="text-xs text-muted-foreground">
                Предупреждения о приближающихся и просроченных дедлайнах
              </p>
            </div>
            <Switch
              checked={notifDeadline}
              onCheckedChange={(v) => handleNotifChange("deadline", v)}
              disabled={!notifLoaded}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Приглашения в проекты</p>
              <p className="text-xs text-muted-foreground">
                Когда вас приглашают в новый проект
              </p>
            </div>
            <Switch
              checked={notifInvited}
              onCheckedChange={(v) => handleNotifChange("invited", v)}
              disabled={!notifLoaded}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Безопасность
          </CardTitle>
          <CardDescription>
            Параметры безопасности аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Пароль</p>
              <p className="text-xs text-muted-foreground">
                Последнее обновление: при регистрации
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Изменить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
