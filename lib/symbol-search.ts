import { z } from "zod";

export const symbolSearchQuerySchema = z.object({
  query: z.string().trim().min(1).max(80),
  region: z.string().trim().min(2).max(8).default("US")
});

export const symbolSearchResultSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
  exchange: z.string().optional(),
  region: z.string().optional(),
  currency: z.string().optional(),
  price: z.number().nullable().optional(),
  changePercent: z.number().nullable().optional()
});

export const symbolSearchResponseSchema = z.object({
  results: z.array(symbolSearchResultSchema)
});

export type SymbolSearchResult = z.infer<typeof symbolSearchResultSchema>;

type UnknownRecord = Record<string, unknown>;

const CANDIDATE_ARRAY_KEYS = ["quotes", "data", "result", "results", "items", "stocks", "body"];

export function normalizeYahooSearchResponse(payload: unknown): SymbolSearchResult[] {
  const candidates = findCandidateRows(payload);
  const seen = new Set<string>();
  const results: SymbolSearchResult[] = [];

  for (const candidate of candidates) {
    const symbol = readString(candidate, ["symbol", "ticker", "code"]);

    if (!symbol || seen.has(symbol.toUpperCase())) {
      continue;
    }

    const name =
      readString(candidate, [
        "shortname",
        "shortName",
        "longname",
        "longName",
        "name",
        "companyName",
        "displayName"
      ]) ??
      symbol;
    const type =
      readString(candidate, ["quoteType", "type", "assetType", "securityType"]) ?? "Symbol";
    const exchange = readString(candidate, ["exchange", "exchDisp", "exchangeName"]);
    const region = readString(candidate, ["region", "market"]);
    const currency = readString(candidate, ["currency"]);
    const price = readNumber(candidate, ["regularMarketPrice", "price", "lastPrice"]);
    const changePercent = readNumber(candidate, [
      "regularMarketChangePercent",
      "changePercent",
      "regularMarketChangePercentRaw"
    ]);

    seen.add(symbol.toUpperCase());
    results.push({
      symbol: symbol.toUpperCase(),
      name,
      type,
      exchange,
      region,
      currency,
      price,
      changePercent
    });
  }

  return results.slice(0, 12);
}

function findCandidateRows(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of CANDIDATE_ARRAY_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const records = value.filter(isRecord);

      if (records.some((record) => readString(record, ["symbol", "ticker", "code"]))) {
        return records;
      }

      for (const item of records) {
        const nested = findCandidateRows(item);

        if (nested.length > 0) {
          return nested;
        }
      }
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = findCandidateRows(item);

        if (nested.length > 0) {
          return nested;
        }
      }
    }

    if (isRecord(value)) {
      const nested = findCandidateRows(value);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function readString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (isRecord(value)) {
      const raw = value.raw;
      const fmt = value.fmt;

      if (typeof raw === "string" && raw.trim()) {
        return raw.trim();
      }

      if (typeof fmt === "string" && fmt.trim()) {
        return fmt.trim();
      }
    }
  }

  return undefined;
}

function readNumber(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }

    if (isRecord(value)) {
      const raw = value.raw;

      if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw;
      }

      if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) {
        return Number(raw);
      }
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
