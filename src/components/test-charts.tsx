"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TestSuite } from "@/lib/types";

// ── Color palette (matches badge colors in page.tsx) ──
const COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  error: "#f59e0b",
  skipped: "#94a3b8",
} as const;

// ── Gradient IDs ──
const GRADIENT_IDS = {
  passed: "gradient-passed",
  failed: "gradient-failed",
  error: "gradient-error",
  skipped: "gradient-skipped",
} as const;

// ── Shared tooltip ──
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background p-3 shadow-lg backdrop-blur-sm text-xs">
      {label && (
        <p className="mb-1.5 font-semibold text-foreground border-b pb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2 font-medium" style={{ color: entry.color }}>
            <span
              className="inline-block size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
            <span className="font-bold tabular-nums">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// ── SVG Gradient definitions ──
function ChartGradients() {
  return (
    <defs>
      <linearGradient id={GRADIENT_IDS.passed} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.failed} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f87171" />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.error} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.skipped} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
  );
}

// ── Custom Pie sector shape with active state (hover push-out) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieSectorShape(props: any) {
  const cx = Number(props.cx) || 0;
  const cy = Number(props.cy) || 0;
  const innerRadius = Number(props.innerRadius) || 0;
  const outerRadius = Number(props.outerRadius) || 0;
  const startAngle = Number(props.startAngle) || 0;
  const endAngle = Number(props.endAngle) || 0;
  const fill = String(props.fill ?? "");
  const isActive = props.isActive as boolean;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={isActive ? outerRadius + 5 : outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

// ── 1. PieChart — "Glow Donut" Test Sonuçları ──
export function PieChartResults({
  passedCount,
  failedCount,
  errorCount,
  skippedCount,
}: {
  passedCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}) {
  const total = passedCount + failedCount + errorCount + skippedCount;
  const passPercent = total > 0 ? (passedCount / total) * 100 : 0;

  const data = [
    { name: "Geçen", value: passedCount, colorKey: GRADIENT_IDS.passed, solid: COLORS.passed },
    { name: "Başarısız", value: failedCount, colorKey: GRADIENT_IDS.failed, solid: COLORS.failed },
    { name: "Hata", value: errorCount, colorKey: GRADIENT_IDS.error, solid: COLORS.error },
    { name: "Atlandı", value: skippedCount, colorKey: GRADIENT_IDS.skipped, solid: COLORS.skipped },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  const centerR = 62.5; // average of inner/outer radius
  const trackThickness = 35; // outerRadius - innerRadius = 80 - 45

  return (
    <div className="flex flex-row items-center gap-3 sm:gap-6">
      {/* Donut Chart */}
      <div className="shrink-0 w-[60%] max-w-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <ChartGradients />

            {/* Background donut track */}
            <circle
              cx="50%"
              cy="50%"
              r={centerR}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={trackThickness}
            />

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              paddingAngle={4}
              shape={<PieSectorShape />}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={`pie-cell-${idx}`}
                  fill={`url(#${entry.colorKey})`}
              stroke="var(--background)"
              strokeWidth={2}
            />
          ))}
        </Pie>

        {/* Center text — pass percentage */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--foreground)"
          fontSize={32}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          className="tabular-nums"
        >
          {passPercent.toFixed(0)}%
        </text>
        <text
          x="50%"
          y="50%"
          dy={22}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--muted-foreground)"
          fontSize={11}
          fontWeight={500}
          fontFamily="var(--font-sans)"
        >
          Geçme Oranı
        </text>

            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-col gap-2.5 min-w-0">
        {data.map((entry, idx) => {
          const pct = total > 0 ? (entry.value / total) * 100 : 0;
          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm leading-tight"
            >
              <span
                className="inline-block size-2.5 rounded-full shrink-0 ring-1 ring-border/30"
                style={{ backgroundColor: entry.solid }}
              />
              <span className="text-foreground font-medium truncate">
                {entry.name}
              </span>
              <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                {entry.value}
              </span>
              <span className="text-muted-foreground/60 tabular-nums whitespace-nowrap">
                (%{pct.toFixed(0)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. BarChart — Hata Türü Dağılımı ──
export function ErrorBarChart({
  failedCount,
  errorCount,
  skippedCount,
}: {
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}) {
  const data = [
    { name: "Başarısız", value: failedCount, fill: COLORS.failed },
    { name: "Hata", value: errorCount, fill: COLORS.error },
    { name: "Atlandı", value: skippedCount, fill: COLORS.skipped },
  ];

  if (data.every((d) => d.value === 0)) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          fontSize={12}
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <YAxis
          fontSize={12}
          allowDecimals={false}
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Adet" radius={[8, 8, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={`bar-cell-${idx}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 3. HorizontalBarChart — "Gradient Speed Bars" Test Süreleri ──
function getTimeColor(time: number): string {
  if (time <= 1) return "#22c55e";
  if (time <= 5) return "#f59e0b";
  return "#ef4444";
}

function DurationYAxisTick({
  x,
  y,
  payload,
  displayData,
}: {
  x: number;
  y: number;
  payload: { value: string };
  displayData: Array<{ name: string; index: number }>;
}) {
  const item = displayData.find((d) => d.name === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        fill="var(--muted-foreground)"
        fontSize={11}
        textAnchor="end"
      >
        <tspan fill="var(--muted-foreground)" opacity={0.5}>
          #{item?.index}
        </tspan>
        <tspan dx={4} fontWeight={600} fill="var(--foreground)">
          {payload.value}
        </tspan>
      </text>
    </g>
  );
}

function DurationYAxisTickWrapper({ displayData }: { displayData: Array<{ name: string; index: number }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TickComponent = (props: any) => (
    <DurationYAxisTick
      x={Number(props.x)}
      y={Number(props.y)}
      payload={{ value: String(props.payload?.value ?? "") }}
      displayData={displayData}
    />
  );
  TickComponent.displayName = "DurationYAxisTickCustom";
  return TickComponent;
}

function DurationBarLabel({
  x = 0,
  y = 0,
  width = 0,
  value = 0,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  return (
    <text
      x={x + width + 6}
      y={y + 14}
      fill="var(--muted-foreground)"
      fontSize={12}
      textAnchor="start"
      className="tabular-nums"
    >
      {typeof value === "number" ? `${value.toFixed(2)}sn` : ""}
    </text>
  );
}

export function DurationChart({
  testCases,
}: {
  testCases: TestSuite["testCases"];
}) {
  if (testCases.length === 0) return null;

  const displayData = [...testCases]
    .sort((a, b) => b.time - a.time)
    .slice(0, 10)
    .map((tc, i) => ({
      name: tc.name.length > 28 ? tc.name.substring(0, 28) + "…" : tc.name,
      süre: tc.time,
      index: i + 1,
    }))
    .reverse();

  const hasMore = testCases.length > 10;

  return (
    <div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, displayData.length * 36)}
      >
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ left: 24, right: 60, top: 5, bottom: 30 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            fontSize={12}
            tick={{ fill: "var(--muted-foreground)" }}
            label={{
              value: "süre (sn)",
              position: "bottom",
              offset: -2,
              style: { fontSize: 12, fill: "var(--muted-foreground)" },
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            fontSize={11}
            tick={DurationYAxisTickWrapper({ displayData })}
            width={180}
            interval={0}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey="süre"
            name="Süre"
            radius={[0, 6, 6, 0]}
            label={<DurationBarLabel />}
          >
            {displayData.map((entry, idx) => (
              <Cell
                key={`bar-cell-${idx}`}
                fill={getTimeColor(entry.süre)}
                className="duration-bar-cell"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasMore && (
        <p className="mt-1 text-xs text-center text-muted-foreground">
          … ve {testCases.length - 10} test daha
        </p>
      )}
      <style>{`
        .duration-bar-cell:hover {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          transition: filter 0.2s ease;
        }
      `}</style>
    </div>
  );
}
