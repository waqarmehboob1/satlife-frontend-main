import { CaseStatus, FaultyEntityStatus } from '@/lib/models';
import type { Customer, FaultyEntity, MaintenanceCase, Project } from '@/lib/models';

export type AppNotificationType =
  | 'open_maintenance_case'
  | 'confirmed_fault'
  | 'identified_fault'
  | 'case_resolved'
  | 'project_completed'
  | 'customer_status_change';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  href: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

const OPEN_CASE_STATUSES: string[] = [
  CaseStatus.Open,
  CaseStatus.UnderInspection,
  CaseStatus.UnderRepair,
];

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

function isRecent(isoDate?: string | null): boolean {
  if (!isoDate) return false;
  const ts = new Date(isoDate).getTime();
  return Date.now() - ts <= RECENT_MS;
}

export function buildAppNotifications(input: {
  maintenanceCases: MaintenanceCase[];
  faultyEntities: FaultyEntity[];
  projects: Project[];
  customers: Customer[];
}): AppNotification[] {
  const { maintenanceCases, faultyEntities, projects, customers } = input;
  const notifications: AppNotification[] = [];

  for (const mc of maintenanceCases) {
    if (OPEN_CASE_STATUSES.includes(mc.status)) {
      notifications.push({
        id: `case-open-${mc.id}`,
        type: 'open_maintenance_case',
        title: 'Open maintenance case',
        message: `${mc.case_number} — ${mc.status.replace(/_/g, ' ')}`,
        href: `/maintenance/cases/${mc.id}`,
        timestamp: mc.reported_at ?? mc.created_at ?? new Date().toISOString(),
        priority: mc.status === CaseStatus.Open ? 'high' : 'medium',
      });
    }
    if (
      (mc.status === CaseStatus.Resolved || mc.status === CaseStatus.Closed) &&
      isRecent(mc.updated_at ?? mc.reported_at)
    ) {
      notifications.push({
        id: `case-resolved-${mc.id}`,
        type: 'case_resolved',
        title: 'Maintenance case resolved',
        message: `${mc.case_number} marked ${mc.status}`,
        href: `/maintenance/cases/${mc.id}`,
        timestamp: mc.updated_at ?? mc.reported_at ?? new Date().toISOString(),
        priority: 'low',
      });
    }
  }

  for (const fe of faultyEntities) {
    if (fe.status === FaultyEntityStatus.CONFIRMED_FAULTY) {
      notifications.push({
        id: `fault-confirmed-${fe.id}`,
        type: 'confirmed_fault',
        title: 'Confirmed fault',
        message: `${fe.entity_name ?? fe.part_number ?? 'Entity'} requires attention`,
        href: `/maintenance/cases/${fe.case_id}`,
        timestamp: fe.identified_at ?? new Date().toISOString(),
        priority: 'high',
      });
    } else if (fe.status === FaultyEntityStatus.IDENTIFIED) {
      notifications.push({
        id: `fault-identified-${fe.id}`,
        type: 'identified_fault',
        title: 'Fault identified',
        message: `${fe.entity_name ?? fe.part_number ?? 'Entity'} flagged for inspection`,
        href: `/maintenance/cases/${fe.case_id}`,
        timestamp: fe.identified_at ?? new Date().toISOString(),
        priority: 'medium',
      });
    }
  }

  for (const project of projects) {
    const completed =
      project.status_name === 'Completed' || (project.progress ?? 0) >= 100;
    if (completed && isRecent(project.updated_at)) {
      notifications.push({
        id: `project-completed-${project.id}`,
        type: 'project_completed',
        title: 'Project completed',
        message: `${project.name} reached 100% progress`,
        href: `/projects/${project.id}`,
        timestamp: project.updated_at,
        priority: 'low',
      });
    }
  }

  for (const customer of customers) {
    if (
      customer.updated_at &&
      customer.created_at &&
      customer.updated_at !== customer.created_at &&
      isRecent(customer.updated_at)
    ) {
      notifications.push({
        id: `customer-status-${customer.id}-${customer.updated_at}`,
        type: 'customer_status_change',
        title: 'Customer status updated',
        message: `${customer.name} — ${customer.status_name}`,
        href: `/customers/${customer.id}`,
        timestamp: customer.updated_at,
        priority: 'medium',
      });
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
