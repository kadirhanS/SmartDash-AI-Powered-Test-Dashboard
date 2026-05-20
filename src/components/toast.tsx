"use client";

import { useToast, type Toast } from "@/hooks/use-toast";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

// ── Icon per type ──
const ICONS: Record<Toast["type"], React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-emerald-500" />,
  error: <AlertTriangle className="size-5 text-red-500" />,
  info: <Info className="size-5 text-blue-500" />,
};

const STYLES: Record<Toast["type"], string> = {
  success: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
};

// ── Individual Toast Item ──
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const enterTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(enterTimer);
  }, []);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
        STYLES[toast.type],
        visible && !exiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        exiting && "translate-x-full opacity-0",
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>

      <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>

      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        aria-label="Kapat"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ── Toast Container ──
export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-80 max-w-[calc(100vw-2rem)]"
      aria-live="polite"
      aria-label="Bildirimler"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
