'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, BugPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FaultyEntityStatus, FaultType } from '@/lib/models';
import type { InvestigationTreeNode } from '@/lib/maintenance-tree';

interface InvestigationTreeProps {
  nodes: InvestigationTreeNode[];
  onSelect?: (node: InvestigationTreeNode) => void;
  onMarkHealthy?: (node: InvestigationTreeNode) => void;
  onFaultTypeChange?: (nodeId: number, faultType: string) => void;
}

const statusBadgeClass: Partial<Record<string, string>> = {
  [FaultyEntityStatus.HEALTHY]: 'bg-emerald-200 text-emerald-900',
  [FaultyEntityStatus.CONFIRMED_FAULTY]: 'bg-red-200 text-red-900',
  [FaultyEntityStatus.SUSPECTED]: 'bg-amber-200 text-amber-900',
  [FaultyEntityStatus.UNDER_INSPECTION]: 'bg-blue-200 text-blue-900',
  [FaultyEntityStatus.RESOLVED]: 'bg-slate-200 text-slate-900',
  [FaultyEntityStatus.FALSEPOSITIVE]: 'bg-slate-200 text-slate-700',
};

function TreeNode({
  node,
  depth = 0,
  onSelect,
  onMarkHealthy,
  onFaultTypeChange,
}: {
  node: InvestigationTreeNode;
  depth?: number;
  onSelect?: (node: InvestigationTreeNode) => void;
  onMarkHealthy?: (node: InvestigationTreeNode) => void;
  onFaultTypeChange?: (nodeId: number, faultType: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(depth < 2);

  const isConfirmedFaulty = node.status === FaultyEntityStatus.CONFIRMED_FAULTY;
  const badgeClass = statusBadgeClass[node.status];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 hover:bg-muted/50">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )}

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {isConfirmedFaulty && (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-700 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
          )}

          <div className="min-w-0">
            <p className={`truncate text-sm font-medium ${isConfirmedFaulty ? 'text-red-800' : ''}`}>
              {node.display_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {node.entity_type} · {node.part_number}
            </p>
          </div>

          {badgeClass && <StatusBadge className={`shrink-0 px-2 ${badgeClass}`} status={node.status} />}
        </div>

        {isConfirmedFaulty && (
          <div className="flex shrink-0 items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Fault Type:</label>
            <Select
              value={node.fault_type || ''}
              onValueChange={(value) => onFaultTypeChange?.(node.id, value)}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Select fault type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FaultType.ELECTRICAL}>Electrical</SelectItem>
                <SelectItem value={FaultType.MECHANICAL}>Mechanical</SelectItem>
                <SelectItem value={FaultType.ENVIRONMENTAL}>Environmental</SelectItem>
                <SelectItem value={FaultType.HARDWARE}>Hardware</SelectItem>
                <SelectItem value={FaultType.MANUFACTURING_DEFECT}>Manufacturing Defect</SelectItem>
                <SelectItem value={FaultType.PHYSICAL_DAMAGE}>Physical Damage</SelectItem>
                <SelectItem value={FaultType.SOFTWARE}>Software</SelectItem>
                <SelectItem value={FaultType.UNCLASSIFIED}>Unclassified</SelectItem>
                <SelectItem value={FaultType.WEAR}>Wear</SelectItem>
                <SelectItem value={FaultType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="View entity details"
            onClick={() => onSelect?.(node)}
          >
            <BugPlay className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && open && (
        <div className="ml-6 space-y-1 border-l border-border pl-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              onMarkHealthy={onMarkHealthy}
              onFaultTypeChange={onFaultTypeChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function InvestigationTree({
  nodes,
  onSelect,
  onMarkHealthy,
  onFaultTypeChange,
}: InvestigationTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hierarchy data available for this case.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          onMarkHealthy={onMarkHealthy}
          onFaultTypeChange={onFaultTypeChange}
        />
      ))}
    </div>
  );
}
