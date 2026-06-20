'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EntityLookupNode, lookUpResponse } from '@/lib/models';

interface EntityLookupTreeProps {
  response: lookUpResponse;
  caseId?: number | null;
  onSuspectChildren?: () => Promise<void>;
  onConfirmFault?: (node: EntityLookupNode) => Promise<void>;
}

function TreeNode({
  node,
  depth = 0,
  caseId,
  onConfirmFault,
}: {
  node: EntityLookupNode;
  depth?: number;
  caseId?: number | null;
  onConfirmFault?: (node: EntityLookupNode) => Promise<void>;
}) {
  const hasChildren = node.children?.length > 0;
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Expand root node by default
  const [expanded, setExpanded] = useState(depth === 0);

  useEffect(() => {
    if (expanded && hasChildren && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [expanded, hasChildren]);

  const toggleExpanded = () => {
    if (!hasChildren) return;
    setExpanded((prev) => !prev);
  };

  return (
    <div ref={nodeRef}>
      <div
        onClick={toggleExpanded}
        className={cn(
          'flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/70',
          hasChildren && 'cursor-pointer',
          depth === 0 ? 'bg-muted' : 'bg-card',
        )}
        style={{
          paddingLeft: `${depth * 24 + 12}px`,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
            •
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium truncate">
              {node.entity_name}
            </span>

            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-[0.15em]"
            >
              {node.entity_type}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Part #: {node.entity_PartNumber ?? "N/A"}</span>

            <span>Sr #: {node.entity_SerialNumber ?? "N/A"}</span>
          </div>
        </div>

        {caseId && onConfirmFault && (
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onConfirmFault(node);
            }}
          >
            Confirm Fault
          </Button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="relative">
          {node.children!.map((child) => (
            <TreeNode
              key={`${child.entity_type}-${child.entity_id}`}
              node={child}
              depth={depth + 1}
              caseId={caseId}
              onConfirmFault={onConfirmFault}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(nodes: EntityLookupNode[]) {
  const roots: EntityLookupNode[] = [];
  const stack: EntityLookupNode[] = [];
  // console.log("build Tree Stack", stack)
  const processed = nodes.map((node) => ({
    ...node,
    children: [] as EntityLookupNode[],
  }));
  // console.log("BuildTree Processed Nodes", processed)

  for (const current of processed) {
    while (stack.length > 0 &&  (stack[stack.length - 1].depth ?? 0) >= (current.depth ?? 0))
      {
        stack.pop();
      }

    if (stack.length === 0) {
      roots.push(current);
    } else {
      stack[stack.length - 1].children.push(current);
    }

    stack.push(current);
  }

  return roots;
}

export function EntityLookupTree({
  response,
  caseId,
  onSuspectChildren,
  onConfirmFault,
}: EntityLookupTreeProps) {
  const rootChildren = buildTree(response.descendants || []);

  return (
    <div className="flex min-h-0 flex-col justify-between">
      <div className = "">
      
          <div className="p-2 gap-2 flex flex-col">
            <h3 className="flex font-semibold border-b-2">Ancestors</h3>
            <div className="flex  w-full items-start overflow-x-hidden h-28 ">
              
              
              <div className="  breadcrumb bg-orange-500! gap-2 grid grid-cols-1 p-2 h-28">
                    <span className="text-[13px] font-bold">{response.matched_label}</span>
                      <p className="text-xs text-lime-950">
                        Sr# - {response.matched_entity_serialNumber}
                      </p>
                      <Badge variant="outline" className="text-[10px] uppercase bg-amber-50">
                          {response.matched_entity_type}
                      </Badge>
              </div>
              
              {response.ancestors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ancestors available.</p>
              ) : (
                response.ancestors.map((ancestor) => (
              
                  <div
                    key={`${ancestor.entity_type}-${ancestor.entity_id}`}
                    className=" breadcrumb not-odd:items-center gap-2 grid grid-cols-1 p-2 h-28"
                  >
                    <span className="text-[13px] font-bold ">{ancestor.entity_name}</span>
                     <p className="text-xs text-lime-950">
                        Sr# - {ancestor.entity_SerialNumber}
                      </p>
                    <Badge variant="outline" className="text-[10px] uppercase bg-amber-50 max-h-5">
                      {ancestor.entity_type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            {caseId && onSuspectChildren && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={onSuspectChildren}>
                Suspect Children for Case #{caseId}
              </Button>
            </div>
                  )}
          </div>

          <div className="max-h-[45vh] min-h-45 overflow-y-auto border-2 p-4">
            <h3 className="flex font-semibold border-b-2">Hierarchy Tree</h3>
            <div className="mt-3 space-y-2">
              <TreeNode
                node={{
                  entity_type: response.matched_entity_type,
                  entity_id: response.matched_entity_id,
                  label: response.matched_label,
                  children: rootChildren,
                  entity_name : response.matched_label,
                  entity_PartNumber: response.matched_entity_PartNumber,
                  entity_SerialNumber: response.matched_entity_serialNumber,
                }}
                depth={0}
                caseId={caseId}
                onConfirmFault={onConfirmFault}
              />
            </div>
          </div>
      </div>
    </div>
  );
}
