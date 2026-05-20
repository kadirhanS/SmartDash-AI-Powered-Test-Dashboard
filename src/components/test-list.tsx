"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Popover } from "@base-ui/react/popover";
import type { TestCase, FilterState } from "@/lib/types";
import type { AITestComment } from "@/lib/ai-types";

// ── Types ──
interface TestListProps {
  testCases: TestCase[];
  aiComments?: AITestComment[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

type SortField = "name" | "status" | "time";
type SortDirection = "asc" | "desc";

// ── Constants ──
const STATUS_ORDER: Record<string, number> = {
  failed: 0,
  error: 1,
  passed: 2,
  skipped: 3,
};

const ITEMS_PER_PAGE = 20;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  passed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400",
  failed:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 transition-colors dark:bg-red-900/30 dark:text-red-400",
  error:
    "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 transition-colors dark:bg-orange-900/30 dark:text-orange-400",
  skipped:
    "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 transition-colors dark:bg-slate-800/50 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  passed: "Geçti",
  failed: "Başarısız",
  error: "Hata",
  skipped: "Atlandı",
};

const SEVERITY_BADGE_CLASSES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-300 transition-colors dark:bg-slate-800 dark:text-slate-300",
  medium:
    "bg-yellow-100 text-yellow-700 border-yellow-300 transition-colors dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 border-orange-300 transition-colors dark:bg-orange-900 dark:text-orange-300",
  critical:
    "bg-red-100 text-red-700 border-red-300 transition-colors dark:bg-red-900 dark:text-red-300",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

// ── Helpers ──
function truncateStackTrace(trace: string, maxLines = 8): string {
  const lines = trace.split("\n");
  if (lines.length <= maxLines) return trace;
  return lines.slice(0, maxLines).join("\n") + "\n...";
}

// ── Sortable Column Header ──
function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-50" />
      )}
    </button>
  );
}

// ── Severity Badge ──
function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        SEVERITY_BADGE_CLASSES[severity] || SEVERITY_BADGE_CLASSES.medium,
      )}
    >
      {SEVERITY_LABELS[severity] || severity}
    </span>
  );
}

