import { SYMBOLS } from "@/lib/constants";

const FALLBACK_SYMBOL_COLORS = [
  "#f97316",
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#0891b2",
  "#475569",
  "#d97706"
];

export function getSymbolColor(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  const knownSymbol = SYMBOLS.find((item) => item.symbol === normalizedSymbol);

  if (knownSymbol) {
    return knownSymbol.color;
  }

  const hash = normalizedSymbol
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return FALLBACK_SYMBOL_COLORS[hash % FALLBACK_SYMBOL_COLORS.length];
}
