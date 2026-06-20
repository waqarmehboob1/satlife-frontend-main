'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EntityLookupTree } from './EntityLookupTree';
import type { EntityLookupNode, lookUpResponse } from '@/lib/models';
import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
interface MaintenanceLookupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  partNumber: string;
  setPartNumber: (value: string) => void;
  partNumbers: string[],
  onLookup: (partNumber: string) => Promise<void>;
  onCreateCase: () => Promise<void>;
  lookupResponse: lookUpResponse | null;
  caseId?: number | null;
  lookupLoading?: boolean;
  lookupError?: string | null;
  onSuspectChildren?: () => Promise<void>;
  onConfirmFault?: (node: EntityLookupNode) => Promise<void>;
}

interface PartNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function PartNumberField({
  value,
  onChange,
  options,
}: PartNumberFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor="part-number">Part Number</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {value || 'Select part number'}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search part number..."
              value={value}
              onValueChange={onChange}
            />

            <CommandEmpty>No part number found.</CommandEmpty>

            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((partNumber) => (
                <CommandItem
                  key={partNumber}
                  value={partNumber}
                  onSelect={(selectedValue) => {
                    onChange(selectedValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === partNumber
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                  />

                  {partNumber}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function MaintenanceLookupDialog({
  isOpen,
  onOpenChange,
  partNumber,
  setPartNumber,
  partNumbers,
  onLookup,
  onCreateCase,
  lookupResponse,
  caseId,
  lookupLoading,
  lookupError,
  onSuspectChildren,
  onConfirmFault,
}: MaintenanceLookupDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} >
      <DialogContent
        className={`sm:max-w-4xl ${lookupResponse ? 'lg:max-w-9/12 max-h-[90vh] min-h-105 overflow-hidden' : 'lg:max-w-4xl'} border-8`}
      >
        <DialogHeader>
          <DialogTitle>Maintenance Entity Lookup</DialogTitle>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 gap-4 py-2 overflow-hidden">
          <PartNumberField
            value={partNumber}
            onChange={setPartNumber}
            options={partNumbers}
/>
          {/* <div className="grid gap-2">
            <Label htmlFor="part-number">Part Number</Label>
            <Input
              id="part-number"
              value={partNumber}
              onChange={(event) => setPartNumber(event.target.value)}
              placeholder="Enter part number to lookup"
            />
          </div> */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => onLookup(partNumber)}
              disabled={lookupLoading || partNumber.trim().length === 0}
            >
              {lookupLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Lookup
            </Button>
            {lookupResponse && !caseId ? (
              <Button onClick={onCreateCase} variant="secondary">
                Create Maintenance Case
              </Button>
            ) : null}
            {lookupResponse && caseId ? (
              <>
                {console.log("Condition TRUE", lookupResponse, caseId)}
                
                <Button onClick={onSuspectChildren} variant="secondary">
                  Suspect Children
                </Button>
              </>
            ) : null}
          </div>
          {lookupError ? (
            <p className="text-sm text-destructive">{lookupError}</p>
          ) : null}
          {lookupResponse ? (
            <EntityLookupTree
              response={lookupResponse}
              caseId={caseId}
              onSuspectChildren={onSuspectChildren}
              onConfirmFault={onConfirmFault}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the part number lookup to load the entity and its hierarchy.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