// ── AI Comment Popover (hover + click support) ──
function AICommentPopover({ comment }: { comment: AITestComment }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="inline-flex"
    >
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          nativeButton={false}
          render={<span />}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1 text-sm transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
          aria-label="AI yorumunu göster"
        >
          <MessageCircle className="size-4 text-primary" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            className="z-50"
            side="left"
            align="center"
            sideOffset={8}
          >
            <Popover.Popup
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className="w-72 rounded-lg border bg-popover p-4 shadow-md outline-none data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:fade-out-0 data-[starting-style]:fade-in-0 data-[ending-style]:zoom-out-95 data-[starting-style]:zoom-in-95"
            >
              <div className="space-y-3">
                {/* Analysis */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Analiz
                  </span>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                    {comment.analysis}
                  </p>
                </div>

                {/* Suggestion */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Öneri
                  </span>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                    {comment.suggestion}
                  </p>
                </div>

                {/* Severity */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs font-medium text-muted-foreground">
                    Önem Seviyesi
                  </span>
                  <SeverityBadge severity={comment.severity} />
                </div>
              </div>

              {/* Arrow */}
              <Popover.Arrow className="fill-popover stroke-border/50" />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

// ── Main Component ──
export default function TestList({
  testCases,
  aiComments,
  filters,
  onFiltersChange,
}: TestListProps) {
  // ── State ──
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // ── Search & Sort ──
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection(
          field === "status" ? "asc" : field === "time" ? "desc" : "asc",
        );
      }
      setCurrentPage(1);
    },
    [sortField],
  );

  const toggleRow = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Build a map from testName -> AITestComment for O(1) lookup
  const aiCommentMap = useMemo(() => {
    if (!aiComments) return null;
    const map = new Map<string, AITestComment>();
    for (const c of aiComments) {
      map.set(c.testName, c);
    }
    return map;
  }, [aiComments]);

  // Filtered + Sorted test cases
  const processedTestCases = useMemo(() => {
    const query = filters.searchQuery.toLowerCase().trim();

    // Filter
    let filtered = testCases;

    // Status filter
    filtered = filtered.filter((tc) =>
      filters.statusFilters.includes(tc.status),
    );

    // Text search
    if (query) {
      filtered = filtered.filter(
        (tc) =>
          tc.name.toLowerCase().includes(query) ||
          tc.classname.toLowerCase().includes(query),
      );
    }

    // Time range filter
    if (filters.minTime !== null) {
      filtered = filtered.filter((tc) => tc.time >= filters.minTime!);
    }
    if (filters.maxTime !== null) {
      filtered = filtered.filter((tc) => tc.time <= filters.maxTime!);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;

      if (sortField === "status") {
        cmp =
          (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      } else if (sortField === "name") {
        cmp = a.name.localeCompare(b.name, "tr");
      } else if (sortField === "time") {
        cmp = a.time - b.time;
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [testCases, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(processedTestCases.length / ITEMS_PER_PAGE),
  );
  const paginatedTestCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedTestCases.slice(start, start + ITEMS_PER_PAGE);
  }, [processedTestCases, currentPage]);

  // Reset page when filters change — derived state via key comparison
  const [committedFiltersKey, setCommittedFiltersKey] = useState(JSON.stringify(filters));
  const filtersKey = JSON.stringify(filters);
  if (filtersKey !== committedFiltersKey) {
    setCommittedFiltersKey(filtersKey);
    setCurrentPage(1);
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Search — controlled via parent state, synced with sidebar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Test adı veya classname ile ara..."
          value={filters.searchQuery}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchQuery: e.target.value })
          }
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Table Header */}
        <div className="grid grid-cols-[24px_1fr_80px_60px] gap-1 px-2 py-2 text-xs border-b bg-muted/30 md:grid-cols-[40px_1fr_100px_80px_44px] md:gap-2 md:px-3 md:py-2.5">
          {/* # */}
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:inline">
            #
          </span>

          {/* Test Adı */}
          <SortHeader
            label="Test Adı"
            field="name"
            currentField={sortField}
            direction={sortDirection}
            onSort={handleSort}
          />

          {/* Durum */}
          <SortHeader
            label="Durum"
            field="status"
            currentField={sortField}
            direction={sortDirection}
            onSort={handleSort}
          />

          {/* Süre */}
          <div className="text-right">
            <SortHeader
              label="Süre"
              field="time"
              currentField={sortField}
              direction={sortDirection}
              onSort={handleSort}
            />
          </div>

          {/* AI Yorumu - hidden on mobile */}
          {aiCommentMap && (
            <span className="hidden md:inline text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">
              AI
            </span>
          )}
          {!aiCommentMap && <span className="hidden md:inline" />}
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {paginatedTestCases.length === 0 ? (
            <div className="flex h-24 items-center justify-center px-3 text-sm text-muted-foreground">
              {filters.searchQuery || filters.statusFilters.length < 4 || filters.minTime !== null || filters.maxTime !== null
                ? "Filtrelere uygun test bulunamadı."
                : "Henüz test yüklenmedi."}
            </div>
          ) : (
            paginatedTestCases.map((tc, displayIdx) => {
              const globalIdx =
                (currentPage - 1) * ITEMS_PER_PAGE + displayIdx;
              const isExpanded = expandedRows.has(globalIdx);
              const hasAIComment =
                aiCommentMap && aiCommentMap.has(tc.name);

              return (
                <div key={`${tc.classname}-${tc.name}-${displayIdx}`}>
                  {/* Row */}
                  <button
                    onClick={() => toggleRow(globalIdx)}
                    className={cn(
                      "grid w-full grid-cols-[24px_1fr_80px_60px] gap-1 px-2 py-2 text-left text-sm transition-colors md:grid-cols-[40px_1fr_100px_80px_44px] md:gap-2 md:px-3 md:py-2.5",
                      "hover:bg-muted/50",
                      displayIdx % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    {/* # - hidden on mobile */}
                    <span className="mt-0.5 text-xs text-muted-foreground hidden md:inline">
                      {globalIdx + 1}
                    </span>

                    {/* Test Adı + Classname */}
                    <div className="min-w-[120px] md:min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {tc.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tc.classname}
                      </span>
                    </div>

                    {/* Durum Badge */}
                    <div className="flex items-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:text-xs",
                          STATUS_BADGE_CLASSES[tc.status],
                        )}
                      >
                        {STATUS_LABELS[tc.status] || tc.status}
                      </span>
                    </div>

                    {/* Süre */}
                    <div className="flex items-center justify-end">
                      <span className="tabular-nums text-[11px] text-muted-foreground md:text-xs">
                        {tc.time.toFixed(1)}s
                      </span>
                    </div>

                    {/* AI Yorumu - hidden on mobile */}
                    <div className="hidden md:flex items-center justify-center">
                      {hasAIComment ? (
                        <AICommentPopover
                          comment={aiCommentMap!.get(tc.name)!}
                        />
                      ) : (
                        <span className="inline-flex size-6 items-center justify-center">
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div
                      className={cn(
                        "border-t px-3 py-3",
                        displayIdx % 2 === 1 && "bg-muted/20",
                      )}
                    >
                      {tc.status === "failed" && tc.failure && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              Hata Mesajı
                            </span>
                            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
                              {tc.failure.message}
                            </p>
                          </div>
                          {tc.failure.stackTrace && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Stack Trace
                              </span>
                              <ScrollArea className="mt-0.5 max-h-32 overflow-auto rounded-md bg-muted/50 p-2">
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                                  {truncateStackTrace(tc.failure.stackTrace)}
                                </pre>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      )}

                      {tc.status === "error" && tc.error && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              Hata Mesajı
                            </span>
                            <p className="mt-0.5 text-sm text-orange-600 dark:text-orange-400">
                              {tc.error.message}
                            </p>
                          </div>
                          {tc.error.stackTrace && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Stack Trace
                              </span>
                              <ScrollArea className="mt-0.5 max-h-32 overflow-auto rounded-md bg-muted/50 p-2">
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                                  {truncateStackTrace(tc.error.stackTrace)}
                                </pre>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      )}

                      {tc.status === "skipped" && tc.skipped && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Atlanma Nedeni
                          </span>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {tc.skipped.message || "Belirtilmemiş"}
                          </p>
                        </div>
                      )}

                      {tc.status === "passed" && (
                        <p className="text-sm text-muted-foreground">
                          Test başarıyla geçti. Ek detay bulunmuyor.
                        </p>
                      )}

                      {/* AI Comment — visible on mobile in expanded detail (hidden on desktop where AI column is shown) */}
                      {hasAIComment && (
                        <div className="mt-3 space-y-2 border-t pt-3 md:hidden">
                          <span className="text-xs font-medium text-muted-foreground">
                            AI Analizi
                          </span>
                          <div className="space-y-2">
                            <p className="text-sm text-foreground">
                              {aiCommentMap!.get(tc.name)!.analysis}
                            </p>
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Öneri
                              </span>
                              <p className="mt-0.5 text-sm text-foreground">
                                {aiCommentMap!.get(tc.name)!.suggestion}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Önem Seviyesi
                              </span>
                              <SeverityBadge severity={aiCommentMap!.get(tc.name)!.severity} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show expand/collapse indicator at bottom */}
                      <button
                        onClick={() => toggleRow(globalIdx)}
                        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronUp className="size-3" />
                        Gizle
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground order-2 sm:order-1">
            {processedTestCases.length} test &middot;{" "}
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              processedTestCases.length,
            )}{" "}
            / {processedTestCases.length} gösteriliyor
          </span>

          <div className="flex items-center gap-0.5 order-1 sm:order-2">
            {/* First - hidden on mobile */}
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              aria-label="İlk sayfa"
              className="hidden sm:inline-flex"
            >
              <ChevronsLeft className="size-3" />
            </Button>

            {/* Previous */}
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="size-3" />
            </Button>

            {/* Page numbers - fewer on mobile */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon-xs"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[24px] md:min-w-[28px] text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}

            {/* Next */}
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="size-3" />
            </Button>

            {/* Last - hidden on mobile */}
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              aria-label="Son sayfa"
              className="hidden sm:inline-flex"
            >
              <ChevronsRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
