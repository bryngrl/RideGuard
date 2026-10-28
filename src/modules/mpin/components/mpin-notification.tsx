import { useCallback, useEffect, useState } from "react";
import { NotificationSheet } from "@/shared/ui/notification-sheet";

export function MpinNotification({ error, success }: { error?: string | null; success?: string }) {
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" } | null>(null);
  useEffect(() => {
    setNotice(error ? { message: error, type: "error" } : success ? { message: success, type: "success" } : null);
  }, [error, success]);
  const hide = useCallback(() => setNotice(null), []);
  return <NotificationSheet visible={!!notice} message={notice?.message ?? ""} type={notice?.type} onHide={hide} />;
}
