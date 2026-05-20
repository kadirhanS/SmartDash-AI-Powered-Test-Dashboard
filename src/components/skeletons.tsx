"use client";

import { cn } from "@/lib/utils";

// ── Base skeleton pulse ──
function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
    />
  );
}

// ── File Upload Skeleton ──
export function FileUploadSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
      <Pulse className="size-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Pulse className="h-4 w-48" />
        <Pulse className="h-3 w-20" />
      </div>
      <Pulse className="size-5 shrink-0 rounded-full" />
      <Pulse className="size-8 shrink-0 rounded-md" />
    </div>
  );
}

// ── Table Skeleton Row ──
export function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-[40px_1fr_100px_80px_44px] gap-2 px-3 py-2.5">
      <Pulse className="h-4 w-4" />
      <div className="space-y-1.5 min-w-0">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-3 w-1/2" />
      </div>
      <Pulse className="h-5 w-16 rounded-full" />
      <Pulse className="h-4 w-12 ml-auto" />
      <Pulse className="size-6 rounded-md mx-auto" />
    </div>
  );
}

// ── Table Skeleton (5 rows) ──
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <Pulse className="h-9 w-full rounded-md" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border divide-y">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_80px_44px] gap-2 px-3 py-2.5 bg-muted/30">
          <Pulse className="h-3 w-4" />
          <Pulse className="h-3 w-12" />
          <Pulse className="h-3 w-10" />
          <Pulse className="h-3 w-8 ml-auto" />
          <Pulse className="h-3 w-6 mx-auto" />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(i % 2 === 1 && "bg-muted/20")}
          >
            <TableRowSkeleton />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Pulse className="h-3 w-32" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="size-7 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chart Skeleton ──
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10">
      <div
        className="flex w-full items-center justify-center"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Circular pulse */}
          <div className="relative flex items-center justify-center">
            <Pulse className="size-16 rounded-full" />
            <div className="absolute flex items-center justify-center">
              <Pulse className="size-6 rounded-full" />
            </div>
          </div>
          <Pulse className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Skeleton ──
export function StatCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Pulse className="size-4 rounded" />
        <Pulse className="h-4 w-32" />
      </div>
      <Pulse className="h-3 w-24" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-10" />
        </div>
        <Pulse className="h-2 w-full rounded-full" />
        <Pulse className="h-3 w-20" />
      </div>
      <Pulse className="h-[200px] w-full rounded-lg" />
    </div>
  );
}
