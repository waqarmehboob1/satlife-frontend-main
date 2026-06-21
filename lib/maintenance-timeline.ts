import type { FaultyEntity, MaintenanceAction, MaintenanceCase } from '@/lib/models';

export interface CaseTimelineEvent {
  id: string;
  title: string;
  description?: string;
  outcome?: string;
  performed_at: string;
  entityLabel?: string;
  performed_by?: number;
}

function entityLabel(entity: FaultyEntity) {
  return (
    entity.entity_name ||
    entity.part_number ||
    `${entity.entity_type} ${entity.entity_id}`
  );
}

function formatActionType(actionType: string) {
  return actionType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildCaseTimelineEvents(
  maintenanceCase: MaintenanceCase | null,
  entities: FaultyEntity[],
  actions: MaintenanceAction[]
): CaseTimelineEvent[] {
  const events: CaseTimelineEvent[] = [];

  if (maintenanceCase) {
    events.push({
      id: `case-${maintenanceCase.id}-opened`,
      title: 'Maintenance Case Opened',
      description: maintenanceCase.description,
      outcome: maintenanceCase.status,
      performed_at: maintenanceCase.reported_at || maintenanceCase.created_at,
    });

    if (maintenanceCase.resolved_at) {
      events.push({
        id: `case-${maintenanceCase.id}-resolved`,
        title: 'Maintenance Case Resolved',
        description: maintenanceCase.resolution_notes,
        outcome: 'resolved',
        performed_at: maintenanceCase.resolved_at,
      });
    }
  }

  for (const entity of entities) {
    const label = entityLabel(entity);

    events.push({
      id: `entity-${entity.id}-identified`,
      title: `Entity Marked ${formatStatus(entity.status)}`,
      description: entity.fault_description || entity.investigation_notes,
      outcome: entity.status,
      performed_at: entity.identified_at || entity.created_at,
      entityLabel: label,
    });

    if (entity.confirmed_at) {
      events.push({
        id: `entity-${entity.id}-confirmed`,
        title: 'Fault Confirmed',
        description: entity.fault_type ? `Fault type: ${entity.fault_type}` : undefined,
        outcome: 'confirmed_faulty',
        performed_at: entity.confirmed_at,
        entityLabel: label,
      });
    }

    if (entity.resolved_at) {
      events.push({
        id: `entity-${entity.id}-resolved`,
        title: 'Entity Resolved',
        description: entity.resolution_type
          ? `Resolution: ${formatStatus(entity.resolution_type)}`
          : undefined,
        outcome: 'resolved',
        performed_at: entity.resolved_at,
        entityLabel: label,
      });
    }
  }

  for (const action of actions) {
    const relatedEntity = entities.find((entity) => entity.id === action.faulty_entity_id);

    events.push({
      id: `action-${action.id}`,
      title: formatActionType(action.action_type),
      description: action.notes,
      outcome: action.outcome,
      performed_at: action.performed_at,
      entityLabel: relatedEntity ? entityLabel(relatedEntity) : undefined,
      performed_by: action.performed_by,
    });
  }

  return events.sort(
    (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  );
}
