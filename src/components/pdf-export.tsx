"use client";

import { useState, useCallback } from "react";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TestSuite } from "@/lib/types";
import type { AIAnalysisResponse } from "@/lib/ai-types";

interface PdfExportProps {
  parsedData: TestSuite | null;
  analysisResult: AIAnalysisResponse | null;
}

// ── Color palette ──
type RGB = readonly [number, number, number];

const C: Record<string, RGB> = {
  primary: [37, 99, 235],
  passed: [34, 197, 94],
  failed: [239, 68, 68],
  error: [249, 115, 22],
  skipped: [148, 163, 184],
  heading: [30, 41, 59],
  muted: [71, 85, 105],
  white: [255, 255, 255],
  altRow: [248, 250, 252],
  border: [226, 232, 240],
};

const MM = 15; // page margin
const PW = 210; // A4 width
const CW = PW - MM * 2; // usable content width (180mm)
const CONTENT_BOTTOM = 270; // max Y for content before page break
const FOOTER_LINE_Y = 276; // separator line — drawn first, well above text
const FOOTER_TEXT_Y = 282; // text baseline — ensures line never overlaps text

// ── Turkish character transliteration ──
// jsPDF built-in Helvetica does NOT support Turkish chars (ı,ğ,ü,ş,ö,ç,İ).
// We strip diacritics so text renders correctly.
const TR_MAP: Record<string, string> = {
  ı: 'i', İ: 'I', ğ: 'g', Ğ: 'G',
  ü: 'u', Ü: 'U', ş: 's', Ş: 'S',
  ö: 'o', Ö: 'O', ç: 'c', Ç: 'C',
};
function tr(text: string): string {
  return text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, (ch) => TR_MAP[ch] || ch);
}

// ── Helpers ──

/** Format today's date (ASCII-safe) */
function todayStr(): string {
  const d = new Date();
  const months = [
    "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
    "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Draw page footer with page numbers — line drawn FIRST, text BELOW it */
function addFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  // Separator line — drawn above text so it never cuts into the text
  pdf.setDrawColor(...C.border);
  pdf.setLineWidth(0.5);
  pdf.line(MM, FOOTER_LINE_Y, PW - MM, FOOTER_LINE_Y);
  // Text — baseline at FOOTER_TEXT_Y, safe gap from line
  pdf.setFontSize(8);
  pdf.setTextColor(...C.muted);
  pdf.text(
    tr(`SmartDash \u2014 AI Destekli Test Analizi | Sayfa ${pageNum} / ${totalPages}`),
    MM,
    FOOTER_TEXT_Y,
  );
}

/** Draw a page title with underline accent */
function addPageTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...C.heading);
  pdf.text(tr(title), MM, y);
  pdf.setDrawColor(...C.primary);
  pdf.setLineWidth(0.8);
  pdf.line(MM, y + 2, MM + 60, y + 2);
  return y + 10;
}

/** Draw a small colored badge — text vertically centred inside the rect */
function drawBadge(
  pdf: jsPDF,
  text: string,
  color: RGB,
  x: number,
  y: number,
): number {
  const safe = tr(text);
  const w = pdf.getTextWidth(safe) + 8;
  const bh = 7;
  // Centre the box around the text baseline (8pt ≈ 2.8mm, visual centre ~0.7mm above baseline)
  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  pdf.roundedRect(x, y - 4.2, w, bh, 1, 1, "F");
  pdf.setTextColor(...C.white);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(safe, x + 4, y);
  return w;
}

/** Truncate text with ellipsis to fit maxWidth */
function truncateText(pdf: jsPDF, text: string, maxW: number): string {
  const safe = tr(text);
  if (pdf.getTextWidth(safe) <= maxW) return safe;
  let s = safe;
  while (s.length > 0 && pdf.getTextWidth(s + "\u2026") > maxW) {
    s = s.slice(0, -1);
  }
  return s + "\u2026";
}

