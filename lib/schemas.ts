import { z } from "zod";

import { ANALYSIS_TYPES, TIME_HORIZONS } from "@/lib/constants";

export const analysisTypeSchema = z.enum(
  ANALYSIS_TYPES.map((item) => item.value) as [string, ...string[]]
);

export type AnalysisType = z.infer<typeof analysisTypeSchema>;

export const timeHorizonSchema = z.enum(
  TIME_HORIZONS.map((item) => item.value) as [string, ...string[]]
);

const tickerSymbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[A-Za-z0-9.^=-]+$/, "Enter a valid market symbol.")
  .transform((value) => value.toUpperCase());

export const createReportRequestSchema = z.object({
  reportId: z.string().uuid(),
  symbols: z
    .array(tickerSymbolSchema)
    .min(1, "Select at least one symbol.")
    .max(10, "Select up to 10 symbols."),
  analysisType: analysisTypeSchema,
  timeHorizon: timeHorizonSchema,
  symbolMetadata: z
    .array(
      z.object({
        symbol: tickerSymbolSchema,
        name: z.coerce.string().optional(),
        type: z.coerce.string().optional()
      })
    )
    .optional()
});

const dateString = z.string().datetime().or(z.string().min(1));
const nullableNumber = z.coerce.number().nullable();
const flexibleStringArray = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "number" && value === 0) {
    return [];
  }

  return [String(value)];
}, z.array(z.string()));

const newsArticlesSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : []),
  z.array(
    z
      .object({
        title: z.coerce.string(),
        source: z.coerce.string().optional(),
        url: z.coerce.string().optional(),
        publishedAt: dateString.optional()
      })
      .passthrough()
  )
);

export const symbolReportSchema = z
  .object({
    symbol: z.string(),
    analysis: z
      .object({
        score: z.coerce.number().min(0).max(100),
        confidence: z.coerce.number().min(0).max(100),
        summary: z.coerce.string().default(""),
        opportunities: flexibleStringArray.default([]),
        risks: flexibleStringArray.default([]),
        evidence: z
          .object({
            technical: flexibleStringArray.default([]),
            news: flexibleStringArray.default([]),
            market: flexibleStringArray.default([])
          })
          .passthrough()
          .default({ technical: [], news: [], market: [] })
      })
      .passthrough(),
    marketData: z
      .object({
        symbol: z.string(),
        price: nullableNumber,
        previousClose: nullableNumber.optional(),
        changePercent: nullableNumber,
        volume: nullableNumber.optional(),
        marketCap: nullableNumber.optional(),
        ma50: nullableNumber.optional(),
        ma200: nullableNumber.optional(),
        currency: z.coerce.string().nullable().optional(),
        exchange: z.coerce.string().nullable().optional(),
        fetchedAt: dateString.optional()
      })
      .passthrough(),
    technicalSummary: z
      .object({
        rsi: nullableNumber.optional(),
        signal: z.coerce.string().default("neutral"),
        momentum: z.coerce.string().nullable().optional(),
        momentumPercent: nullableNumber.optional(),
        movingAverageTrend: z.coerce.string().nullable().optional(),
        volumeTrend: z.coerce.string().nullable().optional(),
        latestVolume: nullableNumber.optional(),
        average20DayVolume: nullableNumber.optional(),
        calculatedAt: dateString.optional()
      })
      .passthrough()
      .default({ signal: "neutral" }),
    newsSummary: z
      .object({
        positiveFactors: flexibleStringArray.default([]),
        negativeFactors: flexibleStringArray.default([]),
        majorThemes: flexibleStringArray.default([]),
        summary: z.coerce.string().default("")
      })
      .passthrough()
      .default({
        positiveFactors: [],
        negativeFactors: [],
        majorThemes: [],
        summary: ""
      }),
    newsArticles: newsArticlesSchema.default([]),
    errors: flexibleStringArray.default([])
  })
  .passthrough();

export const reportJsonSchema = z
  .object({
    reportId: z.string().uuid(),
    generatedAt: dateString,
    analysisType: analysisTypeSchema.or(z.string()),
    symbols: z.array(symbolReportSchema),
    metadata: z
      .object({
        requestedSymbolCount: z.coerce.number().optional(),
        processedSymbolCount: z.coerce.number().optional(),
        failedSymbols: flexibleStringArray.default([]),
        sortedBy: z.coerce.string().optional(),
        timeHorizon: timeHorizonSchema.or(z.string()).optional(),
        disclaimer: z.coerce.string().default("For research purposes only. This report is not financial advice.")
      })
      .passthrough()
  })
  .passthrough();

export const n8nReportResponseSchema = z
  .object({
    success: z.literal(true),
    reportId: z.string().uuid(),
    report: reportJsonSchema
  })
  .passthrough();

export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;
export type ReportJson = z.infer<typeof reportJsonSchema>;
export type SymbolReport = z.infer<typeof symbolReportSchema>;
