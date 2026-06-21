import {
  CaseStatus,
  EntityType,
  FaultyEntityStatus,
  type Component,
  type FaultyEntity,
  type MaintenanceCase,
  type Module,
  type Order,
  type Project,
  type Subsystem,
  type System,
  type Unit,
} from '@/lib/models';

export type EntityScopeType =
  | 'order'
  | 'project'
  | 'system'
  | 'subsystem'
  | 'module'
  | 'unit'
  | 'component';

export function entityScopeKey(type: EntityScopeType | EntityType | string, id: number): string {
  return `${type}:${id}`;
}

export const FAULT_PING_STYLES: Partial<
  Record<FaultyEntityStatus, { ping: string; dot: string; label: string }>
> = {
  [FaultyEntityStatus.CONFIRMED_FAULTY]: {
    ping: 'bg-red-700',
    dot: 'bg-red-500',
    label: 'Confirmed faulty',
  },
  [FaultyEntityStatus.IDENTIFIED]: {
    ping: 'bg-orange-600',
    dot: 'bg-orange-500',
    label: 'Identified',
  },
  [FaultyEntityStatus.UNDER_INSPECTION]: {
    ping: 'bg-blue-600',
    dot: 'bg-blue-500',
    label: 'Under inspection',
  },
  [FaultyEntityStatus.SUSPECTED]: {
    ping: 'bg-amber-500',
    dot: 'bg-amber-400',
    label: 'Suspected',
  },
};

const TERMINAL_STATUSES = new Set<string>([
  FaultyEntityStatus.HEALTHY,
  FaultyEntityStatus.RESOLVED,
  FaultyEntityStatus.NO_FAULT_FOUND,
  FaultyEntityStatus.FALSEPOSITIVE,
]);

const STATUS_RANK: Record<string, number> = {
  [FaultyEntityStatus.CONFIRMED_FAULTY]: 5,
  [FaultyEntityStatus.IDENTIFIED]: 4,
  [FaultyEntityStatus.UNDER_INSPECTION]: 3,
  [FaultyEntityStatus.SUSPECTED]: 2,
};

export interface HierarchyData {
  orders: Order[];
  projects: Project[];
  systems: System[];
  subsystems: Subsystem[];
  modules: Module[];
  units: Unit[];
  components: Component[];
}

function mergeStatus(
  map: Map<string, FaultyEntityStatus>,
  key: string,
  status: FaultyEntityStatus
) {
  if (TERMINAL_STATUSES.has(status)) return;
  const current = map.get(key);
  if (!current || (STATUS_RANK[status] ?? 0) > (STATUS_RANK[current] ?? 0)) {
    map.set(key, status);
  }
}

function openCaseIds(cases: MaintenanceCase[]): Set<number> {
  return new Set(
    cases
      .filter((c) => c.status !== CaseStatus.Resolved && c.status !== CaseStatus.Closed)
      .map((c) => c.id)
  );
}

function hardwareAncestorKeys(
  entityType: EntityType | string,
  entityId: number,
  h: HierarchyData
): string[] {
  const keys: string[] = [];

  const component = h.components.find((c) => c.id === entityId);
  const unit = h.units.find((u) => u.id === entityId);
  const module = h.modules.find((m) => m.id === entityId);
  const subsystem = h.subsystems.find((s) => s.id === entityId);
  const system = h.systems.find((s) => s.id === entityId);

  let currentSystem: System | undefined;
  let currentProject: Project | undefined;

  if (entityType === EntityType.Component && component) {
    keys.push(entityScopeKey('component', component.id));
    const u = h.units.find((x) => x.id === component.unit_id);
    if (u) {
      keys.push(entityScopeKey('unit', u.id));
      const m = h.modules.find((x) => x.id === u.module_id);
      if (m) {
        keys.push(entityScopeKey('module', m.id));
        const sub = h.subsystems.find((x) => x.id === m.subsystem_id);
        if (sub) {
          keys.push(entityScopeKey('subsystem', sub.id));
          currentSystem = h.systems.find((x) => x.id === sub.system_id);
        }
      }
    }
  } else if (entityType === EntityType.Unit && unit) {
    keys.push(entityScopeKey('unit', unit.id));
    const m = h.modules.find((x) => x.id === unit.module_id);
    if (m) {
      keys.push(entityScopeKey('module', m.id));
      const sub = h.subsystems.find((x) => x.id === m.subsystem_id);
      if (sub) {
        keys.push(entityScopeKey('subsystem', sub.id));
        currentSystem = h.systems.find((x) => x.id === sub.system_id);
      }
    }
  } else if (entityType === EntityType.Module && module) {
    keys.push(entityScopeKey('module', module.id));
    const sub = h.subsystems.find((x) => x.id === module.subsystem_id);
    if (sub) {
      keys.push(entityScopeKey('subsystem', sub.id));
      currentSystem = h.systems.find((x) => x.id === sub.system_id);
    }
  } else if (entityType === EntityType.Subsystem && subsystem) {
    keys.push(entityScopeKey('subsystem', subsystem.id));
    currentSystem = h.systems.find((x) => x.id === subsystem.system_id);
  } else if (entityType === EntityType.System && system) {
    keys.push(entityScopeKey('system', system.id));
    currentSystem = system;
  }

  if (currentSystem) {
    keys.push(entityScopeKey('system', currentSystem.id));
    currentProject = h.projects.find((p) => p.id === currentSystem!.project_id);
  }

  if (currentProject) {
    keys.push(entityScopeKey('project', currentProject.id));
    if (currentProject.order_id) {
      keys.push(entityScopeKey('order', currentProject.order_id));
    }
  }

  return keys;
}

