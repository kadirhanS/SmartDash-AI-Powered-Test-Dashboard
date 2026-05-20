"use client";

import { DonutChart, type DonutChartSegment } from "@/components/donut-chart";

// ── Color palette (matches badge colors) ──
const SEGMENT_COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  error: "#f59e0b",
  skipped: "#94a3b8",
} as const;

interface DonutChartWrapperProps {
  passedCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}

export function DonutChartWrapper({
  passedCount,
  failedCount,
  errorCount,
  skippedCount,
}: DonutChartWrapperProps) {
  const total = passedCount + failedCount + errorCount + skippedCount;
  const passPercent = total > 0 ? (passedCount / total) * 100 : 0;

  const data: DonutChartSegment[] = [
    { value: passedCount, color: SEGMENT_COLORS.passed, label: "Geçen" },
    { value: failedCount, color: SEGMENT_COLORS.failed, label: "Başarısız" },
    { value: errorCount, color: SEGMENT_COLORS.error, label: "Hata" },
    { value: skippedCount, color: SEGMENT_COLORS.skipped, label: "Atlandı" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  const centerContent = (
    <>
      <span
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ color: "var(--foreground)" }}
      >
        {passPercent.toFixed(0)}%
      </span>
      <span
        className="text-xs font-medium mt-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        Geçme Oranı
      </span>
    </>
  );

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      {/* Donut */}
      <div className="shrink-0">
        <DonutChart
          data={data}
          size={180}
          strokeWidth={22}
          animationDuration={0.8}
          animationDelayPerSegment={0.08}
          centerContent={centerContent}
        />
      </div>

      {/* Custom Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {data.map((entry) => {
          const pct = total > 0 ? (entry.value / total) * 100 : 0;
          return (
            <div
              key={entry.label}
              className="flex items-center gap-2 text-sm leading-tight"
            >
              <span
                className="inline-block size-2.5 rounded-full shrink-0 ring-1 ring-border/30"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className="font-medium truncate"
                style={{ color: "var(--foreground)" }}
              >
                {entry.label}
              </span>
              <span
                className="tabular-nums whitespace-nowrap"
                style={{ color: "var(--muted-foreground)" }}
              >
                {entry.value}
              </span>
              <span
                className="tabular-nums whitespace-nowrap"
                style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
              >
                (%{pct.toFixed(0)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
