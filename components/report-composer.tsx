"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  Search,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarEvents } from "@/components/calendar-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ANALYSIS_TYPES, GENERATION_STEPS, SYMBOLS, TIME_HORIZONS } from "@/lib/constants";
import type { AnalysisType, CreateReportRequest } from "@/lib/schemas";
import type { SymbolSearchResult } from "@/lib/symbol-search";
import { cn } from "@/lib/utils";

type CreateReportResponse = {
  reportId: string;
};

type SelectableSymbol = SymbolSearchResult & {
  color: string;
};

async function createReport(payload: CreateReportRequest): Promise<CreateReportResponse> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json().catch(() => null)) as
    | { error?: string; reportId?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to generate report.");
  }

  if (!body?.reportId) {
    throw new Error("Report response did not include an id.");
  }

  return { reportId: body.reportId };
}

async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  const params = new URLSearchParams({
    query,
    region: "US"
  });
  const response = await fetch(`/api/symbol-search?${params.toString()}`);
  const body = (await response.json().catch(() => null)) as
    | { error?: string; results?: SymbolSearchResult[] }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to search symbols.");
  }

  return body?.results ?? [];
}

export function ReportComposer() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<SelectableSymbol[]>([]);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("short_term");
  const [timeHorizon, setTimeHorizon] = useState<(typeof TIME_HORIZONS)[number]["value"]>("3m");
  const selectedSymbols = selectedAssets.map((item) => item.symbol);
  const trimmedQuery = query.trim();
  const waitingForDebouncedSearch = trimmedQuery.length >= 2 && debouncedQuery !== trimmedQuery;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const symbolSearchQuery = useQuery({
    queryKey: ["symbol-search", debouncedQuery],
    queryFn: () => searchSymbols(debouncedQuery),
    enabled: showDropdown && debouncedQuery.length >= 2,
    staleTime: 60_000
  });
  const isSearchingSymbols = symbolSearchQuery.isFetching || waitingForDebouncedSearch;

  const fallbackSymbols = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return SYMBOLS.filter((item) => {
      if (selectedSymbols.includes(item.symbol)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        item.symbol.toLowerCase().includes(normalizedQuery) ||
        item.name.toLowerCase().includes(normalizedQuery)
      );
    })
      .slice(0, 6)
      .map(toSelectableSymbol);
  }, [query, selectedSymbols]);

  const dropdownSymbols = useMemo(() => {
    if (debouncedQuery.length < 2) {
      return fallbackSymbols;
    }

    return (symbolSearchQuery.data ?? [])
      .filter((item) => !selectedSymbols.includes(item.symbol))
      .slice(0, 8)
      .map(toSelectableSymbol);
  }, [debouncedQuery.length, fallbackSymbols, selectedSymbols, symbolSearchQuery.data]);

  const mutation = useMutation({
    mutationFn: createReport,
    onSuccess: ({ reportId }) => {
      router.push(`/reports/${reportId}`);
    }
  });

  function addSymbol(asset: SelectableSymbol) {
    setSelectedAssets((current) => {
      if (current.some((item) => item.symbol === asset.symbol)) {
        return current;
      }

      return [...current, asset];
    });
    setQuery("");
    setDebouncedQuery("");
    setShowDropdown(false);
  }

  function removeSymbol(symbol: string) {
    setSelectedAssets((current) => current.filter((item) => item.symbol !== symbol));
  }

  function handleGenerate() {
    mutation.mutate({
      reportId: crypto.randomUUID(),
      symbols: selectedSymbols,
      analysisType,
      timeHorizon,
      symbolMetadata: selectedAssets.map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type
      }))
    });
  }

  if (mutation.isPending) {
    return <GeneratingPanel selectedSymbols={selectedSymbols} />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Select Symbols</h2>
          <span className="text-xs text-muted-foreground">{selectedSymbols.length} selected</span>
        </div>

        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search stocks or ETFs..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-border hover:text-foreground"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          {showDropdown &&
          (dropdownSymbols.length > 0 ||
            symbolSearchQuery.isFetching ||
            symbolSearchQuery.isError ||
            query.trim().length === 1) ? (
            <div className="animate-pop-in absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="max-h-56 overflow-y-auto">
                {isSearchingSymbols ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    Searching Yahoo Finance...
                  </div>
                ) : null}
                {symbolSearchQuery.isError ? (
                  <div className="px-4 py-3 text-sm text-red-600">
                    {symbolSearchQuery.error.message}
                  </div>
                ) : null}
                {!isSearchingSymbols && !symbolSearchQuery.isError && query.trim().length === 1 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Type at least 2 characters to search Yahoo Finance.
                  </div>
                ) : null}
                {!isSearchingSymbols &&
                !symbolSearchQuery.isError &&
                query.trim().length >= 2 &&
                dropdownSymbols.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No symbols found.
                  </div>
                ) : null}
                {dropdownSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => addSymbol(item)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <SymbolAvatar color={item.color} symbol={item.symbol} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {item.symbol}
                        </span>
                        <TypeBadge type={item.type} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{item.name}</span>
                    </span>
                    <span className="text-right font-mono text-xs text-foreground">
                      {formatSymbolMeta(item)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {selectedAssets.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedAssets.map((item) => (
              <span
                key={item.symbol}
                className="animate-scale-in flex items-center gap-2 rounded-lg border border-border bg-muted py-1 pl-2 pr-1.5"
              >
                <SymbolAvatar color={item.color} symbol={item.symbol} size={18} />
                <span className="font-mono text-sm font-semibold text-foreground">{item.symbol}</span>
                {typeof item.changePercent === "number" ? (
                  <span
                    className={
                      item.changePercent >= 0
                        ? "font-mono text-xs text-emerald-600"
                        : "font-mono text-xs text-red-500"
                    }
                  >
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="max-w-16 truncate text-xs text-muted-foreground">
                    {item.exchange ?? item.type}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeSymbol(item.symbol)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                  aria-label={`Remove ${item.symbol}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Research Configuration</h2>

        <div className="space-y-3">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Analysis Type
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ANALYSIS_TYPES.map(({ value, label, icon: Icon }) => {
              const isActive = analysisType === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnalysisType(value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm font-medium transition-all",
                    isActive
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Time Horizon
          </label>
          <div className="flex gap-2">
            {TIME_HORIZONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTimeHorizon(item.value)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                  timeHorizon === item.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {mutation.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {mutation.error.message}
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="h-[52px] w-full rounded-xl text-sm font-semibold active:scale-[0.99]"
        onClick={handleGenerate}
        disabled={selectedSymbols.length === 0}
      >
        <Brain size={15} />
        Generate Research Report
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}

function GeneratingPanel({ selectedSymbols }: { selectedSymbols: string[] }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setElapsed((current) => current + 125), 125);
    return () => window.clearInterval(interval);
  }, []);

  const progress = Math.min(96, Math.round((elapsed / 16_000) * 100));
  const activeStep = Math.min(
    GENERATION_STEPS.length - 1,
    Math.floor((progress / 100) * GENERATION_STEPS.length)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Brain size={22} />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Generating Research Report</h2>
          <p className="text-sm text-muted-foreground">
            Analyzing {selectedSymbols.join(", ")} using multi-source intelligence
          </p>
        </div>

        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="mt-6 space-y-3">
          {GENERATION_STEPS.map((step, index) => {
            const Icon = step.icon;
            const done = activeStep > index;
            const active = activeStep === index;

            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 transition-colors",
                  done ? "bg-emerald-50" : active ? "bg-accent" : "bg-background"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted"
                  )}
                >
                  {done ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : active ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <Icon size={13} className="text-muted-foreground" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    done ? "text-emerald-700" : active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {done ? (
                  <span className="ml-auto text-xs font-medium text-emerald-600">Complete</span>
                ) : null}
                {active ? (
                  <span className="ml-auto text-xs font-medium text-primary">In progress...</span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>Waiting for the n8n workflow response</span>
        </div>
      </section>

      <CalendarEvents />
    </div>
  );
}

function SymbolAvatar({
  color,
  symbol,
  size
}: {
  color: string;
  symbol: string;
  size: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg font-display font-bold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.32 }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

function toSelectableSymbol(symbol: SymbolSearchResult): SelectableSymbol {
  return {
    ...symbol,
    symbol: symbol.symbol.toUpperCase(),
    color: "color" in symbol && typeof symbol.color === "string" ? symbol.color : colorForSymbol(symbol.symbol)
  };
}

function colorForSymbol(symbol: string) {
  const palette = [
    "#f97316",
    "#2563eb",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#0891b2",
    "#475569",
    "#d97706"
  ];
  const hash = symbol.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

  return palette[hash % palette.length];
}

function formatSymbolMeta(symbol: SelectableSymbol) {
  if (typeof symbol.price === "number") {
    const currency = symbol.currency ?? "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: symbol.price > 1000 ? 0 : 2
    }).format(symbol.price);
  }

  return symbol.exchange ?? symbol.type;
}

function TypeBadge({ type }: { type: string }) {
  const className =
    type.toUpperCase() === "ETF"
      ? "bg-cyan-50 text-cyan-700"
      : "bg-orange-50 text-orange-700";

  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>{type}</span>;
}
