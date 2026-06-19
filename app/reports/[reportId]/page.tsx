import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  FileText,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportSymbolCard } from "@/components/report-symbol-card";
import { TopOpportunitiesCard } from "@/components/top-opportunities-card";
import { Button } from "@/components/ui/button";
import { ANALYSIS_TYPE_LABELS, TIME_HORIZON_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  buildExecutiveSummary,
  sortSymbolsByScore
} from "@/lib/report-utils";
import { reportJsonSchema } from "@/lib/schemas";
import { getSymbolColor } from "@/lib/symbol-colors";

export default async function ReportDetailPage({
  params
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const dbReport = await prisma.report.findUnique({
    where: {
      id: reportId
    }
  });

  if (!dbReport) {
    notFound();
  }

  const parsedReport = reportJsonSchema.safeParse(dbReport.reportJson);

  if (!parsedReport.success) {
    notFound();
  }

  const report = parsedReport.data;
  const rankedSymbols = sortSymbolsByScore(report.symbols);
  const executiveSummary = buildExecutiveSummary(report);
  const generatedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(report.generatedAt));
  const analysisLabel =
    ANALYSIS_TYPE_LABELS[dbReport.analysisType as keyof typeof ANALYSIS_TYPE_LABELS] ??
    dbReport.analysisType;
  const timeHorizon = report.metadata.timeHorizon ?? "3m";
  const timeHorizonLabel =
    TIME_HORIZON_LABELS[timeHorizon as keyof typeof TIME_HORIZON_LABELS] ?? timeHorizon;
  const timeHorizonDisplay = formatTimeHorizonDisplay(timeHorizonLabel);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
              <Link href="/">
                <ArrowLeft size={16} />
                New report
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <FileText size={12} />
              <span>AI Investment Research Report</span>
              <span>·</span>
              <span className="font-mono">Generated {generatedDate}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Report {reportId}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {dbReport.symbols.map((symbol) => (
                <div
                  key={symbol}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5"
                >
                  <SymbolAvatar symbol={symbol} size={14} />
                  <span className="font-mono text-xs font-semibold text-foreground">{symbol}</span>
                </div>
              ))}
              <div className="rounded-md border border-primary/20 bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
                {analysisLabel}
              </div>
              <div className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {timeHorizonDisplay}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent">
                  <Brain size={11} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Executive Summary</h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {executiveSummary.overallSummary}
              </p>
              <div className="grid gap-3 pt-2 md:grid-cols-3">
                <SummaryTile
                  tone="opportunity"
                  icon={<TrendingUp size={12} />}
                  label="Opportunity"
                  value={
                    executiveSummary.bestOpportunity
                      ? `${executiveSummary.bestOpportunity.symbol} leads with an AI score of ${executiveSummary.bestOpportunity.analysis.score}.`
                      : "No opportunity symbol available."
                  }
                />
                <SummaryTile
                  tone="risk"
                  icon={<AlertTriangle size={12} />}
                  label="Risk"
                  value={
                    executiveSummary.highestRisk
                      ? `${executiveSummary.highestRisk.symbol} has the lowest score in this basket.`
                      : "No risk symbol available."
                  }
                />
                <SummaryTile
                  tone="confidence"
                  icon={<Activity size={12} />}
                  label="Confidence"
                  value={`${executiveSummary.averageConfidence}/100 average confidence`}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Symbol Analysis</h2>
              {rankedSymbols.map((item, index) => (
                <ReportSymbolCard
                  key={item.symbol}
                  symbol={item}
                  defaultExpanded={index === 0}
                />
              ))}
            </section>
          </div>

          <aside className="space-y-4">
            <TopOpportunitiesCard symbols={rankedSymbols} />

            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Report Confidence</h3>
              <ConfidenceMeter score={executiveSummary.averageConfidence} />
              <div className="space-y-2 text-xs text-muted-foreground">
                <ConfidenceRow
                  label="Processed Symbols"
                  score={report.metadata.processedSymbolCount ?? report.symbols.length}
                  max={report.metadata.requestedSymbolCount ?? report.symbols.length}
                />
                <ConfidenceRow
                  label="Average Confidence"
                  score={executiveSummary.averageConfidence}
                  max={100}
                />
                <ConfidenceRow
                  label="Failed Symbols"
                  score={report.metadata.failedSymbols.length}
                  max={Math.max(report.symbols.length, 1)}
                />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-primary/20 bg-accent p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-primary" />
                <h3 className="text-sm font-semibold text-primary">Research Disclaimer</h3>
              </div>
              <p className="text-xs leading-relaxed text-primary/75">
                {report.metadata.disclaimer}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "opportunity" | "risk" | "confidence";
}) {
  const className = {
    opportunity: "bg-emerald-50 text-emerald-700",
    risk: "bg-amber-50 text-amber-700",
    confidence: "bg-orange-50 text-orange-700"
  }[tone];

  return (
    <div className={`space-y-1 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        {icon}
        {label}
      </div>
      <p className="text-xs leading-relaxed opacity-90">{value}</p>
    </div>
  );
}

function SymbolAvatar({ symbol, size }: { symbol: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded font-display font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        backgroundColor: getSymbolColor(symbol)
      }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Average Confidence</span>
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

function ConfidenceRow({
  label,
  score,
  max
}: {
  label: string;
  score: number;
  max: number;
}) {
  const percentage = max === 0 ? 0 : Math.min(100, Math.round((score / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1">{label}</span>
      <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="progress-fill-animated h-full rounded-full bg-primary/70"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono">{score}</span>
    </div>
  );
}

function formatTimeHorizonDisplay(label: string) {
  const [amount, unit] = label.split(" ");

  if (!amount || !unit) {
    return `${label} Horizon`;
  }

  return `${amount}-${unit.replace(/s$/, "")} Horizon`;
}
