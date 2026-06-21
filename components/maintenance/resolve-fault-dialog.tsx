'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FaultyEntity, FaultyEntityStatus, ResolutionType } from '@/lib/models';

interface ResolveFaultDialogProps {
  entity: FaultyEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (resolutionType: ResolutionType, replacementPartNumber?: string, notes?: string) => Promise<void>;
  isProcessing?: boolean;
}

const resolutionOptions: Array<{ value: ResolutionType; label: string }> = [
  { value: ResolutionType.REPAIRED, label: 'Repair' },
  { value: ResolutionType.REPLACED, label: 'Replacement' },
  { value: ResolutionType.NO_FAULT_FOUND, label: 'No Fault Found' },
  { value: ResolutionType.DECOMMISSIONED, label: 'Decommissioned' },
  { value: ResolutionType.CLEAR, label: 'Clear' },
];

export function ResolveFaultDialog({
  entity,
  open,
  onOpenChange,
  onResolve,
  isProcessing = false,
}: ResolveFaultDialogProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType | ''>('');
  const [replacementPartNumber, setReplacementPartNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setResolutionType('');
      setReplacementPartNumber('');
      setNotes('');
    }
  }, [open]);

  const requiresReplacementPartNumber = resolutionType === ResolutionType.REPLACED;
  const hasMissingFaultType = entity?.status === FaultyEntityStatus.CONFIRMED_FAULTY && !entity.fault_type;
  const canSubmit = Boolean(resolutionType) && (!requiresReplacementPartNumber || replacementPartNumber.trim().length > 0);

  const details = useMemo(
    () => [
      { label: 'Entity Type', value: entity?.entity_type || 'N/A' },
      { label: 'Entity ID', value: entity?.entity_id.toString() || 'N/A' },
      { label: 'Part Number', value: entity?.part_number || 'N/A' },
      { label: 'Serial Number', value: entity?.serial_number || 'N/A' },
      { label: 'Status', value: entity?.status || 'N/A' },
      { label: 'Fault Type', value: entity?.fault_type || 'N/A' },
      { label: 'Identified At', value: entity?.identified_at ? new Date(entity.identified_at).toLocaleString() : 'Unknown' },
    ],
    [entity]
  );

  const handleSubmit = async () => {
    if (!entity || !resolutionType) return;
    await onResolve(resolutionType, replacementPartNumber.trim() || undefined, notes.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Fault</DialogTitle>
          <DialogDescription>
            Review the selected entity and choose how to resolve the fault. Replacement part number is required when resolution type is Replacement.
          </DialogDescription>
        </DialogHeader>

        {!entity ? (
          <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
            Select a faulty entity before resolving.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs uppercase text-muted-foreground">{detail.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{detail.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="resolution-type">Resolution Type</Label>
              <Select value={resolutionType} onValueChange={(value) => setResolutionType(value as ResolutionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {requiresReplacementPartNumber ? (
              <div className="grid gap-2">
                <Label htmlFor="replacement-part-number">Replacement Part Number</Label>
                <Input
                  id="replacement-part-number"
                  value={replacementPartNumber}
                  onChange={(event) => setReplacementPartNumber(event.target.value)}
                  placeholder="Enter replacement part number"
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Input
                id="resolution-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for the resolution"
              />
            </div>

            {hasMissingFaultType ? (
              <p className="text-sm text-destructive">
                Fault type is required on confirmed faulty entities before resolving.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!entity || !canSubmit || hasMissingFaultType || isProcessing}
          >
            {isProcessing ? 'Resolving...' : 'Resolve Fault'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
