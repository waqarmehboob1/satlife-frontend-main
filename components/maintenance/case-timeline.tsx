'use client';

import { CheckCircle2, Hammer, Search, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import type { CaseTimelineEvent } from '@/lib/maintenance-timeline';

const statusIcons = {
  pass: CheckCircle2,
  fail: Hammer,
  pending: Search,
  inconclusive: ShieldCheck,
  resolved: CheckCircle2,
  confirmed_faulty: Hammer,
  open: Search,
} as const;

export function CaseTimeline({
  events,
  isLoading = false,
}: {
  events: CaseTimelineEvent[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <p className="py-4 text-sm text-muted-foreground">Loading timeline events...</p>
    );
  }

  if (!events.length) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No timeline events have been recorded for this maintenance case.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-4 top-2 w-px bg-border" />
      {events.map((event) => {
        const Icon =
          statusIcons[event.outcome as keyof typeof statusIcons] || Search;

        return (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{event.title}</p>
                {event.outcome ? <StatusBadge status={event.outcome} /> : null}
              </div>
              {event.entityLabel ? (
                <p className="text-sm font-medium text-foreground">{event.entityLabel}</p>
              ) : null}
              {event.description ? (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{new Date(event.performed_at).toLocaleString()}</span>
                {event.performed_by ? (
                  <span>By user {event.performed_by}</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
