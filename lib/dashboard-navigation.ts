import type { ActivityItem, TreemapNode } from '@/lib/types/dashboard';

const HREF_MAP: Record<string, string> = {
  customers: '/customers',
  orders: '/orders',
  projects: '/projects',
  systems: '/systems',
  subsystems: '/subsystems',
  modules: '/modules',
  units: '/units',
  components: '/components',
};

export function activityLink(item: ActivityItem): string {
  switch (item.link_type) {
    case 'maintenance_case':
      return `/maintenance/cases/${item.link_id}`;
    case 'project':
      return `/projects/${item.link_id}`;
    case 'faulty_entity':
      return `/maintenance/cases/${item.link_id}`;
    case 'entity':
      return '/maintenance';
    default:
      return '/maintenance';
  }
}

export function treemapLink(node: TreemapNode): string {
  const base = HREF_MAP[node.href_key ?? ''] ?? '/customers';
  return node.id ? `${base}/${node.id}` : base;
}

export function projectStatusLink(status: string): string {
  return `/projects?status=${encodeURIComponent(status)}`;
}

export function maintenanceStatusLink(status: string): string {
  return `/maintenance?status=${encodeURIComponent(status)}`;
}
