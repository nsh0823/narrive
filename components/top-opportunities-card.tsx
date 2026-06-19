"use client";

import { Star } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { SymbolReport } from "@/lib/schemas";
import { getSymbolColor } from "@/lib/symbol-colors";
import { getSymbolDisplayName } from "@/lib/symbol-metadata";

type RankDatum = {
  symbol: string;
  score: number;
  color: string;
};

export function TopOpportunitiesCard({ symbols }: { symbols: SymbolReport[] }) {
  const chartData: RankDatum[] = symbols.map((item) => ({
    symbol: item.symbol,
    score: item.analysis.score,
    color: getSymbolColor(item.symbol)
  }));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Star size={13} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">Top Opportunities</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
          AI Score
          <InfoTooltip label="Investment attractiveness score." />
        </div>
        {symbols.map((symbol, index) => (
          <div key={symbol.symbol} className="flex items-center gap-3">
            <span className="w-5 font-mono text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-[9px] font-bold text-white"
              style={{ backgroundColor: getSymbolColor(symbol.symbol) }}
            >
              {symbol.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-semibold text-foreground">{symbol.symbol}</div>
              <div className="truncate text-xs text-muted-foreground">
                {getSymbolDisplayName(symbol)}
              </div>
            </div>
            <ScoreBadge score={symbol.analysis.score} />
          </div>
        ))}
      </div>

      <div className="mt-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              tick={{ fontSize: 10, fill: "#374151", fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.symbol} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 75 ? "success" : score >= 55 ? "warning" : "danger";

  return (
    <Badge variant={variant} className="font-mono">
      {score}
    </Badge>
  );
}
