"use client";

import { useState } from "react";
import {
  Clock,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HistoryItem } from "@/hooks/use-run-history";

interface RunHistoryProps {
  history: HistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onLoad: (item: HistoryItem) => void;
}

export default function RunHistory({
  history,
  activeId,
  onSelect,
  onRemove,
  onClear,
  onLoad,
}: RunHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (history.length === 0) return null;

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Az önce";
    if (diffMin < 60) return `${diffMin} dk önce`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2"
            aria-expanded={isOpen}
            aria-label="Geçmiş yüklemeleri göster/gizle"
          >
            {isOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Geçmiş Yüklemeler</CardTitle>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
              {history.length}
            </span>
          </button>

          {isOpen && history.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3" />
              Temizle
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Önceki yüklemelerinizi görüntüleyin
        </CardDescription>
      </CardHeader>

      {isOpen && (
        <CardContent className="max-h-64 space-y-1 overflow-y-auto pt-0">
          {history.map((item) => {
            const isActive = item.id === activeId;
            const passRate =
              item.testCount > 0
                ? ((item.passedCount / item.testCount) * 100).toFixed(0)
                : "0";

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  if (!isActive) {
                    onLoad(item);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                  isActive
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-transparent bg-card",
                )}
              >
                <FileText className="size-5 shrink-0 text-primary" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.fileName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="size-3" />
                      {item.testCount} test
                    </span>
                  </div>
                </div>

                {/* Pass rate */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      Number(passRate) >= 80
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : Number(passRate) >= 50
                          ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
                    )}
                  >
                    <CheckCircle2 className="size-3" />
                    {passRate}%
                  </span>
                  {item.failedCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                      <XCircle className="size-3" />
                      {item.failedCount}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  aria-label={`${item.fileName} geçmişini sil`}
                  title="Sil"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </button>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
