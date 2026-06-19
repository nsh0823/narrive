import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createReportRequestSchema,
  n8nReportResponseSchema,
  reportJsonSchema
} from "@/lib/schemas";

function formatValidationIssue(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const issue = error.issues[0];

  if (!issue) {
    return "Invalid payload.";
  }

  const path = issue.path.length > 0 ? issue.path.join(".") : "response";

  return `${path}: ${issue.message}`;
}

export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 8,
    select: {
      id: true,
      analysisType: true,
      symbols: true,
      reportJson: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    reports: reports.map((report) => {
      const parsedReport = reportJsonSchema.safeParse(report.reportJson);
      const symbolReports = parsedReport.success ? parsedReport.data.symbols : [];
      const topSymbol = [...symbolReports].sort(
        (a, b) => b.analysis.score - a.analysis.score
      )[0];

      return {
        id: report.id,
        analysisType: report.analysisType,
        symbols: report.symbols,
        createdAt: report.createdAt.toISOString(),
        topSymbol: topSymbol?.symbol,
        topScore: topSymbol?.analysis.score
      };
    })
  });
}

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_REPORT_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_REPORT_WEBHOOK_URL is not configured." },
      { status: 500 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsedRequest = createReportRequestSchema.safeParse(json);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: formatValidationIssue(parsedRequest.error) },
      { status: 400 }
    );
  }

  const payload = parsedRequest.data;

  let webhookResponse: Response;

  try {
    webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `n8n webhook request failed: ${error.message}`
            : "n8n webhook request failed."
      },
      { status: 502 }
    );
  }

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text().catch(() => "");

    return NextResponse.json(
      {
        error: `n8n webhook failed with ${webhookResponse.status}${
          errorText ? `: ${errorText.slice(0, 220)}` : ""
        }`
      },
      { status: 502 }
    );
  }

  const webhookJson = await webhookResponse.json().catch(() => null);
  const parsedWebhookResponse = n8nReportResponseSchema.safeParse(webhookJson);

  if (!parsedWebhookResponse.success) {
    return NextResponse.json(
      {
        error: `n8n webhook returned an invalid report response: ${formatValidationIssue(
          parsedWebhookResponse.error
        )}`
      },
      { status: 502 }
    );
  }

  const responseData = parsedWebhookResponse.data;
  const symbolMetadataBySymbol = new Map(
    (payload.symbolMetadata ?? []).map((item) => [item.symbol, item])
  );
  const enrichedSymbols = responseData.report.symbols.map((symbolReport) => {
    const symbolMetadata = symbolMetadataBySymbol.get(symbolReport.symbol.toUpperCase());

    return symbolMetadata
      ? {
          ...symbolMetadata,
          ...symbolReport
        }
      : symbolReport;
  });
  const reportToSave = {
    ...responseData.report,
    symbols: enrichedSymbols,
    metadata: {
      ...responseData.report.metadata,
      timeHorizon: payload.timeHorizon,
      symbolMetadata: payload.symbolMetadata ?? []
    }
  };

  if (responseData.reportId !== payload.reportId || responseData.report.reportId !== payload.reportId) {
    return NextResponse.json(
      { error: "n8n webhook returned a reportId that does not match the request." },
      { status: 502 }
    );
  }

  await prisma.report.upsert({
    where: {
      id: responseData.reportId
    },
    create: {
      id: responseData.reportId,
      analysisType: payload.analysisType,
      symbols: payload.symbols,
      reportJson: reportToSave as Prisma.InputJsonValue
    },
    update: {
      analysisType: payload.analysisType,
      symbols: payload.symbols,
      reportJson: reportToSave as Prisma.InputJsonValue
    }
  });

  return NextResponse.json({
    reportId: responseData.reportId
  });
}
