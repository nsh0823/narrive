"use client";

import { ArrowRight, Bell, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AutomateReportCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="space-y-3 rounded-xl border border-primary/20 bg-accent p-5">
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-primary" />
          <h3 className="text-sm font-semibold text-primary">Automate This Report</h3>
        </div>
        <p className="text-xs leading-relaxed text-primary/75">
          Receive this exact analysis daily before market open, automatically updated with fresh data.
        </p>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 w-full rounded-lg text-xs font-semibold"
        >
          Set Up Daily Reports
          <ArrowRight size={13} />
        </Button>
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="automate-dialog-title"
        >
          <div className="animate-scale-in w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Bell size={18} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close automate dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <h2 id="automate-dialog-title" className="font-display text-lg font-bold text-foreground">
                Automate reports is coming soon
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This feature is still in progress. Automated report generation and notification settings will be available in a future update.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-10 w-full rounded-lg text-sm font-semibold"
            >
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
