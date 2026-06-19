import type { ReportJson, SymbolReport } from "@/lib/schemas";

export function sortSymbolsByScore(symbols: SymbolReport[]) {
  return [...symbols].sort((a, b) => b.analysis.score - a.analysis.score);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 1000 ? 0 : 2
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function buildExecutiveSummary(report: ReportJson) {
  const ranked = sortSymbolsByScore(report.symbols);
  const bestOpportunity = ranked[0];
  const highestRisk = [...report.symbols].sort((a, b) => a.analysis.score - b.analysis.score)[0];
  const averageConfidence =
    report.symbols.length === 0
      ? 0
      : Math.round(
          report.symbols.reduce((sum, item) => sum + item.analysis.confidence, 0) /
            report.symbols.length
        );

  const summaries = ranked
    .map((item) => item.analysis.summary?.trim())
    .filter(Boolean)
    .slice(0, 3);

  const overallSummary =
    summaries.length > 0
      ? summaries.join(" ")
      : "The report ranks selected symbols using AI scoring, confidence, market data, technical signals, and current news evidence.";

  return {
    overallSummary,
    bestOpportunity,
    highestRisk,
    averageConfidence
  };
}
