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
  const averageScore =
    report.symbols.length === 0
      ? 0
      : Math.round(
          report.symbols.reduce((sum, item) => sum + item.analysis.score, 0) / report.symbols.length
        );
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
  const opportunityDetail = bestOpportunity
    ? buildOpportunityDetail(bestOpportunity, ranked)
    : "No opportunity signal was available for this report.";
  const riskDetail = highestRisk
    ? buildRiskDetail(highestRisk)
    : "No risk signal was available for this report.";

  return {
    overallSummary,
    bestOpportunity,
    highestRisk,
    averageScore,
    averageConfidence,
    opportunityDetail,
    riskDetail
  };
}

export function buildReportConfidenceBreakdown(report: ReportJson) {
  const requestedCount = report.metadata.requestedSymbolCount ?? report.symbols.length;
  const processedCount = report.metadata.processedSymbolCount ?? report.symbols.length;
  const failedCount = report.metadata.failedSymbols.length;
  const processedRatio = requestedCount === 0 ? 1 : processedCount / requestedCount;
  const dataQuality = clampScore(Math.round(processedRatio * 100 - failedCount * 8));

  const newsCoverage = averageSymbolScore(report.symbols, (symbol) => {
    const articleScore = Math.min(48, symbol.newsArticles.length * 12);
    const factorScore = Math.min(
      24,
      (symbol.newsSummary.positiveFactors.length + symbol.newsSummary.negativeFactors.length) * 6
    );
    const evidenceScore = Math.min(20, symbol.analysis.evidence.news.length * 5);
    const summaryScore = symbol.newsSummary.summary ? 8 : 0;

    return articleScore + factorScore + evidenceScore + summaryScore;
  });

  const technicalSignalClarity = averageSymbolScore(report.symbols, (symbol) => {
    const rsiScore = typeof symbol.technicalSummary.rsi === "number" ? 18 : 0;
    const momentumScore = typeof symbol.technicalSummary.momentumPercent === "number" ? 18 : 0;
    const movingAverageScore = symbol.marketData.ma50 || symbol.marketData.ma200 ? 24 : 0;
    const volumeScore = symbol.technicalSummary.volumeTrend || symbol.technicalSummary.latestVolume ? 16 : 0;
    const evidenceScore = Math.min(24, symbol.analysis.evidence.technical.length * 8);

    return rsiScore + momentumScore + movingAverageScore + volumeScore + evidenceScore;
  });

  const scores = report.symbols.map((symbol) => symbol.analysis.score);
  const scoreSpread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 18;
  const consensusAgreement = clampScore(Math.round(100 - scoreSpread));

  return [
    { label: "Data Quality", score: dataQuality },
    { label: "News Coverage", score: newsCoverage },
    { label: "Technical Signal Clarity", score: technicalSignalClarity },
    { label: "Consensus Agreement", score: consensusAgreement }
  ];
}

function buildOpportunityDetail(bestOpportunity: SymbolReport, ranked: SymbolReport[]) {
  const explicitOpportunity = bestOpportunity.analysis.opportunities[0]?.trim();

  if (explicitOpportunity) {
    return `${bestOpportunity.symbol}: ${explicitOpportunity}`;
  }

  const peer = ranked.find((symbol) => symbol.symbol !== bestOpportunity.symbol);
  const scoreText = `${bestOpportunity.symbol} leads the basket with an AI score of ${bestOpportunity.analysis.score}`;
  const signal = bestOpportunity.technicalSummary.signal?.toLowerCase();
  const catalyst =
    bestOpportunity.newsSummary.positiveFactors[0] ??
    bestOpportunity.analysis.summary ??
    "the strongest combined market, technical, and news profile";

  return peer
    ? `${scoreText}, ahead of ${peer.symbol}, supported by ${catalyst}${signal ? ` and a ${signal} technical setup` : ""}.`
    : `${scoreText}, supported by ${catalyst}.`;
}

function buildRiskDetail(highestRisk: SymbolReport) {
  const explicitRisk = highestRisk.analysis.risks[0]?.trim();

  if (explicitRisk) {
    return `${highestRisk.symbol}: ${explicitRisk}`;
  }

  const negativeFactor = highestRisk.newsSummary.negativeFactors[0];

  return `${highestRisk.symbol} has the weakest score in this report${
    negativeFactor ? `, with risk tied to ${negativeFactor}` : ", so monitor downside drivers and evidence quality closely"
  }.`;
}

function averageSymbolScore(symbols: SymbolReport[], getScore: (symbol: SymbolReport) => number) {
  if (symbols.length === 0) {
    return 0;
  }

  return clampScore(
    Math.round(symbols.reduce((total, symbol) => total + getScore(symbol), 0) / symbols.length)
  );
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
