'use client';

import { StatusBadge } from '@/components/status-badge';

interface EntityStatusBadgeProps {
  status: string;
  className?: string;
}

export function EntityStatusBadge({ status, className }: EntityStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}
