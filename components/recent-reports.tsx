"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ANALYSIS_TYPE_LABELS } from "@/lib/constants";

type RecentReport = {
  id: string;
  analysisType: string;
  symbols: string[];
  createdAt: string;
  averageScore?: number;
  topScore?: number;
};

type RecentReportsResponse = {
  reports?: RecentReport[];
  error?: string;
};

async function fetchRecentReports() {
  const response = await fetch("/api/reports");
  const body = (await response.json().catch(() => null)) as RecentReportsResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to load recent reports.");
  }

  return body?.reports ?? [];
}

export function RecentReports() {
  const query = useQuery({
    queryKey: ["recent-reports"],
    queryFn: fetchRecentReports,
    staleTime: 30_000,
    refetchInterval: 60_000
  });
  const reports = query.data ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recent Analyses</h3>
        </div>
        {query.isFetching ? (
          <Loader2 size={13} className="animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {query.error.message}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
            Generated reports will appear here.
          </div>
        ) : (
          reports.map((report) => <ReportRow key={report.id} report={report} />)
        )}
      </div>
    </div>
  );
}

function ReportRow({ report }: { report: RecentReport }) {
  const analysisLabel =
    ANALYSIS_TYPE_LABELS[report.analysisType as keyof typeof ANALYSIS_TYPE_LABELS] ??
    report.analysisType;
  const reportScore = getReportScore(report);

  return (
    <Link
      href={`/reports/${report.id}`}
      className="flex items-start justify-between gap-2 border-b border-border py-1.5 transition-colors last:border-0 hover:bg-muted/40"
    >
      <div className="min-w-0">
        <div className="font-mono text-xs font-medium text-foreground">
          {report.symbols.join(", ")}
        </div>
        <div className="truncate text-xs text-muted-foreground">{analysisLabel}</div>
        <div className="text-xs text-muted-foreground">{formatCreatedAt(report.createdAt)}</div>
      </div>
      {typeof reportScore === "number" ? (
        <ScoreBadge score={reportScore} />
      ) : null}
    </Link>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const className =
    score >= 75
      ? "border-emerald-500/20 bg-emerald-50 text-emerald-600"
      : score >= 55
        ? "border-amber-500/20 bg-amber-50 text-amber-600"
        : "border-red-500/20 bg-red-50 text-red-600";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs font-medium ${className}`}>
      {score}
    </span>
  );
}

function getReportScore(report: RecentReport) {
  return report.averageScore ?? report.topScore;
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-start justify-between gap-2 py-1.5">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
