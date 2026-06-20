'use client';

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import type { MaintenanceAction } from '@/lib/models';

interface MaintenanceActionTableProps {
  actions: MaintenanceAction[];
  onEdit?: (action: MaintenanceAction) => void;
  onDelete?: (action: MaintenanceAction) => void;
  isLoading?: boolean;
}

export function MaintenanceActionTable({
  actions,
  onEdit,
  onDelete,
  isLoading = false,
}: MaintenanceActionTableProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading maintenance actions...
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No maintenance actions found.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Action Type</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Performed At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => (
            <TableRow key={action.id} className="hover:bg-muted/50">
              <TableCell className="text-sm capitalize">
                {action.action_type.replace(/_/g, ' ')}
              </TableCell>
              <TableCell>
                <StatusBadge status={action.outcome} />
              </TableCell>
              <TableCell className="text-sm max-w-xs truncate">
                {action.notes || '-'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(action.performed_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(action)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(action)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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
