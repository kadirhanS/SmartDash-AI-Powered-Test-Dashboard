"use client";

import { useState, useCallback } from "react";
import {
  BarChart3,
  Bug,
  Clock,
  BrainCircuit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/file-upload";
import dynamic from "next/dynamic";
  const AIConfigPanel = dynamic(() => import("@/components/ai-config-panel"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-muted-foreground" />
          <CardTitle>AI Analiz Konfigürasyonu</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center">
          <Clock className="size-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  ),
});
import { ErrorBarChart, DurationChart } from "@/components/test-charts";
import { DonutChartWrapper } from "@/components/donut-chart-wrapper";
import TestList from "@/components/test-list";
import FilterSidebar from "@/components/filter-sidebar";
import { useTheme } from "@/components/theme-provider";
import ToastContainer from "@/components/toast";
import { useToast } from "@/hooks/use-toast";
import { useRunHistory } from "@/hooks/use-run-history";
import RunHistory from "@/components/run-history";
import { ChartSkeleton, TableSkeleton } from "@/components/skeletons";
const PdfExport = dynamic(
  () => import("@/components/pdf-export").then((mod) => mod.PdfExport),
  {
    ssr: false,
    loading: () => null,
  }
);
import type { TestSuite, FilterState } from "@/lib/types";
import type { AIAnalysisResponse } from "@/lib/ai-types";
import { cn } from "@/lib/utils";

// ── Severity badge styling ──
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300",
    critical: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
        styles[severity] || styles.medium,
      )}
    >
      {severity === "critical" && "Kritik"}
      {severity === "high" && "Yüksek"}
      {severity === "medium" && "Orta"}
      {severity === "low" && "Düşük"}
    </span>
  );
}

// ── Health display ──
function HealthBadge({ health }: { health: string }) {
  const styles: Record<string, string> = {
    good: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300",
    fair: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300",
    poor: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300",
    critical: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300",
  };

  const labels: Record<string, string> = {
    good: "İyi",
    fair: "Orta",
    poor: "Zayıf",
    critical: "Kritik",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors",
        styles[health] || styles.fair,
      )}
    >
      {labels[health] || health}
    </span>
  );
}

