import { z } from "zod";

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  importance: z.string().optional(),
  symbol: z.string().optional()
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

type UnknownRecord = Record<string, unknown>;

const CANDIDATE_ARRAY_KEYS = [
  "events",
  "calendar",
  "economicEvents",
  "earnings",
  "result",
  "results",
  "data",
  "items",
  "body"
];

export function normalizeCalendarEvents(payload: unknown): CalendarEvent[] {
  const candidates = findCandidateRows(payload);

  return candidates
    .map((candidate, index) => normalizeCalendarEvent(candidate, index))
    .filter((event): event is CalendarEvent => Boolean(event))
    .slice(0, 8);
}

function normalizeCalendarEvent(record: UnknownRecord, index: number): CalendarEvent | null {
  const title =
    readString(record, [
      "title",
      "event",
      "eventName",
      "name",
      "description",
      "shortName",
      "companyshortname"
    ]) ?? readString(record, ["symbol"]);

  if (!title) {
    return null;
  }

  const symbol = readString(record, ["symbol", "ticker"]);
  const category =
    readString(record, ["category", "type", "eventType", "quoteType"]) ??
    (symbol ? "Ticker event" : "Market event");
  const rawDate = readString(record, [
    "date",
    "eventDate",
    "startDate",
    "start",
    "datetime",
    "dateTime",
    "earningsDate"
  ]);
  const rawTime = readString(record, ["time", "eventTime", "startTime"]);
  const source = readString(record, ["source", "provider", "exchange"]);
  const country = readString(record, ["country", "region", "market"]);
  const importance = readString(record, ["importance", "impact", "priority"]);

  return {
    id: `${symbol ?? title}-${rawDate ?? index}`,
    title,
    category,
    date: formatDate(rawDate),
    time: rawTime,
    source,
    country,
    importance,
    symbol
  };
}

function findCandidateRows(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    const records = payload.filter(isRecord);

    if (records.some(looksLikeCalendarEvent)) {
      return records;
    }

    for (const item of records) {
      const nested = findCandidateRows(item);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of CANDIDATE_ARRAY_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const records = value.filter(isRecord);

      if (records.some(looksLikeCalendarEvent)) {
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
    const nested = findCandidateRows(value);

    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function looksLikeCalendarEvent(record: UnknownRecord) {
  return Boolean(
    readString(record, ["title", "event", "eventName", "name", "description", "symbol"]) &&
      (readString(record, ["date", "eventDate", "startDate", "start", "datetime", "dateTime"]) ||
        readString(record, ["category", "type", "eventType", "time", "eventTime"]))
  );
}

function readString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (isRecord(value)) {
      const raw = value.raw;
      const fmt = value.fmt;

      if (typeof fmt === "string" && fmt.trim()) {
        return fmt.trim();
      }

      if (typeof raw === "string" && raw.trim()) {
        return raw.trim();
      }

      if (typeof raw === "number" && Number.isFinite(raw)) {
        return String(raw);
      }
    }
  }

  return undefined;
}

function formatDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const asNumber = Number(value);
  const date =
    Number.isFinite(asNumber) && value.length <= 10
      ? new Date(asNumber * 1000)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
