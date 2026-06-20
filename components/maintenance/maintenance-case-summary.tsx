'use client';

import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/kpi-card';
import { EntityStatusBadge } from './entity-status-badge';
import type { MaintenanceCase } from '@/lib/models';

interface MaintenanceCaseSummaryProps {
  maintenanceCase: MaintenanceCase;
  projectName?: string;
  counts: {
    under_inspection: number;
    suspected: number;
    confirmed: number;
    healthy: number;
    resolved: number;
    total: number;
  };
}

export function MaintenanceCaseSummary({ maintenanceCase, projectName, counts }: MaintenanceCaseSummaryProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{maintenanceCase.case_number}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{maintenanceCase.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EntityStatusBadge status={maintenanceCase.status} className="rounded-full px-3 py-1 text-xs" />
            <span className="text-sm text-muted-foreground">Reported {new Date(maintenanceCase.reported_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 rounded-lg border border-border  p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Project</p>
            <p className="font-semibold">{projectName || maintenanceCase.project_name}</p>
          </div>
          <div className="space-y-1 rounded-lg border border-border  p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Reported By</p>
            <p className="font-semibold">{maintenanceCase.reported_by_user || 'Unknown'}</p>
          </div>
        </div>
        <div className='flex justify-between'>   
          <div className="space-y-1 rounded-lg pl-2 w-fit">
            <p className="text-xs font-medium uppercase min-w-3/4 tracking-[0.2em] text-muted-foreground">Resolution Notes</p>
            <p className="text-sm text-shadow-muted-foreground wrap-break-word">{maintenanceCase.resolution_notes || 'No notes yet'}</p>
          </div>
          <div className="space-y-1 rounded-lg">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Resolved At</p>
            <p className="text-sm text-shadow-muted-foreground">{maintenanceCase.resolved_at ? new Date(maintenanceCase.resolved_at).toLocaleDateString() : 'Pending'}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-6">
        <KPICard title="Total" value={counts.total} change={0} icon={Package} accentColor="blue" />
        <KPICard title="Under Inspection" value={counts.under_inspection} change={Math.round(100*counts.under_inspection/counts.total)} icon={Package} accentColor="orange" />
        <KPICard title="Suspected" value={counts.suspected} change={Math.round(100*counts.suspected/counts.total)} icon={Package} accentColor="green" />
        <KPICard title="Confirmed Faulty" value={counts.confirmed} change={Math.round(100*counts.confirmed/counts.total)} icon={Package} accentColor="red" />
        <KPICard title="Healthy" value={counts.healthy} change={Math.round(100*counts.healthy/counts.total)} icon={Package} accentColor="amber" />
        <KPICard title="Resolved" value={counts.resolved} change={Math.round(100*counts.resolved/counts.total)} icon={Package} accentColor="slate" />
      </div>
    </div>
  );
}
