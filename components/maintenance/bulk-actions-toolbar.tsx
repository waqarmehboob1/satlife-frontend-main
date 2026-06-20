'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkActionsToolbarProps {
  selectedCount: number;
  isLoading?: boolean;
  onConfirmFaulty: () => void;
  onMarkHealthy: () => void;
  onSetUnderInspection: () => void;
  onResolve: () => void;
  onRemoveFalsePositive: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  isLoading = false,
  onConfirmFaulty,
  onMarkHealthy,
  onSetUnderInspection,
  onResolve,
  onRemoveFalsePositive,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      'sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md shadow-sm',
      isLoading && 'opacity-80'
    )}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount} selected for investigation actions
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onConfirmFaulty} disabled={isLoading}>
            Confirm Selected Faulty
          </Button>
          <Button variant="secondary" size="sm" onClick={onMarkHealthy} disabled={isLoading}>
            Mark Selected Healthy
          </Button>
          <Button variant="secondary" size="sm" onClick={onSetUnderInspection} disabled={isLoading}>
            Set Under Inspection
          </Button>
          <Button variant="secondary" size="sm" onClick={onResolve} disabled={isLoading}>
            Resolve Selected
          </Button>
          <Button variant="secondary" size="sm" onClick={onRemoveFalsePositive} disabled={isLoading}>
            Remove False Positive
          </Button>
        </div>
      </div>
    </div>
  );
}
