import { SYMBOLS } from "@/lib/constants";
import type { SymbolReport } from "@/lib/schemas";

type UnknownRecord = Record<string, unknown>;

const CRYPTO_SYMBOLS = new Set([
  "BTC",
  "BTC-USD",
  "ETH",
  "ETH-USD",
  "SOL",
  "SOL-USD",
  "XRP",
  "XRP-USD",
  "DOGE",
  "DOGE-USD"
]);

export function getSymbolDisplayName(symbolReport: SymbolReport) {
  const symbol = symbolReport.symbol.toUpperCase();
  const knownSymbol = SYMBOLS.find((item) => item.symbol === symbol);

  return (
    readString(symbolReport, ["name", "companyName", "shortName", "longName", "displayName"]) ??
    readString(symbolReport.marketData, ["name", "companyName", "shortName", "longName", "displayName"]) ??
    knownSymbol?.name ??
    symbolReport.symbol
  );
}

export function getSymbolAssetType(symbolReport: SymbolReport) {
  const symbol = symbolReport.symbol.toUpperCase();
  const knownSymbol = SYMBOLS.find((item) => item.symbol === symbol);
  const rawType =
    readString(symbolReport, ["type", "assetType", "quoteType", "securityType"]) ??
    readString(symbolReport.marketData, ["type", "assetType", "quoteType", "securityType"]) ??
    knownSymbol?.type;

  return normalizeAssetType(symbol, rawType);
}

function normalizeAssetType(symbol: string, rawType: string | undefined) {
  const normalizedType = rawType?.trim().toUpperCase();

  if (normalizedType?.includes("ETF")) {
    return "ETF";
  }

  if (
    normalizedType?.includes("CRYPTO") ||
    normalizedType?.includes("CURRENCY") ||
    CRYPTO_SYMBOLS.has(symbol)
  ) {
    return "Crypto";
  }

  if (
    normalizedType?.includes("EQUITY") ||
    normalizedType?.includes("STOCK") ||
    normalizedType?.includes("SHARE")
  ) {
    return "Stock";
  }

  return "Stock";
}

function readString(value: unknown, keys: string[]) {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const rawValue = value[key];

    if (typeof rawValue === "string" && rawValue.trim()) {
      return rawValue.trim();
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