function hardwareDescendantKeys(
  entityType: EntityType | string,
  entityId: number,
  h: HierarchyData
): string[] {
  const keys: string[] = [];

  if (entityType === EntityType.System) {
    const subs = h.subsystems.filter((s) => s.system_id === entityId);
    for (const sub of subs) {
      keys.push(entityScopeKey('subsystem', sub.id));
      keys.push(...hardwareDescendantKeys(EntityType.Subsystem, sub.id, h));
    }
  } else if (entityType === EntityType.Subsystem) {
    const mods = h.modules.filter((m) => m.subsystem_id === entityId);
    for (const mod of mods) {
      keys.push(entityScopeKey('module', mod.id));
      keys.push(...hardwareDescendantKeys(EntityType.Module, mod.id, h));
    }
  } else if (entityType === EntityType.Module) {
    const units = h.units.filter((u) => u.module_id === entityId);
    for (const unit of units) {
      keys.push(entityScopeKey('unit', unit.id));
      keys.push(...hardwareDescendantKeys(EntityType.Unit, unit.id, h));
    }
  } else if (entityType === EntityType.Unit) {
    const comps = h.components.filter((c) => c.unit_id === entityId);
    for (const comp of comps) {
      keys.push(entityScopeKey('component', comp.id));
    }
  }

  return keys;
}

function faultyEntityDescendantKeys(
  rootId: number,
  faultyEntities: FaultyEntity[]
): number[] {
  const children = faultyEntities.filter((fe) => fe.parent_faulty_entity_id === rootId);
  return children.flatMap((c) => [c.id, ...faultyEntityDescendantKeys(c.id, faultyEntities)]);
}

export function buildEntityFaultMap(input: {
  faultyEntities: FaultyEntity[];
  maintenanceCases: MaintenanceCase[];
  hierarchy: HierarchyData;
}): Map<string, FaultyEntityStatus> {
  const map = new Map<string, FaultyEntityStatus>();
  const openIds = openCaseIds(input.maintenanceCases);

  const activeFaults = input.faultyEntities.filter(
    (fe) => openIds.has(fe.case_id) && !TERMINAL_STATUSES.has(fe.status)
  );

  for (const fe of activeFaults) {
    const status = fe.status as FaultyEntityStatus;
    mergeStatus(map, entityScopeKey(fe.entity_type, fe.entity_id), status);

    for (const key of hardwareAncestorKeys(fe.entity_type, fe.entity_id, input.hierarchy)) {
      mergeStatus(map, key, status);
    }

    for (const key of hardwareDescendantKeys(fe.entity_type, fe.entity_id, input.hierarchy)) {
      mergeStatus(map, key, FaultyEntityStatus.SUSPECTED);
    }

    for (const childFeId of faultyEntityDescendantKeys(fe.id, input.faultyEntities)) {
      const child = input.faultyEntities.find((x) => x.id === childFeId);
      if (!child || !openIds.has(child.case_id) || TERMINAL_STATUSES.has(child.status)) continue;
      mergeStatus(map, entityScopeKey(child.entity_type, child.entity_id), child.status);
      for (const key of hardwareAncestorKeys(child.entity_type, child.entity_id, input.hierarchy)) {
        mergeStatus(map, key, child.status);
      }
    }
  }

  return map;
}

export function getEntityFaultStatus(
  map: Map<string, FaultyEntityStatus>,
  type: EntityScopeType | EntityType | string,
  id: number
): FaultyEntityStatus | undefined {
  return map.get(entityScopeKey(type, id));
}
