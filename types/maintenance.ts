// Maintenance Management Types

// Enums
export enum CaseStatus {
  Open = 'open',
  UnderInspection = 'under_inspection',
  UnderRepair = 'under_repair',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum FaultType {
  Electrical = 'electrical',
  Mechanical = 'mechanical',
  Software = 'software',
  Environmental = 'environmental',
  Other = 'other',
}

export enum FaultyEntityStatus {
  Identified = 'identified',
  ConfirmedFaulty = 'confirmed_faulty',
  NoFaultFound = 'no_fault_found',
  Resolved = 'resolved',
}

export enum ResolutionType {
  Repair = 'repair',
  Replacement = 'replacement',
  Adjustment = 'adjustment',
  Cleaning = 'cleaning',
  Other = 'other',
}

export enum ActionType {
  Inspection = 'inspection',
  Disassembly = 'disassembly',
  Repair = 'repair',
  Replacement = 'replacement',
  Testing = 'testing',
  Cleaning = 'cleaning',
  Recalibration = 'recalibration',
}

export enum ActionOutcome {
  Pass = 'pass',
  Fail = 'fail',
  Pending = 'pending',
  Inconclusive = 'inconclusive',
}

export enum DeliveryType {
  Parts = 'parts',
  Equipment = 'equipment',
  Components = 'components',
  Other = 'other',
}

export enum DeliveryStatus {
  Dispatched = 'dispatched',
  Delivered = 'delivered',
  ConfirmedByCustomer = 'confirmed_by_customer',
}

export enum EntityType {
  System = 'system',
  Subsystem = 'subsystem',
  Module = 'module',
  Unit = 'unit',
  Component = 'component',
}

// Maintenance Case
export interface MaintenanceCase {
  id: number;
  case_number: string;
  project_id: number;
  description: string;
  status: CaseStatus;
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  project?: any;
}

// Faulty Entity
export interface FaultyEntity {
  id: number;
  case_id: number;
  entity_type: EntityType;
  entity_id: number;
  fault_type: FaultType;
  status: FaultyEntityStatus;
  identified_at: string;
  confirmed_at?: string;
  resolution_type?: ResolutionType;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  case?: MaintenanceCase;
}

// Maintenance Action
export interface MaintenanceAction {
  id: number;
  faulty_entity_id: number;
  action_type: ActionType;
  outcome: ActionOutcome;
  notes?: string;
  performed_by?: number;
  performed_at: string;
  created_at: string;
  updated_at: string;
  faulty_entity?: FaultyEntity;
}

// Maintenance Delivery
export interface MaintenanceDelivery {
  id: number;
  case_id: number;
  delivery_type: DeliveryType;
  status: DeliveryStatus;
  delivered_at?: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
  case?: MaintenanceCase;
}

// Request/Response Payloads
export interface CreateMaintenanceCasePayload {
  project_id: number;
  description: string;
  status: CaseStatus;
}

export interface UpdateMaintenanceCasePayload {
  status?: CaseStatus;
  resolution_notes?: string;
}

export interface CreateFaultyEntityPayload {
  case_id: number;
  entity_type: EntityType;
  entity_id: number;
  fault_type: FaultType;
}

export interface UpdateFaultyEntityPayload {
  status?: FaultyEntityStatus;
  resolution_type?: ResolutionType;
}

export interface CreateMaintenanceActionPayload {
  faulty_entity_id: number;
  action_type: ActionType;
  outcome: ActionOutcome;
  notes?: string;
  performed_by?: number;
}

export interface UpdateMaintenanceActionPayload {
  outcome?: ActionOutcome;
  notes?: string;
}

export interface CreateMaintenanceDeliveryPayload {
  case_id: number;
  delivery_type: DeliveryType;
}

export interface UpdateMaintenanceDeliveryPayload {
  status?: DeliveryStatus;
  delivered_at?: string;
  received_by?: string;
}

export interface EntityLookupNode {
  entity_type: string;
  entity_id: number;
  label: string;
  depth?: number;
  children?: EntityLookupNode[];
}

export interface EntityLookupResponse {
  matched_entity_type: string;
  matched_entity_id: number;
  matched_label: string;
  ancestors: EntityLookupNode[];
  descendants: EntityLookupNode[];
  project_id: number;
  project_name: string;
  order_id: number;
  order_ref: string;
  customer_id: number;
  customer_name: string;
}

export interface SuspectChildrenPayload {
  reported_entity_type: string;
  reported_entity_id: number;
  fault_type: string;
  fault_description?: string;
}

export interface ConfirmFaultPayload {
  confirmed_entity_type: string;
  confirmed_entity_id: number;
  fault_type: string;
  fault_description: string;
  parent_faulty_entity_id: number;
}

// API Response types
export interface MaintenanceCaseResponse {
  data: MaintenanceCase | MaintenanceCase[];
  error?: string;
}

export interface FaultyEntityResponse {
  data: FaultyEntity | FaultyEntity[];
  error?: string;
}

export interface MaintenanceActionResponse {
  data: MaintenanceAction | MaintenanceAction[];
  error?: string;
}

export interface MaintenanceDeliveryResponse {
  data: MaintenanceDelivery | MaintenanceDelivery[];
  error?: string;
}
