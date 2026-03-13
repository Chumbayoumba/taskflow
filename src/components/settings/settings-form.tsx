"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Bell, Shield } from "lucide-react";

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification preferences (client-side for now)
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifStatusChanged, setNotifStatusChanged] = useState(true);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [notifInvited, setNotifInvited] = useState(true);

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
            <Switch checked={notifAssigned} onCheckedChange={setNotifAssigned} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Смена статуса</p>
              <p className="text-xs text-muted-foreground">
                Когда статус вашей задачи меняется
              </p>
            </div>
            <Switch checked={notifStatusChanged} onCheckedChange={setNotifStatusChanged} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Дедлайны</p>
              <p className="text-xs text-muted-foreground">
                Предупреждения о приближающихся и просроченных дедлайнах
              </p>
            </div>
            <Switch checked={notifDeadline} onCheckedChange={setNotifDeadline} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Приглашения в проекты</p>
              <p className="text-xs text-muted-foreground">
                Когда вас приглашают в новый проект
              </p>
            </div>
            <Switch checked={notifInvited} onCheckedChange={setNotifInvited} />
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
