import type { FaultyEntity } from '@/lib/models';

export interface InvestigationTreeNode {
  id: number;
  part_number: string;
  display_name: string;
  status: string;
  fault_type?: string;
  entity_type?: string;
  children: InvestigationTreeNode[];
}

function toTreeNode(entity: FaultyEntity): InvestigationTreeNode {
  return {
    id: entity.id,
    part_number:
      entity.part_number ||
      entity.entity_name ||
      `${entity.entity_type}-${entity.entity_id}`,
    display_name:
      entity.entity_name ||
      entity.part_number ||
      `${entity.entity_type} ${entity.entity_id}`,
    status: entity.status,
    fault_type: entity.fault_type,
    entity_type: entity.entity_type,
    children: [],
  };
}

function sortTreeNodes(nodes: InvestigationTreeNode[]) {
  nodes.sort((a, b) => a.display_name.localeCompare(b.display_name));
  nodes.forEach((node) => sortTreeNodes(node.children));
}

/**
 * Builds a hierarchical investigation tree from flat faulty entities
 * using parent_faulty_entity_id. Falls back to matching hardware entity_id
 * when parent references are stored as entity IDs instead of faulty-entity IDs.
 */
export function buildInvestigationTree(entities: FaultyEntity[]): InvestigationTreeNode[] {
  if (!entities.length) return [];

  const nodeMap = new Map<number, InvestigationTreeNode>();
  const faultyEntityIds = new Set(entities.map((entity) => entity.id));

  for (const entity of entities) {
    nodeMap.set(entity.id, toTreeNode(entity));
  }

  const roots: InvestigationTreeNode[] = [];

  for (const entity of entities) {
    const node = nodeMap.get(entity.id)!;
    const parentId = entity.parent_faulty_entity_id;

    if (parentId == null) {
      roots.push(node);
      continue;
    }

    if (faultyEntityIds.has(parentId)) {
      nodeMap.get(parentId)!.children.push(node);
      continue;
    }

    const parentByEntityId = entities.find(
      (candidate) => candidate.entity_id === parentId && candidate.id !== entity.id
    );

    if (parentByEntityId) {
      nodeMap.get(parentByEntityId.id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortTreeNodes(roots);
  return roots;
}
