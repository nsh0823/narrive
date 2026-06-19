"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/calendar-events";

type CalendarEventsResponse = {
  events?: CalendarEvent[];
  error?: string;
};

async function fetchCalendarEvents() {
  const response = await fetch("/api/calendar-events?region=US");
  const body = (await response.json().catch(() => null)) as CalendarEventsResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to load calendar events.");
  }

  return body?.events ?? [];
}

export function CalendarEvents() {
  const query = useQuery({
    queryKey: ["calendar-events", "US"],
    queryFn: fetchCalendarEvents,
    refetchInterval: 60_000 * 10,
    staleTime: 60_000 * 5
  });
  const events = query.data ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} className="text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Market Calendar</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Upcoming events</p>
          </div>
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
            aria-label="Refresh market calendar"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
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
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            No calendar events returned.
          </div>
        ) : (
          events.slice(0, 5).map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0">
      <div className="w-14 shrink-0">
        <div className="font-mono text-xs font-semibold text-primary">{event.date ?? "--"}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{event.time ?? event.country ?? ""}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-xs font-medium leading-relaxed text-foreground">
          {event.symbol ? `${event.symbol} · ${event.title}` : event.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {event.category ? <span>{event.category}</span> : null}
          {event.source ? <span>· {event.source}</span> : null}
          {event.importance ? <span>· {event.importance}</span> : null}
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
