import {
  BarChart2,
  Bell,
  Settings,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";

import { CalendarEvents } from "@/components/calendar-events";
import { MarketSnapshot } from "@/components/market-snapshot";
import { RecentReports } from "@/components/recent-reports";
import { ReportComposer } from "@/components/report-composer";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles size={14} />
              </div>
              <span className="font-display text-[15px] font-bold tracking-normal text-foreground">
                Narrive
              </span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <NavItem active icon={<BarChart2 size={14} />} label="Dashboard" />
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell size={15} />
            </button>
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Settings size={15} />
            </button>
            <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              N
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <section className="space-y-2">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-1">
            <Sparkles size={11} />
            Provided by n8n + Gemini + Market Intelligence
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">
            AI-Powered Investment Research
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            AI investment narratives backed by data.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <ReportComposer />
          </div>

          <aside className="space-y-4">
            <MarketSnapshot />

            <RecentReports />

            <CalendarEvents />
          </aside>
        </section>
      </div>
    </main>
  );
}

function NavItem({
  active = false,
  icon,
  label
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={
        active
          ? "flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-primary"
          : "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      }
    >
      {icon}
      {label}
    </div>
  );
}
