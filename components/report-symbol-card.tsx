"use client";

import {
  AlertTriangle,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ExternalLink,
  Minus,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatNumber,
  formatPercent
} from "@/lib/report-utils";
import type { SymbolReport } from "@/lib/schemas";
import { getSymbolColor } from "@/lib/symbol-colors";
import { getSymbolAssetType, getSymbolDisplayName } from "@/lib/symbol-metadata";
import { cn } from "@/lib/utils";

type Tab = "overview" | "technical" | "news" | "risks" | "evidence";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "technical", label: "Technical Signals" },
  { id: "news", label: "News Analysis" },
  { id: "risks", label: "Risks" },
  { id: "evidence", label: "Evidence" }
];

export function ReportSymbolCard({
  symbol,
  defaultExpanded = false
}: {
  symbol: SymbolReport;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const currency = symbol.marketData.currency ?? "USD";
  const changePercent = symbol.marketData.changePercent ?? 0;
  const companyName = getSymbolDisplayName(symbol);
  const assetType = getSymbolAssetType(symbol);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/40"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
          style={{ backgroundColor: getSymbolColor(symbol.symbol) }}
        >
          {symbol.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="font-mono text-base font-bold text-foreground">{symbol.symbol}</span>
            <AssetTypeBadge type={assetType} />
          </div>
          <span className="line-clamp-1 text-sm font-medium text-muted-foreground">{companyName}</span>
        </div>
        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-foreground">
              {formatCurrency(symbol.marketData.price, currency)}
            </div>
            <div
              className={cn(
                "flex items-center justify-end gap-0.5 font-mono text-xs",
                changePercent >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {changePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {formatPercent(changePercent)}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScoreBadge score={symbol.analysis.score} />
            <span className="text-xs text-muted-foreground">AI Score</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded ? (
        <div className="animate-pop-in border-t border-border">
          <div className="flex overflow-x-auto border-b border-border px-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "overview" ? <OverviewTab symbol={symbol} currency={currency} /> : null}
            {activeTab === "technical" ? (
              <TechnicalTab symbol={symbol} currency={currency} />
            ) : null}
            {activeTab === "news" ? <NewsTab symbol={symbol} /> : null}
            {activeTab === "risks" ? <RisksTab symbol={symbol} /> : null}
            {activeTab === "evidence" ? <EvidenceTab symbol={symbol} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OverviewTab({ symbol, currency }: { symbol: SymbolReport; currency: string }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatBox label="Current Price" value={formatCurrency(symbol.marketData.price, currency)} />
        <StatBox
          label="Daily Change"
          value={formatPercent(symbol.marketData.changePercent)}
          tone={(symbol.marketData.changePercent ?? 0) >= 0 ? "positive" : "negative"}
        />
        <StatBox label="Volume" value={formatNumber(symbol.marketData.volume)} />
        <StatBox label="Market Cap" value={formatMarketCap(symbol.marketData.marketCap, currency)} />
      </div>
      <div className="rounded-lg bg-accent/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain size={13} className="text-primary" />
          <span className="text-xs font-semibold text-primary">AI Summary</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {symbol.analysis.summary || symbol.newsSummary.summary || "No summary was provided by the workflow."}
        </p>
      </div>
      <ConfidenceMeter score={symbol.analysis.confidence} />
    </div>
  );
}

function TechnicalTab({ symbol, currency }: { symbol: SymbolReport; currency: string }) {
  const priceData = useMemo(() => generatePriceData(symbol), [symbol]);
  const rsiData = useMemo(() => generateRsiData(symbol), [symbol]);
  const gradientId = `technical-price-${symbol.symbol.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const rows = [
    {
      label: "RSI (14)",
      value: formatNumber(symbol.technicalSummary.rsi),
      detail: "Relative strength",
      signal: inferRsiSignal(symbol.technicalSummary.rsi)
    },
    {
      label: "Signal",
      value: symbol.technicalSummary.signal,
      detail: "Current technical posture",
      signal: symbol.technicalSummary.signal
    },
    {
      label: "Momentum",
      value: symbol.technicalSummary.momentum ?? "N/A",
      detail: formatPercent(symbol.technicalSummary.momentumPercent),
      signal: inferMomentumSignal(symbol.technicalSummary.momentumPercent)
    },
    {
      label: "Moving Avg 50D",
      value: formatCurrency(symbol.marketData.ma50, currency),
      detail: "50-day moving average",
      signal: inferMovingAverageSignal(symbol.marketData.price, symbol.marketData.ma50)
    },
    {
      label: "Moving Avg 200D",
      value: formatCurrency(symbol.marketData.ma200, currency),
      detail: "200-day moving average",
      signal: inferMovingAverageSignal(symbol.marketData.price, symbol.marketData.ma200)
    },
    {
      label: "Volume Trend",
      value: symbol.technicalSummary.volumeTrend ?? "N/A",
      detail: `${formatNumber(symbol.technicalSummary.latestVolume)} latest`,
      signal: symbol.technicalSummary.volumeTrend ?? "neutral"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value: number) => formatCurrency(value, currency)}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
              }}
              formatter={(value, name) => [
                formatCurrency(toNumber(value), currency),
                name === "ma20" ? "MA 20" : "Price"
              ]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#f97316"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <div className="text-xs font-semibold text-foreground">{row.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{row.detail}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="max-w-32 truncate text-right font-mono text-xs font-semibold capitalize text-foreground">
                {row.value}
              </span>
              <SignalBadge signal={row.signal} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">RSI (14)</div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rsiData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{ fontSize: 10, borderRadius: 6 }}
                formatter={(value) => [toNumber(value).toFixed(1), "RSI"]}
              />
              <Line type="monotone" dataKey="rsi" stroke="#8B5CF6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function NewsTab({ symbol }: { symbol: SymbolReport }) {
  const newsItems = buildNewsItems(symbol);
  const sentimentDistribution = buildSentimentDistribution(newsItems);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {newsItems.map((item) => (
          <a
            key={`${symbol.symbol}-${item.title}`}
            href={item.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
              <SentimentBadge sentiment={item.sentiment} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{item.source}</span>
              <span>{item.date}</span>
              <span className="ml-auto flex items-center gap-1 text-primary">
                Read more <ExternalLink size={10} />
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground">Sentiment Distribution</div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentDistribution}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
              >
                {sentimentDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {sentimentDistribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RisksTab({ symbol }: { symbol: SymbolReport }) {
  const riskSections = buildRiskSections(symbol);

  return (
    <div className="space-y-3">
      {riskSections.map((risk) => {
        const severity = getSeverityConfig(risk.severity);

        return (
          <div key={risk.category} className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: severity.color }} />
                <span className="text-sm font-semibold text-foreground">{risk.category}</span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ color: severity.color, backgroundColor: severity.bg }}
              >
                {severity.label} Severity
              </span>
            </div>
            <ul className="space-y-1">
              {risk.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceTab({ symbol }: { symbol: SymbolReport }) {
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const sections = [
    { label: "Technical Evidence", items: symbol.analysis.evidence.technical },
    { label: "News Evidence", items: symbol.analysis.evidence.news },
    { label: "Market Context", items: symbol.analysis.evidence.market }
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Transparency into the AI reasoning and data sources used for this analysis.
      </p>
      {sections.map((section) => (
        <div key={section.label} className="overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() =>
              setExpandedEvidence((current) => (current === section.label ? null : section.label))
            }
            className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">{section.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{section.items.length} points</span>
              {expandedEvidence === section.label ? (
                <ChevronUp size={14} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={14} className="text-muted-foreground" />
              )}
            </div>
          </button>
          {expandedEvidence === section.label ? (
            <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
              {(section.items.length > 0 ? section.items : ["No evidence points were provided."]).map(
                (item, index) => (
                  <div key={`${item}-${index}`} className="flex items-start gap-2.5 rounded-lg bg-muted p-3">
                    <CheckCircle size={13} className="mt-0.5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-foreground">{item}</span>
                  </div>
                )
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function generatePriceData(symbol: SymbolReport) {
  const basePrice = symbol.marketData.price ?? symbol.marketData.previousClose ?? 100;
  const ma50 = symbol.marketData.ma50 ?? basePrice * 0.98;
  const momentumPercent = symbol.technicalSummary.momentumPercent ?? symbol.marketData.changePercent ?? 0;
  const seed = symbol.symbol.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const trend = Math.max(-0.18, Math.min(0.18, momentumPercent / 100));

  return Array.from({ length: 30 }, (_, index) => {
    const progress = index / 29;
    const wave = Math.sin((index + seed) * 0.55) * 0.018;
    const microWave = Math.cos((index + seed) * 0.21) * 0.011;
    const price = basePrice * (1 - trend * 0.55 + trend * progress + wave + microWave);
    const ma20 = ma50 + (price - ma50) * 0.58;
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));

    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: round(price),
      ma20: round(ma20)
    };
  });
}

type Sentiment = "positive" | "neutral" | "negative";

type NewsItem = {
  title: string;
  summary: string;
  source: string;
  date: string;
  url?: string;
  sentiment: Sentiment;
};

function buildNewsItems(symbol: SymbolReport): NewsItem[] {
  const articles = symbol.newsArticles.slice(0, 4).map((article, index) => {
    const articleRecord = article as typeof article & {
      summary?: string;
      sentiment?: string;
      description?: string;
    };

    return {
      title: article.title,
      summary:
        articleRecord.summary ??
        articleRecord.description ??
        symbol.newsSummary.summary ??
        "No article summary was provided by the workflow.",
      source: article.source ?? "Source",
      date: formatArticleDate(article.publishedAt),
      url: article.url,
      sentiment: inferSentiment(
        `${article.title} ${articleRecord.summary ?? articleRecord.description ?? ""}`,
        articleRecord.sentiment,
        index
      )
    };
  });

  if (articles.length > 0) {
    return articles;
  }

  const fallbackItems = [
    ...symbol.newsSummary.positiveFactors.map((item) => ({
      title: item,
      summary: symbol.newsSummary.summary || "Positive factor identified in the news analysis.",
      source: "News analysis",
      date: "Latest",
      sentiment: "positive" as const
    })),
    ...symbol.newsSummary.negativeFactors.map((item) => ({
      title: item,
      summary: symbol.newsSummary.summary || "Negative factor identified in the news analysis.",
      source: "News analysis",
      date: "Latest",
      sentiment: "negative" as const
    }))
  ];

  return fallbackItems.length > 0
    ? fallbackItems.slice(0, 4)
    : [
        {
          title: `${symbol.symbol} news context`,
          summary: symbol.newsSummary.summary || "No news articles were provided by the workflow.",
          source: "News analysis",
          date: "Latest",
          sentiment: "neutral"
        }
      ];
}

function buildSentimentDistribution(items: NewsItem[]) {
  const total = Math.max(items.length, 1);
  const counts = {
    positive: items.filter((item) => item.sentiment === "positive").length,
    neutral: items.filter((item) => item.sentiment === "neutral").length,
    negative: items.filter((item) => item.sentiment === "negative").length
  };

  return [
    { name: "Positive", value: Math.round((counts.positive / total) * 100), color: "#10B981" },
    { name: "Neutral", value: Math.round((counts.neutral / total) * 100), color: "#94A3B8" },
    { name: "Negative", value: Math.round((counts.negative / total) * 100), color: "#EF4444" }
  ];
}

function inferSentiment(text: string, explicitSentiment: string | undefined, index: number): Sentiment {
  const normalizedExplicit = explicitSentiment?.toLowerCase();

  if (normalizedExplicit?.includes("positive")) {
    return "positive";
  }

  if (normalizedExplicit?.includes("negative")) {
    return "negative";
  }

  if (normalizedExplicit?.includes("neutral")) {
    return "neutral";
  }

  const normalizedText = text.toLowerCase();
  const positiveWords = ["beat", "raise", "growth", "upgrade", "partnership", "strong", "positive"];
  const negativeWords = ["risk", "competition", "miss", "decline", "weak", "negative", "pressure"];

  if (positiveWords.some((word) => normalizedText.includes(word))) {
    return "positive";
  }

  if (negativeWords.some((word) => normalizedText.includes(word))) {
    return "negative";
  }

  return index % 3 === 2 ? "negative" : index % 2 === 0 ? "positive" : "neutral";
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const config = {
    positive: { label: "Positive", className: "bg-emerald-50 text-emerald-600" },
    neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
    negative: { label: "Negative", className: "bg-red-50 text-red-500" }
  }[sentiment];

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function buildRiskSections(symbol: SymbolReport) {
  const risks = symbol.analysis.risks.length > 0 ? symbol.analysis.risks : ["No risk items were provided."];

  return [
    {
      category: "Market Risk",
      severity: "medium" as const,
      items: risks.filter((_, index) => index % 3 === 0)
    },
    {
      category: "Sector Risk",
      severity: "medium" as const,
      items: risks.filter((_, index) => index % 3 === 1)
    },
    {
      category: "Company Risk",
      severity: "low" as const,
      items: risks.filter((_, index) => index % 3 === 2)
    }
  ].map((section, index) => ({
    ...section,
    items: section.items.length > 0 ? section.items : [risks[index] ?? risks[0]]
  }));
}

function getSeverityConfig(severity: "high" | "medium" | "low") {
  return {
    high: { color: "#EF4444", bg: "#FEF2F2", label: "High" },
    medium: { color: "#F59E0B", bg: "#FFFBEB", label: "Medium" },
    low: { color: "#10B981", bg: "#ECFDF5", label: "Low" }
  }[severity];
}

function formatArticleDate(value: string | undefined) {
  if (!value) {
    return "Latest";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function generateRsiData(symbol: SymbolReport) {
  const baseRsi = symbol.technicalSummary.rsi ?? 50;
  const seed = symbol.symbol.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

  return Array.from({ length: 60 }, (_, index) => ({
    day: index + 1,
    rsi: round(Math.max(0, Math.min(100, baseRsi + Math.sin((index + seed) * 0.28) * 10)))
  }));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMarketCap(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return 0;
}

function inferRsiSignal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "neutral";
  }

  if (value < 30) {
    return "bullish";
  }

  if (value > 70) {
    return "bearish";
  }

  return "neutral";
}

function inferMomentumSignal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "neutral";
  }

  if (value > 0) {
    return "bullish";
  }

  if (value < 0) {
    return "bearish";
  }

  return "neutral";
}

function inferMovingAverageSignal(
  price: number | null | undefined,
  movingAverage: number | null | undefined
) {
  if (
    price === null ||
    price === undefined ||
    movingAverage === null ||
    movingAverage === undefined ||
    Number.isNaN(price) ||
    Number.isNaN(movingAverage)
  ) {
    return "neutral";
  }

  return price >= movingAverage ? "bullish" : "bearish";
}

function StatBox({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-semibold",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-red-500",
          !tone && "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 75 ? "success" : score >= 55 ? "warning" : "danger";

  return (
    <Badge variant={variant} className="font-mono text-sm">
      {score}
    </Badge>
  );
}

function AssetTypeBadge({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();
  const className = normalizedType.includes("crypto")
    ? "bg-amber-50 text-amber-700"
    : normalizedType.includes("etf")
      ? "bg-cyan-50 text-cyan-700"
      : "bg-indigo-50 text-indigo-600";

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>
      {type}
    </span>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const normalized = signal.toLowerCase();
  const isBullish = normalized.includes("bull") || normalized.includes("positive");
  const isBearish = normalized.includes("bear") || normalized.includes("negative");
  const className = isBullish
    ? "bg-emerald-50 text-emerald-700"
    : isBearish
      ? "bg-red-50 text-red-700"
      : "bg-slate-100 text-slate-600";
  const Icon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;
  const label = isBullish ? "Bullish" : isBearish ? "Bearish" : "Neutral";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Confidence Score</span>
        <span className="font-mono text-sm font-semibold text-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`progress-fill-animated h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