export default function Home() {
  const [parsedData, setParsedData] = useState<TestSuite | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    statusFilters: ["passed", "failed", "error", "skipped"],
    searchQuery: "",
    minTime: null,
    maxTime: null,
  });
  const [currentFileName, setCurrentFileName] = useState<string>("");

  const { toggleTheme } = useTheme();
  const { addToast } = useToast();
  const {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    activeId,
    selectHistoryItem,
  } = useRunHistory();

  // ── File handlers ──
  const handleFileParsed = useCallback((data: TestSuite, fileName: string) => {
    setParsedData(data);
    setCurrentFileName(fileName);
    // Reset AI analysis when new data is loaded
    setAnalysisResult(null);
    // Save to run history
    addToHistory(data, fileName);
    addToast("XML dosyası başarıyla ayrıştırıldı", "success");
  }, [addToast, addToHistory]);

  const handleFileRemove = useCallback(() => {
    setParsedData(null);
    setAnalysisResult(null);
    setCurrentFileName("");
  }, []);

  // ── History handlers ──
  const handleHistoryLoad = useCallback((item: import("@/hooks/use-run-history").HistoryItem) => {
    setParsedData(item.data);
    setCurrentFileName(item.fileName);
    setAnalysisResult(null);
    addToast(`Yüklendi: ${item.fileName}`, "info");
  }, [addToast]);

  // ── AI Analysis handlers ──
  const handleAnalysisStart = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
  }, []);

  const handleAnalysisComplete = useCallback((result: AIAnalysisResponse) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setExpandedComments(new Set());
    addToast("AI analizi tamamlandı", "success");
  }, [addToast]);

  // ── Computed values ──
  const passedCount = parsedData
    ? parsedData.testCases.filter((tc) => tc.status === "passed").length
    : 0;
  const failedCount = parsedData
    ? parsedData.testCases.filter((tc) => tc.status === "failed").length
    : 0;
  const errorCount = parsedData
    ? parsedData.testCases.filter((tc) => tc.status === "error").length
    : 0;
  const skippedCount = parsedData
    ? parsedData.testCases.filter((tc) => tc.status === "skipped").length
    : 0;

  const toggleComment = (index: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-9"
            onClick={() => setSidebarOpen(true)}
            aria-label="Filtreleri aç"
            title="Filtreler"
          >
            <Filter className="size-5" />
          </Button>

          <div className="flex items-center gap-2 font-bold text-xl sm:text-base">
            <BarChart3 className="size-7 sm:size-5 text-primary" />
            <span className="tracking-tight">SmartDash</span>
          </div>

          <nav className="ml-auto flex items-center gap-3 sm:gap-6 text-base sm:text-sm">
            <span className="hidden sm:inline font-medium text-foreground">Dashboard</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 sm:size-9"
              onClick={toggleTheme}
              aria-label="Tema değiştir"
              title="Tema değiştir"
              suppressHydrationWarning
            >
              {/* CSS-only dark mode icons — both always rendered, CSS shows/hides */}
              <Sun className="size-5 sm:size-4 block dark:hidden" />
              <Moon className="size-5 sm:size-4 hidden dark:block" />
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 relative">
        {/* Sidebar — Desktop: always visible, Mobile: overlay drawer */}
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Filtreler paneli"
          className={cn(
            // Desktop
            "hidden lg:block lg:w-56 lg:shrink-0 lg:border-r lg:self-start lg:sticky lg:top-16",
            // Mobile overlay
            sidebarOpen
              ? "fixed inset-y-0 left-0 z-50 block w-64 border-r bg-background shadow-xl transition-transform duration-300 translate-x-0"
              : "hidden",
          )}
        >
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            testSuite={parsedData}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-2 py-3 sm:px-4 lg:p-6">
          <div className="mx-auto max-w-6xl space-y-4 lg:space-y-6">
            {/* Page heading */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Test Dashboard
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                JUnit XML sonuçlarınızı yükleyin, AI ile analiz edin,
                grafiklerle görselleştirin.
              </p>
            </div>

            {/* Run History — shows after first upload */}
            <RunHistory
              history={history}
              activeId={activeId}
              onSelect={selectHistoryItem}
              onRemove={removeFromHistory}
              onClear={clearHistory}
              onLoad={handleHistoryLoad}
            />

            {/* File Upload + Summary — side by side on desktop */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <FileUpload onFileParsed={handleFileParsed} onFileRemove={handleFileRemove} />

              {/* Parsed Summary */}
              {parsedData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{parsedData.name}</CardTitle>
                        <CardDescription>
                          {parsedData.testCases.length} test senaryosu &middot;{" "}
                          {parsedData.time.toFixed(3)} saniye
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {/* Passed */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 transition-colors dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-700/40">
                      <CheckCircle className="size-4" />
                      {passedCount} Passed
                    </span>

                    {/* Failed */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20 transition-colors dark:bg-red-950 dark:text-red-400 dark:ring-red-700/40">
                      <XCircle className="size-4" />
                      {failedCount} Failed
                    </span>

                    {/* Error */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 transition-colors dark:bg-orange-950 dark:text-orange-400 dark:ring-orange-700/40">
                      <AlertTriangle className="size-4" />
                      {errorCount} Error
                    </span>

                    {/* Skipped */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 transition-colors dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700/40">
                      <SkipForward className="size-4" />
                      {skippedCount} Skipped
                    </span>

                    {/* Total time */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 transition-colors dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700/40">
                      <Clock className="size-4" />
                      {parsedData.time.toFixed(2)}s
                    </span>
                  </div>

                  {/* Properties */}
                  {parsedData.properties && (
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      {Object.entries(parsedData.properties).map(([key, value]) => (
                        <span key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
                )}
            </div>

            {/* ── Main Grid: Left Data Column + Right AI Panel ── */}
            <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_320px]">
              {/* Left column: Data cards */}
              <div className="space-y-3 lg:space-y-4">

                {/* ── PDF Export Area: charts + summaries ── */}
                <div id="pdf-export-area" className="space-y-4">
                  {/* Stats grid — first row: results + errors */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Test Results Card */}
                    <Card id="pdf-test-results">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-emerald-500" />
                          <CardTitle>Test Sonuçları</CardTitle>
                        </div>
                        <CardDescription>
                          Dağılım: geçen / başarısız / hata / atlanan
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {parsedData ? (
                          <DonutChartWrapper
                            passedCount={passedCount}
                            failedCount={failedCount}
                            errorCount={errorCount}
                            skippedCount={skippedCount}
                          />
                        ) : (
                          <ChartSkeleton height={200} />
                        )}
                      </CardContent>
                    </Card>

                    {/* Error Distribution Card */}
                    <Card id="pdf-error-dist">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Bug className="size-4 text-destructive" />
                          <CardTitle>Hata Dağılımı</CardTitle>
                        </div>
                        <CardDescription>
                          Başarısız testlerdeki hata türleri
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {parsedData ? (
                          <ErrorBarChart
                            failedCount={failedCount}
                            errorCount={errorCount}
                            skippedCount={skippedCount}
                          />
                        ) : (
                          <ChartSkeleton height={200} />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Test Durations Card — full width */}
                  <Card id="pdf-duration">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <CardTitle>Test Süreleri</CardTitle>
                      </div>
                      <CardDescription>
                        En yavaş 10 test — süre analizi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {parsedData ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Toplam:</span>
                              <span className="font-medium tabular-nums">{parsedData.time.toFixed(2)}s</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Ortalama:</span>
                              <span className="font-medium tabular-nums">
                                {parsedData.testCases.length > 0
                                  ? `${(parsedData.time / parsedData.testCases.length).toFixed(2)}s`
                                  : "—"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">En hızlı:</span>
                              <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                {parsedData.testCases.length > 0
                                  ? `${Math.min(...parsedData.testCases.map((tc) => tc.time)).toFixed(2)}s`
                                  : "—"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">En yavaş:</span>
                              <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                                {parsedData.testCases.length > 0
                                  ? `${Math.max(...parsedData.testCases.map((tc) => tc.time)).toFixed(2)}s`
                                  : "—"}
                              </span>
                            </span>
                          </div>
                          <DurationChart testCases={parsedData.testCases} />
                        </div>
                      ) : (
                        <ChartSkeleton height={160} />
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Analysis Summary Card — full width */}
                  {analysisResult ? (
                    <Card id="pdf-ai-summary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="size-4 text-primary" />
                            <CardTitle>AI Analiz Özeti</CardTitle>
                          </div>
                          <PdfExport
                            parsedData={parsedData}
                            analysisResult={analysisResult}
                          />
                        </div>
                        <CardDescription>
                          AI destekli test analizi
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Sağlık Durumu</span>
                          <HealthBadge health={analysisResult.overallHealth} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Başarı Oranı</span>
                          <span className="text-sm font-semibold">
                            {analysisResult.passRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Geçen / Toplam</span>
                          <span>
                            {analysisResult.passedTests} / {analysisResult.totalTests}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Başarısız</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {analysisResult.failedTests}
                          </span>
                        </div>
                        <p className="pt-1 text-sm text-muted-foreground leading-relaxed">
                          {analysisResult.summary}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="size-4 text-muted-foreground" />
                          <CardTitle>AI Analiz Özeti</CardTitle>
                        </div>
                        <CardDescription>
                          AI destekli analiz
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25">
                          <p className="text-sm text-muted-foreground">
                            {isAnalyzing
                              ? "Analiz yapılıyor..."
                              : "AI analizi için sağ taraftaki paneli kullanın"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>{/* end pdf-export-area */}

                {/* ── Test Listesi ── */}
                <Card id="pdf-test-list">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      <CardTitle>Test Listesi</CardTitle>
                    </div>
                    <CardDescription>
                      Tüm test senaryoları &middot;{" "}
                      {parsedData ? `${parsedData.testCases.length} test` : "yüklenmedi"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {parsedData ? (
                      <TestList
                        key={parsedData.name}
                        testCases={parsedData.testCases}
                        aiComments={analysisResult?.comments}
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    ) : (
                      <TableSkeleton rows={5} />
                    )}
                  </CardContent>
                </Card>

                {/* ── AI Analysis Details ── */}
                {analysisResult && analysisResult.comments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Bug className="size-4 text-destructive" />
                        <CardTitle>AI Yorumları — Başarısız Testler</CardTitle>
                      </div>
                      <CardDescription>
                        {analysisResult.comments.length} test için AI analizi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                        <div className="space-y-2">
                          {analysisResult.comments.map((comment, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                            >
                              <button
                                onClick={() => toggleComment(idx)}
                                className="flex w-full items-start justify-between gap-2 text-left"
                                aria-expanded={expandedComments.has(idx)}
                                aria-label={expandedComments.has(idx) ? `${comment.testName} yorumunu gizle` : `${comment.testName} yorumunu göster`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium">
                                      {comment.testName}
                                    </span>
                                    <SeverityBadge severity={comment.severity} />
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {comment.analysis}
                                  </p>
                                </div>
                                {expandedComments.has(idx) ? (
                                  <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                                )}
                              </button>

                              {expandedComments.has(idx) && (
                                <div className="mt-3 space-y-2 border-t pt-3">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Öneri
                                    </span>
                                    <p className="mt-0.5 text-sm">
                                      {comment.suggestion}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Recommendations ── */}
                {analysisResult && analysisResult.recommendations.length > 0 && (
                  <Card id="pdf-recommendations">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="size-4 text-amber-500" />
                        <CardTitle>Öneriler</CardTitle>
                      </div>
                      <CardDescription>
                        AI tarafından üretilen iyileştirme önerileri
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-sm">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {idx + 1}
                            </span>
                            <span className="text-muted-foreground">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>{/* end left column */}

              {/* Right column: AI Config Panel — sticky on desktop */}
              <div className="space-y-3 lg:space-y-4 lg:sticky lg:top-[73px] lg:self-start">
                <AIConfigPanel
                  testSuite={parsedData}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisStart={handleAnalysisStart}
                  isAnalyzing={isAnalyzing}
                />

                {/* Tips card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <CardTitle>İpuçları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="mt-0.5">1.</span>
                      <span>OpenRouter&apos;a kaydolup ücretsiz API anahtarı alın</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="mt-0.5">2.</span>
                      <span>Anahtarı doğrulayın ve ücretsiz modellerden birini seçin</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="mt-0.5">3.</span>
                      <span>JUnit XML dosyanızı yükleyip AI analizini başlatın</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>{/* end main grid */}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
