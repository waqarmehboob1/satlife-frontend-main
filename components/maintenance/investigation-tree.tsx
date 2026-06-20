'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, BugPlay  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { FaultyEntityStatus, type FaultyEntity } from '@/lib/models';

interface InvestigationTreeNode {
  id: number;
  part_number: string;
  display_name: string;
  status: string;
  children?: InvestigationTreeNode[];
}

interface InvestigationTreeProps {
  nodes: InvestigationTreeNode[];
  onSelect?: (node: InvestigationTreeNode) => void;
  onMarkHealthy?: (node: InvestigationTreeNode) => void;
}

function TreeNode({ node, onSelect, onMarkHealthy }: { node: InvestigationTreeNode; onSelect?: (node: InvestigationTreeNode) => void; onMarkHealthy?: (node: InvestigationTreeNode) => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  console.log("Has Children:   ", hasChildren)

  return (
    <div className="space-y-2 rounded-lg border-b bg-background hover:bg-blue-50 p-2">
      <div className="flex items-center left-0">
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => setOpen((prev) => !prev)}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="h-8 w-8" />
        )}
        <div className="flex flex-1 justify-start">
          <div className='flex justify-between min-w-1/5'>
            <div className='flex gap-1'>
              
              {node.status == FaultyEntityStatus.CONFIRMED_FAULTY &&  
              <>
                <span className="relative flex size-2 ">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-700 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                </span>
                <p className="text-sm font-medium text-red-800">{node.display_name}</p>
              </>
              }
              {(node.status == FaultyEntityStatus.UNDER_INSPECTION || node.status == FaultyEntityStatus.IDENTIFIED || node.status == FaultyEntityStatus.NO_FAULT_FOUND || node.status == FaultyEntityStatus.HEALTHY || node.status == FaultyEntityStatus.RESOLVED) &&  
              <>
                <p className="text-sm">{node.display_name}</p>
              </>
              }
            </div>
          {node.status == FaultyEntityStatus.HEALTHY &&
          <StatusBadge className="ml-9 bg-emerald-200 text-emerald-900 px-2" status={node.status} />}
          {node.status == FaultyEntityStatus.CONFIRMED_FAULTY &&
          <StatusBadge className="ml-9 bg-red-200 text-red-900 px-2" status={node.status} />}
          </div>
          
        </div>
        <div className="flex items-center gap-2">
            <BugPlay className='w-10 h-5 hover:text-amber-700'  onClick={() => onSelect?.(node)}/>
        </div>
      </div>
      {hasChildren && open ? (
        <div className="ml-8 mt-4 space-y-3">
          {node.children?.map((child) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} onMarkHealthy={onMarkHealthy} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function InvestigationTree({ nodes, onSelect, onMarkHealthy }: InvestigationTreeProps) {
  console.log("Node ", nodes.length)
  if (!nodes || nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hierarchy data available for this case.</p>;
  }

  return (
    <div className="">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} onSelect={onSelect} onMarkHealthy={onMarkHealthy} />
      ))}
    </div>
  );
}
