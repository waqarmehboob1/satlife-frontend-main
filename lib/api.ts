import axios from "axios";
import type * as Models from "./models";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Authentication
export const auth = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>("/auth/login", { username, password }),
  listRoles: () => api.get("/auth/roles"),
  getMe: () => api.get("/auth/me"),
  register: (userData: any) => api.post("/auth/register", userData),
  getRole: (id: number) => api.get(`/auth/roles/${id}`),
  assignRole: (userId: number, roleId: number) =>
    api.post("/auth/assign-role", { user_id: userId, role_id: roleId }),
  removeRole: (userId: number, roleId: number) =>
    api.delete("/auth/remove-role", { data: { user_id: userId, role_id: roleId } }),
  deregister: (userId: number) => api.delete(`/auth/deregister/${userId}`),
};

// Users
export const users = {
  list: (skip = 0, limit = 100) => api.get<Models.User[]>("/users/", { params: { skip, limit } }),
  usersWithRoles: () => api.get("/users/with-roles"),
  get: (id: number) => api.get<Models.User>(`/users/${id}/`),
  create: (data: Partial<Models.User>) => api.post<Models.User>("/users/", data),
  update: (id: number, data: Partial<Models.User>) => api.put<Models.User>(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
};

// Customers
export const customers = {
  list: (skip = 0, limit = 100) => api.get<Models.Customer[]>("/customers/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Customer>(`/customers/${id}/`),
  create: (data: Partial<Models.Customer>) => api.post<Models.Customer>("/customers/", data),
  update: (id: number, data: Partial<Models.Customer>) => api.put<Models.Customer>(`/customers/${id}/`, data),
  delete: (id: number) => api.delete(`/customers/${id}/`),
};

// Orders
export const orders = {
  list: (skip = 0, limit = 100) => api.get<Models.Order[]>("/orders/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Order>(`/orders/${id}/`),
  create: (data: Partial<Models.Order>) => api.post<Models.Order>("/orders/", data),
  update: (id: number, data: Partial<Models.Order>) => api.put<Models.Order>(`/orders/${id}/`, data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
};

// Projects
export const projects = {
  list: (skip = 0, limit = 100) => api.get<Models.Project[]>("/projects/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Project>(`/projects/${id}/`),
  create: (data: Partial<Models.Project>) => api.post<Models.Project>("/projects/", data),
  update: (id: number, data: Partial<Models.Project>) => api.put<Models.Project>(`/projects/${id}/`, data),
  delete: (id: number) => api.delete(`/projects/${id}/`),
  getSystems: (id: number) => api.get<Models.System[]>(`/projects/${id}/systems/`),
};

// Systems
export const systems = {
  list: (skip = 0, limit = 100) => api.get<Models.System[]>("/systems/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.System>(`/systems/${id}/`),
  create: (data: Partial<Models.System>) => api.post<Models.System>("/systems/", data),
  update: (id: number, data: Partial<Models.System>) => api.put<Models.System>(`/systems/${id}/`, data),
  delete: (id: number) => api.delete(`/systems/${id}/`),
  getSubsystems: (id: number) => api.get<Models.Subsystem[]>(`/systems/${id}/subsystems/`),
};

// Subsystems
export const subsystems = {
  list: (skip = 0, limit = 100) => api.get<Models.Subsystem[]>("/subsystems/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Subsystem>(`/subsystems/${id}/`),
  create: (data: Partial<Models.Subsystem>) => api.post<Models.Subsystem>("/subsystems/", data),
  update: (id: number, data: Partial<Models.Subsystem>) => api.put<Models.Subsystem>(`/subsystems/${id}/`, data),
  delete: (id: number) => api.delete(`/subsystems/${id}/`),
  getModules: (id: number) => api.get<Models.Module[]>(`/subsystems/${id}/modules/`),
};

// Modules
export const modules = {
  list: (skip = 0, limit = 100) => api.get<Models.Module[]>("/modules/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Module>(`/modules/${id}/`),
  create: (data: Partial<Models.Module>) => api.post<Models.Module>("/modules/", data),
  update: (id: number, data: Partial<Models.Module>) => api.put<Models.Module>(`/modules/${id}/`, data),
  delete: (id: number) => api.delete(`/modules/${id}/`),
  getUnits: (id: number) => api.get<Models.Unit[]>(`/modules/${id}/units/`),
};

// Units
export const units = {
  list: (skip = 0, limit = 100) => api.get<Models.Unit[]>("/units/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Unit>(`/units/${id}/`),
  create: (data: Partial<Models.Unit>) => api.post<Models.Unit>("/units/", data),
  update: (id: number, data: Partial<Models.Unit>) => api.put<Models.Unit>(`/units/${id}/`, data),
  delete: (id: number) => api.delete(`/units/${id}/`),
  getComponents: (id: number) => api.get<Models.Component[]>(`/units/${id}/components/`),
};

// Components
export const components = {
  list: (skip = 0, limit = 100) => api.get<Models.Component[]>("/components/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Component>(`/components/${id}/`),
  create: (data: Partial<Models.Component>) => api.post<Models.Component>("/components/", data),
  update: (id: number, data: Partial<Models.Component>) => api.put<Models.Component>(`/components/${id}/`, data),
  delete: (id: number) => api.delete(`/components/${id}/`),
};

// Hierarchies
export const hierarchies = {
  list: (hierarchy_type?: string, parent_id?: number) =>
    api.get<Models.Hierarchy[]>("/hierarchies/", {
      params: { hierarchy_type, parent_id },
    }),
  get: (id: number) => api.get<Models.Hierarchy>(`/hierarchies/${id}/`),
  create: (data: Partial<Models.Hierarchy>) => api.post<Models.Hierarchy>("/hierarchies/", data),
  update: (id: number, data: Partial<Models.Hierarchy>) => api.put<Models.Hierarchy>(`/hierarchies/${id}/`, data),
  delete: (id: number) => api.delete(`/hierarchies/${id}/`),
};

// Inventory
export const inventory = {
  list: (skip = 0, limit = 100) => api.get<Models.Inventory[]>("/inventory/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Inventory>(`/inventory/${id}/`),
  create: (data: Partial<Models.Inventory>) => api.post<Models.Inventory>("/inventory/", data),
  update: (id: number, data: Partial<Models.Inventory>) => api.put<Models.Inventory>(`/inventory/${id}/`, data),
  delete: (id: number) => api.delete(`/inventory/${id}/`),
};

// Statuses
export const statuses = {
  list: (status_type?: string) =>
    api.get<Models.Status[]>("/statuses/", {
      params: { status_type },
    }),
  get: (id: number) => api.get<Models.Status>(`/statuses/${id}/`),
  create: (data: Partial<Models.Status>) => api.post<Models.Status>("/statuses/", data),
  update: (id: number, data: Partial<Models.Status>) => api.put<Models.Status>(`/statuses/${id}/`, data),
  delete: (id: number) => api.delete(`/statuses/${id}/`),
};

// Entities
export const entities = {
  list: (skip = 0, limit = 100) => api.get<Models.Entity[]>("/entities/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.Entity>(`/entities/${id}/`),
  getStatusHistory: (id: number) => api.get<Models.EntityStatusHistory[]>(`/entities/${id}/status-history/`),
  getMaintenanceLogs: (id: number) => api.get<Models.MaintenanceLog[]>(`/entities/${id}/maintenanceLogs-logs/`),
  partNumber: () => api.get<string[]>("/part-numbers/"),
};

// Entity Status History
export const entityStatusHistory = {
  list: (skip = 0, limit = 100) =>
    api.get<Models.EntityStatusHistory[]>("/entity-status-history/", { params: { skip, limit } }),
  get: (id: number) => api.get<Models.EntityStatusHistory>(`/entity-status-history/${id}/`),
  create: (data: Partial<Models.EntityStatusHistory>) => api.post<Models.EntityStatusHistory>("/entity-status-history/", data),
};

// maintenanceLogs Logs
export const maintenanceLogs = {
  list: (skip = 0, limit = 100) => api.get<Models.MaintenanceLog[]>('/maintenanceLogs-logs/', { params: { skip, limit } }),
  get: (id: number) => api.get<Models.MaintenanceLog>(`/maintenanceLogs-logs/${id}/`),
  create: (data: Partial<Models.MaintenanceLog>) => api.post<Models.MaintenanceLog>('/maintenanceLogs-logs/', data),
  update: (id: number, data: Partial<Models.MaintenanceLog>) => api.put<Models.MaintenanceLog>(`/maintenanceLogs-logs/${id}/`, data),
  delete: (id: number) => api.delete(`/maintenanceLogs-logs/${id}/`),
};

// Maintenance Cases
export const maintenanceCases = {
  list: (skip = 0, limit = 100) => api.get<Models.MaintenanceCase[]>('/maintenance-cases/', { params: { skip, limit } }),
  get: (id: number) => api.get<Models.MaintenanceCase>(`/maintenance-cases/${id}/`),
  create: (data: Models.CreateMaintenanceCasePayload) => api.post<Models.MaintenanceCase>('/maintenance-cases/', data),
  update: (id: number, data: Models.UpdateMaintenanceCasePayload) => api.put<Models.MaintenanceCase>(`/maintenance-cases/${id}/`, data),
  delete: (id: number) => api.delete(`/maintenance-cases/${id}/`),
  lookupEntityByPartNumber: (partNumber: string) => api.get<Models.lookUpResponse>(`/entities/lookup-by-PN/${encodeURIComponent(partNumber)}/`),
  suspectChildren: (caseId: number, data: Models.SuspectChildrenPayload) => api.post(`/maintenance-cases/${caseId}/suspect-children/`, data),
  confirmFault: (caseId: number, data: Models.ConfirmFaultPayload) => api.post(`/maintenance-cases/${caseId}/confirm-fault/`, data),
};

// Faulty Entities
export const faultyEntities = {
  list: (skip = 0, limit = 100) => api.get<Models.FaultyEntity[]>('/faulty-entities/', { params: { skip, limit } }),
  listByCaseId: (caseId: number, skip = 0, limit = 100) => api.get<Models.FaultyEntity[]>(`/maintenance-cases/${caseId}/faulty-entities/`, { params: { skip, limit } }),
  get: (id: number) =>    api.get<Models.FaultyEntity>(`/faulty-entities/${id}/`),
  create: (data: Models.CreateFaultyEntityPayload) =>    api.post<Models.FaultyEntity>('/faulty-entities/', data),
  update: (id: number, data: Models.UpdateFaultyEntityPayload) =>    api.put<Models.FaultyEntity>(`/faulty-entities/${id}/`, data),
  updateChildren: (id: number, data: Models.UpdateFaultyEntityPayload) =>    api.put<Models.FaultyEntity>(`/faulty-entities-Children/${id}/`, data),
  delete: (id: number) =>    api.delete(`/faulty-entities/${id}/`),
  cascadeFault: (entityId: number, faultType: string) =>    api.post(`/faulty-entities/${entityId}/cascade-fault/`, { fault_type: faultType }),
  getMaintenanceHistory: (entityId: number) =>    api.get<Models.MaintenanceAction[]>(`/faulty-entities/${entityId}/history/`),
};

// Maintenance Actions
export const maintenanceActions = {
  list: (skip = 0, limit = 100) =>    api.get<Models.MaintenanceAction[]>('/maintenance-actions/', { params: { skip, limit } }),
  listByFaultyEntityId: (faultyEntityId: number, skip = 0, limit = 100) =>    api.get<Models.MaintenanceAction[]>(`/faulty-entities/${faultyEntityId}/actions/`, { params: { skip, limit } }),
  get: (id: number) =>    api.get<Models.MaintenanceAction>(`/maintenance-actions/${id}/`),
  create: (data: Models.CreateMaintenanceActionPayload) =>    api.post<Models.MaintenanceAction>('/maintenance-actions/', data),
  update: (id: number, data: Models.UpdateMaintenanceActionPayload) =>    api.put<Models.MaintenanceAction>(`/maintenance-actions/${id}/`, data),
  delete: (id: number) =>    api.delete(`/maintenance-actions/${id}/`),
};

// Maintenance Deliveries
export const maintenanceDeliveries = {
  list: (skip = 0, limit = 100) =>    api.get<Models.MaintenanceDelivery[]>('/maintenance-deliveries/', { params: { skip, limit } }),
  listByCaseId: (caseId: number, skip = 0, limit = 100) =>    api.get<Models.MaintenanceDelivery[]>(`/maintenance-cases/${caseId}/deliveries/`, { params: { skip, limit } }),
  get: (id: number) =>    api.get<Models.MaintenanceDelivery>(`/maintenance-deliveries/${id}/`),
  create: (data: Models.CreateMaintenanceDeliveryPayload) =>    api.post<Models.MaintenanceDelivery>('/maintenance-deliveries/', data),
  update: (id: number, data: Models.UpdateMaintenanceDeliveryPayload) =>    api.put<Models.MaintenanceDelivery>(`/maintenance-deliveries/${id}/`, data),
  confirm: (id: number, receivedBy: string) =>    api.post(`/maintenance-deliveries/${id}/confirm/`, { received_by: receivedBy }),
  delete: (id: number) =>    api.delete(`/maintenance-deliveries/${id}/`),
};

export default api;
