"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SymbolSearchResult } from "@/lib/symbol-search";

type TrendingTickersResponse = {
  results?: SymbolSearchResult[];
  error?: string;
};

async function fetchTrendingTickers() {
  const response = await fetch("/api/trending-tickers?region=US");
  const body = (await response.json().catch(() => null)) as TrendingTickersResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to load trending tickers.");
  }

  return body?.results ?? [];
}

export function MarketSnapshot() {
  const query = useQuery({
    queryKey: ["trending-tickers", "US"],
    queryFn: fetchTrendingTickers,
    refetchInterval: 60_000 * 10,
    staleTime: 45_000
  });
  const tickers = query.data ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market Snapshot</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Trending tickers</p>
        </div>
        <div className="flex items-center gap-2">
          {query.isFetching ? (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          ) : (
            <span className="font-mono text-xs text-emerald-600">Live</span>
          )}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Refresh trending tickers"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs leading-relaxed text-red-700">{query.error.message}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 bg-white text-xs"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : tickers.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            No trending tickers returned.
          </div>
        ) : (
          tickers.map((item) => (
            <TickerRow key={item.symbol} ticker={item} />
          ))
        )}
      </div>
    </div>
  );
}

function TickerRow({ ticker }: { ticker: SymbolSearchResult }) {
  const changePercent = ticker.changePercent;

  return (
    <div className="group flex items-center justify-between py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <SymbolAvatar color={colorForSymbol(ticker.symbol)} symbol={ticker.symbol} />
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-foreground">{ticker.symbol}</div>
          <div className="max-w-32 truncate text-xs text-muted-foreground">
            {ticker.exchange ?? ticker.type}
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-xs text-foreground">{formatPrice(ticker)}</div>
        {typeof changePercent === "number" ? (
          <div
            className={
              changePercent >= 0
                ? "flex items-center justify-end gap-0.5 font-mono text-xs text-emerald-600"
                : "flex items-center justify-end gap-0.5 font-mono text-xs text-red-500"
            }
          >
            {changePercent >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
            {Math.abs(changePercent).toFixed(2)}%
          </div>
        ) : (
          <div className="font-mono text-xs text-muted-foreground">--</div>
        )}
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-lg bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function SymbolAvatar({ color, symbol }: { color: string; symbol: string }) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-display text-[8px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

function formatPrice(ticker: SymbolSearchResult) {
  if (typeof ticker.price !== "number") {
    return ticker.currency ?? "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ticker.currency ?? "USD",
    maximumFractionDigits: ticker.price > 1000 ? 0 : 2
  }).format(ticker.price);
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
