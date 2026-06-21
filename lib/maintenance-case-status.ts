import { CaseStatus, FaultyEntity, FaultyEntityStatus } from './models';

const TERMINAL_FAULTY_STATUSES: FaultyEntityStatus[] = [
  FaultyEntityStatus.RESOLVED,
  FaultyEntityStatus.HEALTHY,
  FaultyEntityStatus.NO_FAULT_FOUND,
  FaultyEntityStatus.FALSEPOSITIVE,
];

export function isTerminalFaultyStatus(status: FaultyEntityStatus | string): boolean {
  return TERMINAL_FAULTY_STATUSES.includes(status as FaultyEntityStatus);
}

export function areAllFaultyEntitiesTerminal(entities: FaultyEntity[]): boolean {
  if (entities.length === 0) return false;
  return entities.every((entity) => isTerminalFaultyStatus(entity.status));
}

export function shouldAutoResolveCase(
  entities: FaultyEntity[],
  currentCaseStatus?: CaseStatus | string
): boolean {
  if (!entities.length) return false;
  if (currentCaseStatus === CaseStatus.Resolved || currentCaseStatus === CaseStatus.Closed) {
    return false;
  }
  return areAllFaultyEntitiesTerminal(entities);
}

export function getDescendantFaultyEntityIds(
  entityId: number,
  entities: FaultyEntity[]
): number[] {
  const children = entities.filter((entity) => entity.parent_faulty_entity_id === entityId);
  return children.flatMap((child) => [child.id, ...getDescendantFaultyEntityIds(child.id, entities)]);
}
