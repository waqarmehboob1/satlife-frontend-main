'use client';

import api, * as libApi from '@/lib/api';
import type {
  MaintenanceCase,
  FaultyEntity,
  FaultyEntityStatus,
  MaintenanceAction,
  ResolutionType,
  ActionType,
  ActionOutcome,
  UpdateMaintenanceCasePayload,
} from '@/lib/models';
import { CaseStatus, EntityType } from '@/lib/models';

export const maintenanceService = {
  getCase: (id: number) => libApi.maintenanceCases.get(id),
  updateMaintenanceCase: (id: number, data: UpdateMaintenanceCasePayload) =>
    libApi.maintenanceCases.update(id, data),
  getFaultyEntitiesByCaseId: (caseId: number, skip = 0, limit = 100) => libApi.faultyEntities.listByCaseId(caseId, skip, limit),
  updateFaultyEntity: (entityId: number, data: Partial<FaultyEntity>)=> libApi.faultyEntities.update(entityId, data),
  updateEntityPartNumber: async (entityType: EntityType, entityId: number, partNumber: string) => {
    switch (entityType) {
      case EntityType.System:
        return libApi.systems.update(entityId, { part_number: partNumber });
      case EntityType.Subsystem:
        return libApi.subsystems.update(entityId, { part_number: partNumber });
      case EntityType.Module:
        return libApi.modules.update(entityId, { part_number: partNumber });
      case EntityType.Unit:
        return libApi.units.update(entityId, { part_number: partNumber });
      case EntityType.Component:
        return libApi.components.update(entityId, { part_number: partNumber });
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  },
  createMaintenanceAction: (data: Partial<MaintenanceAction>) => libApi.maintenanceActions.create(data as any),
  
  // Updated faulty entities status after selecting multiple entities using Check boxes
  bulkUpdateFaultyEntities: (caseId: number,payload: {
      entity_ids: number[];
      status: FaultyEntityStatus;
      notes?: string;
    }
  ) => api.patch(`/faulty-entities/bulk-update/`, payload),
  getFaultyEntityHistory: (entityId: number) => libApi.faultyEntities.getMaintenanceHistory(entityId),
  getCaseTimeline: async (caseId: number, faultyEntityIds: number[] = []) => {
    const actions: MaintenanceAction[] = [];
    const faultyEntityIdSet = new Set(faultyEntityIds);

    const appendActions = (items: MaintenanceAction[] | undefined) => {
      if (!Array.isArray(items)) return;
      actions.push(...items);
    };

    try {
      const res = await api.get<MaintenanceAction[]>('/maintenance-actions/', {
        params: { case_id: caseId },
      });
      appendActions(res.data);
    } catch {
      // Continue with other sources.
    }

    if (faultyEntityIds.length > 0) {
      const entityResults = await Promise.allSettled(
        faultyEntityIds.map(async (entityId) => {
          const [actionsRes, historyRes] = await Promise.all([
            libApi.maintenanceActions.listByFaultyEntityId(entityId),
            libApi.faultyEntities.getMaintenanceHistory(entityId),
          ]);
          return [...(actionsRes.data ?? []), ...(historyRes.data ?? [])];
        })
      );

      for (const result of entityResults) {
        if (result.status === 'fulfilled') {
          appendActions(result.value);
        }
      }
    }

    if (actions.length === 0) {
      try {
        const res = await libApi.maintenanceActions.list(0, 1000);
        appendActions(
          (res.data ?? []).filter((action) => faultyEntityIdSet.has(action.faulty_entity_id))
        );
      } catch {
        // No global actions available.
      }
    }

    const uniqueActions = Array.from(
      new Map(actions.map((action) => [action.id, action])).values()
    );

    return { data: uniqueActions };
  },
  confirmFaultyEntity: (entityId: number) =>
    libApi.faultyEntities.update(entityId, { status: 'confirmed_faulty' as FaultyEntityStatus }),
  markEntityHealthy: (entityId: number) =>
    libApi.faultyEntities.update(entityId, { status: 'healthy' as FaultyEntityStatus, resolution_type: 'clear' as ResolutionType }),
  setEntityUnderInspection: (entityId: number) =>
    libApi.faultyEntities.update(entityId, { status: 'under_inspection' as FaultyEntityStatus }),
  resolveEntity: (entityId: number) =>
    libApi.faultyEntities.update(entityId, { status: 'resolved' as FaultyEntityStatus }),
  falsePositiveEntity: (entityId: number) =>
    libApi.faultyEntities.update(entityId, { status: 'false_positive' as FaultyEntityStatus }),
  update_faulty_Children: (entityId: number, data: Partial<FaultyEntity>)=> libApi.faultyEntities.updateChildren(entityId, data),

};