/** Draw a stat box — used on the cover page, 2-row layout */
function drawStatBox(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: number | string,
  color: RGB,
) {
  const safeLabel = tr(label);
  const safeValue = String(value);

  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  pdf.roundedRect(x, y, w, h, 2, 2, "F");

  pdf.setTextColor(...C.white);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  const vw = pdf.getTextWidth(safeValue);
  pdf.text(safeValue, x + (w - vw) / 2, y + h * 0.55);

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  const lw = pdf.getTextWidth(safeLabel);
  pdf.text(safeLabel, x + (w - lw) / 2, y + h * 0.85);
}

// ── Component ──

export function PdfExport({ parsedData, analysisResult }: PdfExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const handleExport = useCallback(async () => {
    if (!parsedData || !analysisResult) return;

    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Health helpers
      const healthLabels: Record<string, string> = {
        good: "IyI",
        fair: "Orta",
        poor: "Zayif",
        critical: "Kritik",
      };
      const healthColors: Record<string, RGB> = {
        good: C.passed,
        fair: [234, 179, 8],
        poor: C.error,
        critical: C.failed,
      };
      const healthKey = analysisResult.overallHealth || "fair";
      const healthCol: RGB = healthColors[healthKey] || C.skipped;
      const passRate = (analysisResult.passRate ?? 0).toFixed(1);

      // ════════════════════════════════════════════
      // PAGE 1 — COVER
      // ════════════════════════════════════════════
      pdf.setFillColor(...C.primary);
      pdf.rect(0, 0, PW, 40, "F");

      pdf.setTextColor(...C.white);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("SmartDash", PW / 2, 22, { align: "center" });

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text(tr("Test Analiz Raporu"), PW / 2, 32, { align: "center" });

      // suite name
      pdf.setTextColor(...C.heading);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      const suiteName = parsedData.name || "Test Suite";
      pdf.text(suiteName, PW / 2, 70, { align: "center" });

      // date
      pdf.setTextColor(...C.muted);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(todayStr(), PW / 2, 80, { align: "center" });

      // divider
      pdf.setDrawColor(...C.primary);
      pdf.setLineWidth(0.8);
      pdf.line(PW / 2 - 30, 88, PW / 2 + 30, 88);

      // health badge (large, centered — text vertically centred inside rect)
      const healthText = tr(`Saglik: ${healthLabels[healthKey] || healthKey}`);
      const healthBadgeWidth = pdf.getTextWidth(healthText) + 24;
      const hbY = 100; const hbH = 10;
      pdf.setFillColor(...healthCol);
      pdf.setDrawColor(...healthCol);
      pdf.roundedRect((PW - healthBadgeWidth) / 2, hbY, healthBadgeWidth, hbH, 2, 2, "F");
      pdf.setTextColor(...C.white);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      // vertical center: baseline = box_center + ~35% of font height in mm
      pdf.text(healthText, PW / 2, hbY + hbH / 2 + 1.5, { align: "center" });

      // pass rate — large number
      pdf.setTextColor(...C.heading);
      pdf.setFontSize(36);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${passRate}%`, PW / 2, 142, { align: "center" });
      pdf.setTextColor(...C.muted);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(tr("Basar Orani"), PW / 2, 152, { align: "center" });

      // ── Bottom stat boxes — 2 rows to avoid narrow boxes ──
      const coverStats: { label: string; value: number | string; color: RGB }[] = [
        { label: "Toplam Test", value: parsedData.tests, color: C.primary },
        { label: "Gecen", value: analysisResult.passedTests, color: C.passed },
        { label: "Basarisiz", value: analysisResult.failedTests, color: C.failed },
        { label: "Hata", value: parsedData.errors, color: C.error },
        { label: "Atlanan", value: parsedData.skipped, color: C.skipped },
      ];

      const row1 = coverStats.slice(0, 3);
      const row2 = coverStats.slice(3);
      const rowBoxW = (CW - 12) / 3; // 3 boxes per row = ~52mm each
      const coverBoxH = 20;

      // Row 1 (3 items)
      row1.forEach((item, i) => {
        const bx = MM + i * (rowBoxW + 6);
        drawStatBox(pdf, bx, 175, rowBoxW, coverBoxH, item.label, item.value, item.color);
      });

      // Row 2 (2 items, centered)
      const row2TotalW = 2 * rowBoxW + 6;
      const row2Start = MM + (CW - row2TotalW) / 2;
      row2.forEach((item, i) => {
        const bx = row2Start + i * (rowBoxW + 6);
        drawStatBox(pdf, bx, 200, rowBoxW, coverBoxH, item.label, item.value, item.color);
      });

      // ════════════════════════════════════════════
      // PAGE 2 — EXECUTIVE SUMMARY
      // ════════════════════════════════════════════
      pdf.addPage();
      let y = MM + 10;
      y = addPageTitle(pdf, "Yonetici Ozeti", y);

      // stat boxes (4 per row, wider = ~39mm each)
      const summaryBoxW = (CW - 12) / 4;
      const summaryBoxes = [
        { label: "Gecen", value: analysisResult.passedTests, color: C.passed },
        { label: "Basarisiz", value: analysisResult.failedTests, color: C.failed },
        { label: "Hata", value: parsedData.errors, color: C.error },
        { label: "Atlanan", value: parsedData.skipped, color: C.skipped },
      ];

      summaryBoxes.forEach((item, i) => {
        const bx = MM + i * (summaryBoxW + 4);
        pdf.setFillColor(...item.color);
        pdf.setDrawColor(...item.color);
        pdf.roundedRect(bx, y, summaryBoxW, 24, 2, 2, "F");

        pdf.setTextColor(...C.white);
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        const sv = String(item.value);
        const svW = pdf.getTextWidth(sv);
        pdf.text(sv, bx + (summaryBoxW - svW) / 2, y + 14);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        const sl = tr(item.label);
        const slW = pdf.getTextWidth(sl);
        pdf.text(sl, bx + (summaryBoxW - slW) / 2, y + 22);
      });

      y += 32;

      // detail rows
      const detailRow = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...C.heading);
        pdf.text(tr(label), MM, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.muted);
        pdf.text(value, MM + 50, y);
        y += 7;
      };

      detailRow("Toplam Test:", String(parsedData.tests));
      detailRow("Basar Orani:", `%${passRate}`);
      detailRow("Toplam Sure:", `${parsedData.time.toFixed(3)} saniye`);
      y += 4;

      // health
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...C.heading);
      pdf.text(tr("Saglik Durumu:"), MM, y);
      drawBadge(pdf, healthLabels[healthKey] || healthKey, healthCol, MM + 50, y);
      y += 12;

      // AI summary
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...C.heading);
      pdf.text(tr("AI Analiz Ozeti"), MM, y);
      y += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.muted);
      const summaryText = tr(analysisResult.summary || "AI analizi mevcut degil.");
      const summaryLines = pdf.splitTextToSize(summaryText, CW);

      if (y + summaryLines.length * 5 > CONTENT_BOTTOM) {
        pdf.addPage();
        y = MM + 10;
      }
      pdf.text(summaryLines, MM, y);
      y += summaryLines.length * 5 + 2;

      // ════════════════════════════════════════════
      // PAGE 3+ — TEST RESULTS TABLE
      // ════════════════════════════════════════════
      pdf.addPage();
      y = MM + 10;
      y = addPageTitle(pdf, tr("Test Sonuclari Detayi"), y);

      const colW = [10, 60, 45, 22, 20];
      const headers = ["#", tr("Test Adi"), "Classname", tr("Durum"), tr("Sure (sn)")];
      const testCases = parsedData.testCases || [];
      const rowH = 6;

      /** Draw table header row */
      const drawHeader = (p: jsPDF, yy: number) => {
        p.setFillColor(...C.primary);
        p.rect(MM, yy, CW, 8, "F");
        p.setTextColor(...C.white);
        p.setFontSize(9);
        p.setFont("helvetica", "bold");
        let hx = MM;
        headers.forEach((h) => {
          p.text(h, hx + 2, yy + 5.5);
          hx += colW[headers.indexOf(h)];
        });
      };

      drawHeader(pdf, y);
      y += 10;

      // Status helpers
      const statusColors: Record<string, RGB> = {
        passed: C.passed,
        failed: C.failed,
        error: C.error,
        skipped: C.skipped,
      };
      const statusLabels: Record<string, string> = {
        passed: "Passed",
        failed: "Failed",
        error: "Error",
        skipped: "Skipped",
      };

      let rowNum = 0;
      for (const tc of testCases) {
        rowNum++;

        // page break check
        if (y + rowH > CONTENT_BOTTOM) {
          pdf.addPage();
          y = MM + 10;
          drawHeader(pdf, y);
          y += 10;
        }

        // alternating row
        if (rowNum % 2 === 0) {
          pdf.setFillColor(...C.altRow);
          pdf.rect(MM, y, CW, rowH, "F");
        }

        pdf.setTextColor(...C.muted);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        // row number
        pdf.text(String(rowNum), MM + 2, y + 4);

        // test name (truncated)
        pdf.text(truncateText(pdf, tc.name || "", colW[1] - 4), MM + colW[0] + 2, y + 4);

        // classname (truncated)
        pdf.text(
          truncateText(pdf, tc.classname || "", colW[2] - 4),
          MM + colW[0] + colW[1] + 2,
          y + 4,
        );

        // status badge
        const sc: RGB = statusColors[tc.status] || C.skipped;
        const sl = statusLabels[tc.status] || tc.status;
        const badgeStartX = MM + colW[0] + colW[1] + colW[2];
        const badgeW = pdf.getTextWidth(sl) + 8;

        pdf.setFillColor(...sc);
        pdf.setDrawColor(...sc);
        pdf.roundedRect(badgeStartX + 1, y + 0.5, badgeW, 5, 1, 1, "F");
        pdf.setTextColor(...C.white);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text(sl, badgeStartX + 1 + 4, y + 4);

        // time
        pdf.setTextColor(...C.muted);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          tc.time.toFixed(3),
          MM + colW[0] + colW[1] + colW[2] + colW[3] + 2,
          y + 4,
        );

        y += rowH;
      }

      // ════════════════════════════════════════════
      // PAGE 4+ — AI ANALYSIS DETAIL
      // ════════════════════════════════════════════
      const comments = analysisResult.comments || [];
      if (comments.length > 0) {
        pdf.addPage();
        y = MM + 10;
        y = addPageTitle(pdf, tr("AI Analiz Detayi"), y);

        const sevColors: Record<string, RGB> = {
          low: C.skipped,
          medium: [234, 179, 8],
          high: C.error,
          critical: C.failed,
        };
        const sevLabels: Record<string, string> = {
          low: "Dusuk",
          medium: "Orta",
          high: "Yuksek",
          critical: "Kritik",
        };

        for (const comment of comments) {
          const analysisLines = pdf.splitTextToSize(
            tr(`Analiz: ${comment.analysis || ""}`),
            CW - 12,
          );
          const analysisH = analysisLines.length * 4.5;

          const suggestionText = tr(comment.suggestion || "").trim();
          const hasSuggestion = suggestionText.length > 0;
          const suggestionLines = hasSuggestion
            ? pdf.splitTextToSize(suggestionText, CW - 12)
            : [];
          const suggestionH = suggestionLines.length * 4.5;

          // Card height breakdown (from card top y):
          //   13mm — y+13 = analysis text start
          //   analysisH — analysis text height
          //   if hasSuggestion: 4mm gap + 4mm label→text + suggestionH
          //   4mm — bottom padding
          const cardTopOffset = 13;
          const afterAnalysisGap = 4;
          const labelToTextGap = 4;
          const bottomPad = 4;
          const suggestionExtra = hasSuggestion
            ? afterAnalysisGap + labelToTextGap + suggestionH
            : 0;
          const cardH = Math.max(
            26,
            cardTopOffset + analysisH + suggestionExtra + bottomPad,
          );

          // Page break if card doesn't fit
          if (y + cardH > CONTENT_BOTTOM) {
            pdf.addPage();
            y = MM + 10;
            y = addPageTitle(pdf, tr("AI Analiz Detayi (devam)"), y);
          }

          // card background
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(...C.border);
          pdf.roundedRect(MM, y, CW, cardH, 2, 2, "FD");

          // test name
          pdf.setTextColor(...C.heading);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(tr(comment.testName || ""), MM + 4, y + 7);

          // severity badge (top-right of card)
          const sevC: RGB = sevColors[comment.severity] || C.skipped;
          const sevL = tr(sevLabels[comment.severity] || comment.severity);
          const sevBW = pdf.getTextWidth(sevL) + 8;
          pdf.setFillColor(...sevC);
          pdf.setDrawColor(...sevC);
          pdf.roundedRect(PW - MM - sevBW - 4, y + 3, sevBW, 5, 1, 1, "F");
          pdf.setTextColor(...C.white);
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          const sevX = PW - MM - sevBW - 4 + (sevBW - pdf.getTextWidth(sevL)) / 2;
          pdf.text(sevL, sevX, y + 6.5);

          // analysis text
          pdf.setTextColor(...C.muted);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(analysisLines, MM + 4, y + 13);

          // suggestion section (only if there's content)
          if (hasSuggestion) {
            const sugLabelY = y + 13 + analysisH + 4;
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...C.muted);
            pdf.setFontSize(8);
            pdf.text(tr("Oneri:"), MM + 4, sugLabelY);
            pdf.setFont("helvetica", "normal");
            pdf.text(suggestionLines, MM + 4, sugLabelY + 4);
          }

          y += cardH + 4;
        }
      }

      // ════════════════════════════════════════════
      // PAGE 5+ — RECOMMENDATIONS
      // ════════════════════════════════════════════
      const recs = analysisResult.recommendations || [];
      if (recs.length > 0) {
        pdf.addPage();
        y = MM + 10;
        y = addPageTitle(pdf, tr("Oneriler"), y);

        for (let i = 0; i < recs.length; i++) {
          const recText = tr(recs[i] || "");
          const recLines = pdf.splitTextToSize(recText, CW - 24);
          const recH = Math.max(14, recLines.length * 4.5 + 10);

          if (y + recH > CONTENT_BOTTOM) {
            pdf.addPage();
            y = MM + 10;
            y = addPageTitle(pdf, tr("Oneriler (devam)"), y);
          }

          // box
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(...C.border);
          pdf.roundedRect(MM, y, CW, recH, 2, 2, "FD");

          // number circle
          pdf.setFillColor(...C.primary);
          pdf.setDrawColor(...C.primary);
          pdf.circle(MM + 9, y + recH / 2, 4.5, "F");
          pdf.setTextColor(...C.white);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          const numStr = String(i + 1);
          const numW = pdf.getTextWidth(numStr);
          pdf.text(numStr, MM + 9 - numW / 2, y + recH / 2 + 1.5);

          // text
          pdf.setTextColor(...C.muted);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.text(recLines, MM + 18, y + 6);

          y += recH + 4;
        }
      }

      // ════════════════════════════════════════════
      // FINAL PASS — ADD CORRECT FOOTERS TO ALL PAGES
      // ════════════════════════════════════════════
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(pdf, i, totalPages);
      }

      // ════════════════════════════════════════════
      // DOWNLOAD
      // ════════════════════════════════════════════
      const timestamp = new Date().toISOString().split("T")[0];
      const safeName = parsedData.name.replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`smartdash-raporu-${safeName}-${timestamp}.pdf`);

      addToast("PDF raporu oluşturuldu", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Rapor oluşturulamadı.",
        "error",
      );
    } finally {
      setIsExporting(false);
    }
  }, [parsedData, analysisResult, addToast]);

  if (!parsedData || !analysisResult) return null;

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {isExporting ? "Oluşturuluyor..." : "PDF Rapor"}
    </button>
  );
}
