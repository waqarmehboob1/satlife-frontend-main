'use client';

import { CheckCircle2, Hammer, Search, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import type { MaintenanceAction } from '@/lib/models';

const statusIcons = {
  pass: CheckCircle2,
  fail: Hammer,
  pending: Search,
  inconclusive: ShieldCheck,
};

export function CaseTimeline({ logs }: { logs: MaintenanceAction[] }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No timeline events have been recorded for this maintenance case.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      {logs.map((log, index) => {
        const Icon = statusIcons[log.outcome] || Search;
        return (
          <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border border-border">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{log.action_type.replace('_', ' ').toUpperCase()}</p>
                <StatusBadge status={log.outcome} />
              </div>
              <p className="text-sm text-muted-foreground">{log.notes || 'No details recorded.'}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{new Date(log.performed_at).toLocaleString()}</span>
                <span>{log.performed_by ? `By user ${log.performed_by}` : 'Performed by unknown'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
