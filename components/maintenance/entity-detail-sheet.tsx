'use client';

import { useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { EntityStatusBadge } from './entity-status-badge';
import type { FaultyEntity } from '@/lib/models';

interface EntityDetailSheetProps {
  entity: FaultyEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmFaulty?: () => void;
  onMarkHealthy?: () => void;
}

export function EntityDetailSheet({
  entity,
  open,
  onOpenChange,
  onConfirmFaulty,
  onMarkHealthy,
}: EntityDetailSheetProps) {
  const details = useMemo(
    () => [
      { label: 'Part Number', value: entity?.part_number || 'N/A', flag_color: " bg-amber-500 " },
      { label: 'Serial Number', value: entity?.serial_number || 'N/A', flag_color: "bg-blue-500 "  },
      { label: 'Fault Type', value: entity?.fault_type || 'Unknown', flag_color: "bg-emerald-300 "  },
      { label: 'Status', value: entity?.status || 'unknown', flag_color: "bg-yellow-800"  },
      { label: 'Identified At', value: entity?.identified_at ? new Date(entity.identified_at).toLocaleString() : 'Unknown', flag_color: " bg-cyan-300"  },
    ],
    [entity]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Faulty Entity Details</SheetTitle>
          <SheetDescription>Review the investigation details and update the status if needed.</SheetDescription>
        </SheetHeader>

        {!entity ? (
          <div className="mt-6 rounded-lg border-8 border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
            Select an entity to see investigation details.
          </div>
        ) : (
          <div className="p-3 py-4 h-full flex flex-col justify-between">
            <div className="rounded-lg p-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Faulty Entity</p>
                  <h2 className="text-xl font-semibold">{entity.entity_name}</h2>
                </div>
                <EntityStatusBadge status={entity.status} />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-1">
                {details.map((item) => (
                  <div key={item.label} className="flex bg-blue-50">
                    <span className={`${item.flag_color} min-w-4 min-h-16`}></span>
                    <div className='p-3'>

                    <p className="text-xs font-light uppercase text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="default" onClick={onConfirmFaulty} disabled={!entity || entity.status === 'confirmed_faulty'}>
                Confirm Faulty
              </Button>
              <Button variant="secondary" onClick={onMarkHealthy} disabled={!entity || entity.status === 'healthy'}>
                Mark Healthy
              </Button>
              
              <Button variant="secondary" onClick={onMarkHealthy} disabled={!entity || entity.status === 'healthy'}>
                Resolve
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
