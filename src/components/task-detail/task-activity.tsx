"use client";

import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Activity,
  Plus,
  ArrowRight,
  Check,
  Tag,
  Link2,
  MessageSquare,
  Pencil,
  User,
  Flag,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_ACTION_LABELS } from "@/lib/constants";

interface ActivityItem {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface TaskActivityProps {
  activities: ActivityItem[];
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATED: <Plus className="h-3 w-3" />,
  STATUS_CHANGED: <ArrowRight className="h-3 w-3" />,
  PRIORITY_CHANGED: <Flag className="h-3 w-3" />,
  ASSIGNED: <User className="h-3 w-3" />,
  UNASSIGNED: <User className="h-3 w-3" />,
  TITLE_CHANGED: <Pencil className="h-3 w-3" />,
  DESCRIPTION_CHANGED: <FileText className="h-3 w-3" />,
  DEADLINE_CHANGED: <Calendar className="h-3 w-3" />,
  COMMENT_ADDED: <MessageSquare className="h-3 w-3" />,
  COMMENT_DELETED: <MessageSquare className="h-3 w-3" />,
  CHECKLIST_ITEM_ADDED: <Check className="h-3 w-3" />,
  CHECKLIST_ITEM_TOGGLED: <Check className="h-3 w-3" />,
  CHECKLIST_ITEM_DELETED: <Check className="h-3 w-3" />,
  TAG_ADDED: <Tag className="h-3 w-3" />,
  TAG_REMOVED: <Tag className="h-3 w-3" />,
  DEPENDENCY_ADDED: <Link2 className="h-3 w-3" />,
  DEPENDENCY_REMOVED: <Link2 className="h-3 w-3" />,
};

export function TaskActivity({ activities }: TaskActivityProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Активность
          {activities.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activities.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет записей активности
          </p>
        ) : (
          <div className="space-y-0">
            {sorted.map((activity, index) => (
              <div key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted flex-shrink-0">
                    {ACTION_ICONS[activity.action] || <Activity className="h-3 w-3" />}
                  </div>
                  {index < sorted.length - 1 && (
                    <div className="w-px h-full bg-border mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">{activity.user.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ACTIVITY_ACTION_LABELS[activity.action as keyof typeof ACTIVITY_ACTION_LABELS] || activity.action}
                    </span>
                  </div>

                  {/* Value change details */}
                  {(activity.oldValue || activity.newValue) && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      {activity.oldValue && (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          {activity.oldValue}
                        </span>
                      )}
                      {activity.oldValue && activity.newValue && (
                        <ArrowRight className="h-3 w-3" />
                      )}
                      {activity.newValue && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {activity.newValue}
                        </span>
                      )}
                    </div>
                  )}

                  <span
                    className="text-xs text-muted-foreground mt-0.5 block"
                    title={format(new Date(activity.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                  >
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
