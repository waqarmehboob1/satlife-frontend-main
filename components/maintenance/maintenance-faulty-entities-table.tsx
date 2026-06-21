'use client';

import { useMemo } from 'react';
import { Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import type { FaultyEntity } from '@/lib/models';

interface MaintenanceFaultyEntitiesTableProps {
  entities: FaultyEntity[];
  selectedIds: number[];
  onToggleSelect: (entityId: number) => void;
  onToggleSelectAll: () => void;
  onView?: (entity: FaultyEntity) => void;
  onConfirmFaulty?: (entity: FaultyEntity) => void;
  onMarkHealthy?: (entity: FaultyEntity) => void;
  onResolve?: (entity: FaultyEntity) => void;
  isLoading?: boolean;
}

export function MaintenanceFaultyEntitiesTable({
  entities,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onConfirmFaulty,
  onMarkHealthy,
  onResolve,
  isLoading = false,
}: MaintenanceFaultyEntitiesTableProps) {
  const allSelected = useMemo(
    () => entities.length > 0 && selectedIds.length === entities.length,
    [entities.length, selectedIds]
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4">Loading entities...</div>;
  }

  if (!entities || entities.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No suspected or confirmed entities found.</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} />
            </TableHead>
            <TableHead>Part Number</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Detected</TableHead>
            <TableHead className="w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity) => (
            <TableRow key={entity.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(entity.id)}
                  onCheckedChange={() => onToggleSelect(entity.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{entity.part_number}</TableCell>
              <TableCell>{entity.entity_name || entity.part_number || entity.serial_number || 'No details'}</TableCell>
              <TableCell>
                <StatusBadge status={entity.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entity.identified_at ? new Date(entity.identified_at).toLocaleDateString() : 'Unknown'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(entity)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onConfirmFaulty && entity.status !== 'confirmed_faulty' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfirmFaulty(entity)}
                      className="h-8 w-8 p-0"
                    >
                      ✓
                    </Button>
                  )}
                  {onResolve && entity.status !== 'resolved' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResolve(entity)}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {onMarkHealthy && entity.status !== 'healthy' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkHealthy(entity)}
                      className="h-8 w-8 p-0"
                    >
                      H
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
