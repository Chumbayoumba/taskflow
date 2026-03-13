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
    refresh();
    const interval = setInterval(refresh, 30000); // every 30 sec
    return () => clearInterval(interval);
  }, [refresh]);

  return { unreadCount, refresh };
}
