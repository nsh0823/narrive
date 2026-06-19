import { NextResponse } from "next/server";

import { normalizeCalendarEvents } from "@/lib/calendar-events";

export async function GET(request: Request) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost =
    process.env.RAPIDAPI_YAHOO_FINANCE_HOST ?? "yahoo-finance-real-time1.p.rapidapi.com";

  if (!rapidApiKey) {
    return NextResponse.json(
      { error: "RAPIDAPI_KEY is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? "US";
  const url = new URL(`https://${rapidApiHost}/calendar/get-events`);
  url.searchParams.set("region", region);

  let rapidApiResponse: Response;

  try {
    rapidApiResponse = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": rapidApiHost,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `RapidAPI calendar events request failed: ${error.message}`
            : "RapidAPI calendar events request failed."
      },
      { status: 502 }
    );
  }

  if (!rapidApiResponse.ok) {
    const errorText = await rapidApiResponse.text().catch(() => "");

    return NextResponse.json(
      {
        error: `RapidAPI calendar events failed with ${rapidApiResponse.status}${
          errorText ? `: ${errorText.slice(0, 220)}` : ""
        }`
      },
      { status: 502 }
    );
  }

  const responseText = await rapidApiResponse.text();
  let payload: unknown;

  try {
    payload = JSON.parse(responseText) as unknown;
  } catch {
    return NextResponse.json(
      { error: "RapidAPI calendar events returned invalid JSON." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    events: normalizeCalendarEvents(payload)
  });
}
