"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { TestSuite, FilterState, TestStatus } from "@/lib/types";

// ── Types ──
interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  testSuite: TestSuite | null;
  onClose?: () => void;
}

// ── Constants ──
const STATUS_OPTIONS: { key: TestStatus; label: string }[] = [
  { key: "passed", label: "Geçen" },
  { key: "failed", label: "Başarısız" },
  { key: "error", label: "Hata" },
  { key: "skipped", label: "Atlandı" },
];

const DEFAULT_FILTERS: FilterState = {
  statusFilters: ["passed", "failed", "error", "skipped"],
  searchQuery: "",
  minTime: null,
  maxTime: null,
};

// ── Component ──
export default function FilterSidebar({
  filters,
  onFiltersChange,
  testSuite,
  onClose,
}: FilterSidebarProps) {
  // ── Filtered counts (apply all filters except status) ──
  const filteredCounts = useMemo(() => {
    const counts: Record<TestStatus, number> = {
      passed: 0,
      failed: 0,
      error: 0,
      skipped: 0,
    };
    if (!testSuite) return counts;

    const query = filters.searchQuery.toLowerCase().trim();

    for (const tc of testSuite.testCases) {
      // Apply search filter (excluding status)
      if (query) {
        const matchesSearch =
          tc.name.toLowerCase().includes(query) ||
          tc.classname.toLowerCase().includes(query);
        if (!matchesSearch) continue;
      }

      // Apply time range filter (excluding status)
      if (filters.minTime !== null && tc.time < filters.minTime) continue;
      if (filters.maxTime !== null && tc.time > filters.maxTime) continue;

      counts[tc.status]++;
    }

    return counts;
  }, [testSuite, filters.searchQuery, filters.minTime, filters.maxTime]);

  // ── Handlers ──
  const handleStatusToggle = (status: TestStatus) => {
    const next = filters.statusFilters.includes(status)
      ? filters.statusFilters.filter((s) => s !== status)
      : [...filters.statusFilters, status];
    onFiltersChange({ ...filters, statusFilters: next });
  };

  const handleReset = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const setFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // ── Render ──
  return (
    <div className="sticky top-4 flex max-h-screen flex-col gap-5 overflow-y-auto p-4">
      {/* Title row with close button for mobile */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filtreler
        </span>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 lg:hidden"
            onClick={onClose}
            aria-label="Filtreleri kapat"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* a) Status checkboxes */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Durum</span>
        <div className="space-y-1.5">
          {STATUS_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={filters.statusFilters.includes(key)}
                onChange={() => handleStatusToggle(key)}
                className="size-4 rounded border-gray-300 text-primary accent-primary focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-muted dark:accent-primary"
              />
              <span className="flex-1">{label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {filteredCounts[key]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* b) Test name search */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Test Adı</span>
        <Input
          placeholder="Test adı ile ara..."
          value={filters.searchQuery}
          onChange={(e) => setFilter("searchQuery", e.target.value)}
        />
      </div>

      {/* c) Duration range */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Süre Aralığı</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder="0"
            value={filters.minTime ?? ""}
            onChange={(e) =>
              setFilter(
                "minTime",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className="w-full"
          />
          <span className="text-xs text-muted-foreground shrink-0">—</span>
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder="10"
            value={filters.maxTime ?? ""}
            onChange={(e) =>
              setFilter(
                "maxTime",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className="w-full"
          />
        </div>
      </div>

      {/* d) Reset button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="w-full"
      >
        Filtreleri Sıfırla
      </Button>
    </div>
  );
}
