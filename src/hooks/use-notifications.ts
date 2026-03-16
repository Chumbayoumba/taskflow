"use client";

import { useEffect, useState, useCallback } from "react";
import { getUnreadCount } from "@/actions/notifications";

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore errors
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUnreadCount()
      .then((count) => {
        if (!cancelled) setUnreadCount(count);
      })
      .catch(() => {});
    const interval = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  return { unreadCount, refresh };
}
