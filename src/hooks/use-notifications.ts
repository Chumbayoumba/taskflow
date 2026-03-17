"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUnreadCount } from "@/actions/notifications";
import { toast } from "sonner";

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      if (count > prevCountRef.current && prevCountRef.current >= 0) {
        const newCount = count - prevCountRef.current;
        toast.info(
          newCount === 1
            ? "Новое уведомление"
            : `${newCount} новых уведомлений`,
          { description: "Нажмите на колокольчик для просмотра" }
        );
      }
      prevCountRef.current = count;
      setUnreadCount(count);
    } catch {
      // ignore errors
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Initial fetch (don't show toast)
    getUnreadCount()
      .then((count) => {
        if (!cancelled) {
          prevCountRef.current = count;
          setUnreadCount(count);
        }
      })
      .catch(() => {});

    // Poll every 10 seconds for near-realtime
    const interval = setInterval(refresh, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  return { unreadCount, refresh };
}
