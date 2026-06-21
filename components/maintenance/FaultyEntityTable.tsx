'use client';

import React from 'react';
import { Check, Eye, Trash2 } from 'lucide-react';
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
import type { FaultyEntity } from '@/lib/models';

interface FaultyEntityTableProps {
  entities: FaultyEntity[];
  onView?: (entity: FaultyEntity) => void;
  onResolve?: (entity: FaultyEntity) => void;
  onDelete?: (entity: FaultyEntity) => void;
  isLoading?: boolean;
}

export function FaultyEntityTable({
  entities,
  onView,
  onResolve,
  onDelete,
  isLoading = false,
}: FaultyEntityTableProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading faulty entities...
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No faulty entities found.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table> 
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Entity Type</TableHead>
            <TableHead>Part #</TableHead>
            <TableHead>Ser #</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead>Fault Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Identified At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity) => (
            <TableRow key={entity.id} className="hover:bg-muted/50">
              <TableCell className="text-sm">
                {entity.entity_type}
              </TableCell>
              <TableCell className="text-sm">
                {entity.part_number ? `${entity.part_number}` : "xxxxxxxxx"}
              </TableCell>
              <TableCell className="text-sm">
                {entity.serial_number ? `${entity.serial_number}` : "xxxxxxxxx"}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {entity.entity_id}
              </TableCell>
              <TableCell className="text-sm">{entity.fault_type}</TableCell>
              <TableCell>
                <StatusBadge status={entity.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(entity.identified_at).toLocaleDateString()}
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
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(entity)}
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
