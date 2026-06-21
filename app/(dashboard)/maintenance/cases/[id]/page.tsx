'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { maintenanceService } from '@/services/maintenance';
import { MaintenanceCaseSummary } from '@/components/maintenance/maintenance-case-summary';
import { InvestigationTree } from '@/components/maintenance/investigation-tree';
import { MaintenanceFaultyEntitiesTable } from '@/components/maintenance/maintenance-faulty-entities-table';
import { ResolveFaultDialog } from '@/components/maintenance/resolve-fault-dialog';
import { CaseTimeline } from '@/components/maintenance/case-timeline';
import { BulkActionsToolbar } from '@/components/maintenance/bulk-actions-toolbar';
import { EntityDetailSheet } from '@/components/maintenance/entity-detail-sheet';
import { FaultyEntity, MaintenanceCase, FaultyEntityStatus, MaintenanceAction, FaultType, ResolutionType, ActionType, ActionOutcome, CaseStatus } from '@/lib/models';
import { buildInvestigationTree } from '@/lib/maintenance-tree';
import { buildCaseTimelineEvents } from '@/lib/maintenance-timeline';
import {
  getDescendantFaultyEntityIds,
  shouldAutoResolveCase,
} from '@/lib/maintenance-case-status';
import { InspectionPanel } from 'lucide-react';

export default function MaintenanceCaseInvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const caseId = Number(resolvedParams.id);

  const [maintenanceCase, setMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [entities, setEntities] = useState<FaultyEntity[]>([]);
  const [maintenanceActions, setMaintenanceActions] = useState<MaintenanceAction[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeEntity, setActiveEntity] = useState<FaultyEntity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveEntity, setResolveEntity] = useState<FaultyEntity | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const treeNodes = useMemo(() => buildInvestigationTree(entities), [entities]);

  const timelineEventsView = useMemo(
    () => buildCaseTimelineEvents(maintenanceCase, entities, maintenanceActions),
    [maintenanceCase, entities, maintenanceActions]
  );

  const counts = useMemo(() => {
    return entities.reduce(
      (acc, entity) => {
        if (entity.status === 'suspected' || entity.status === 'identified') acc.suspected += 1;
        if (entity.status === 'confirmed_faulty') acc.confirmed += 1;
        if (entity.status === 'healthy') acc.healthy += 1;
        if (entity.status === 'resolved') acc.resolved += 1;
        if (entity.status === 'under_inspection') acc.under_inspection += 1;
        acc.total = acc.suspected + acc.confirmed + acc.healthy + acc.resolved + acc.under_inspection 
        return acc;
      },
      { suspected: 0, confirmed: 0, healthy: 0, resolved: 0, under_inspection:0, total:0 }
    );
  }, [entities]);

  useEffect(() => {
    if (!Number.isFinite(caseId) || caseId <= 0) return;
    loadInvestigationData();
  }, [caseId]);

  const getDescendantEntityIds = (entityId: number, entityList: FaultyEntity[] = entities): number[] =>
    getDescendantFaultyEntityIds(entityId, entityList);

  const reloadCaseState = async () => {
    const [caseRes, entitiesRes] = await Promise.all([
      maintenanceService.getCase(caseId),
      maintenanceService.getFaultyEntitiesByCaseId(caseId),
    ]);

    const updatedEntities = entitiesRes.data || [];

    const timelineRes = await maintenanceService.getCaseTimeline(
      caseId,
      updatedEntities.map((entity) => entity.id)
    );

    setMaintenanceCase(caseRes.data);
    setEntities(updatedEntities);
    setMaintenanceActions(timelineRes.data || []);
    return { caseData: caseRes.data, updatedEntities };
  };

  const tryAutoResolveCase = async (
    updatedEntities: FaultyEntity[],
    currentCase: MaintenanceCase | null = maintenanceCase
  ) => {
    if (!currentCase || !shouldAutoResolveCase(updatedEntities, currentCase.status)) {
      return;
    }

    try {
      const res = await maintenanceService.updateMaintenanceCase(caseId, {
        status: CaseStatus.Resolved,
        resolution_notes: 'All faulty entities resolved or cleared.',
      });
      setMaintenanceCase(res.data);
      toast.success('Maintenance case marked as resolved.');
    } catch (error) {
      console.error('Auto-resolve case failed', error);
      toast.error('Entities resolved, but case status could not be updated.');
    }
  };

  const loadInvestigationData = async () => {
    if (!caseId) return;

    setIsLoading(true);
    setTimelineLoading(true);

    let loadedEntities: FaultyEntity[] = [];

    try {
      const [caseRes, entitiesRes] = await Promise.all([
        maintenanceService.getCase(caseId),
        maintenanceService.getFaultyEntitiesByCaseId(caseId),
      ]);

      loadedEntities = entitiesRes.data || [];
      setMaintenanceCase(caseRes.data);
      setEntities(loadedEntities);
    } catch (error) {
      console.error('Unable to load investigation data', error);
      toast.error('Failed to load maintenance investigation details.');
    } finally {
      setIsLoading(false);
    }

    try {
      const timelineRes = await maintenanceService.getCaseTimeline(
        caseId,
        loadedEntities.map((entity) => entity.id)
      );
      setMaintenanceActions(timelineRes.data || []);
    } catch (error) {
      console.error('Unable to load case timeline', error);
      setMaintenanceActions([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const refresh = async () => {
    await loadInvestigationData();
    setSelectedIds([]);
    setActiveEntity(null);
  };

  const handleToggleSelect = (entityId: number) => {
    setSelectedIds((current) =>
      current.includes(entityId) ? current.filter((id) => id !== entityId) : [...current, entityId]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === entities.length ? [] : entities.map((entity) => entity.id)
    );
  };

  const updateSelectedStatus = async (status: FaultyEntityStatus, notes?: string) => {
    if (selectedIds.length === 0) return;

    const idsToUpdate = status === FaultyEntityStatus.HEALTHY
      ? Array.from(new Set([...selectedIds, ...selectedIds.flatMap((entityId) => getDescendantEntityIds(entityId))]))
      : selectedIds;

    // Validation: Fault Type is required before resolving
    if (status === FaultyEntityStatus.RESOLVED) {
      const missingFaultType = idsToUpdate.filter((id) => {
        const entity = entities.find((e) => e.id === id);
        return !entity?.fault_type;
      });

      if (missingFaultType.length > 0) {
        toast.error(
          `Cannot resolve: ${missingFaultType.length} entity(ies) missing fault type. Please select a fault type before resolving.`
        );
        return;
      }
    }

    if (status === FaultyEntityStatus.HEALTHY) {
      const childCount = idsToUpdate.length - selectedIds.length;
      const confirmed = window.confirm(
        childCount > 0
          ? `Mark ${selectedIds.length} selected parent entity(s) and ${childCount} child entity(s) as healthy?`
          : 'Mark the selected entity(s) as healthy?'
      );

      if (!confirmed) return;
    }

    setActionLoading(true);

    try {
      await maintenanceService.bulkUpdateFaultyEntities(caseId, {
        entity_ids: idsToUpdate,
        status,
        notes,
      });
      toast.success('Selected entities updated successfully.');
      const { caseData, updatedEntities } = await reloadCaseState();
      await tryAutoResolveCase(updatedEntities, caseData);
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk update failed', error);
      toast.error('Unable to update selected entities.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmFaulty = async (entity: FaultyEntity) => {
    setActionLoading(true);
    try {
      await maintenanceService.confirmFaultyEntity(entity.id);
      toast.success('Entity marked as confirmed faulty.');
      await loadInvestigationData();
    } catch (error) {
      console.error('Confirm faulty failed', error);
      toast.error('Unable to confirm faulty entity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkHealthy = async (entity: FaultyEntity) => {
    setActionLoading(true);
    try {
      await maintenanceService.update_faulty_Children(entity.id, {status: FaultyEntityStatus.HEALTHY});
      toast.success('Entitie(s) marked as Healthy.');
      const { caseData, updatedEntities } = await reloadCaseState();
      await tryAutoResolveCase(updatedEntities, caseData);
    } catch (error) {
      console.error('Confirm Healthy failed', error);
      toast.error('Unable to confirm entity as Healthy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFaultTypeChange = async (entityId: number, faultType: string) => {
    try {
      const typedFaultType = faultType as FaultType;
      await maintenanceService.updateFaultyEntity(entityId, { fault_type: typedFaultType });
      setEntities((prev) =>
        prev.map((entity) =>
          entity.id === entityId ? { ...entity, fault_type: typedFaultType } : entity
        )
      );
      toast.success('Fault type updated successfully.');
    } catch (error) {
      console.error('Failed to update fault type', error);
      toast.error('Unable to update fault type.');
    }
  };

  const handleViewEntity = (entity: FaultyEntity) => {
    setActiveEntity(entity);
    setSheetOpen(true);
  };

  const handleOpenResolveDialog = (entity: FaultyEntity) => {
    setResolveEntity(entity);
    setResolveDialogOpen(true);
  };

  const handleResolveFault = async (
    resolutionType: ResolutionType,
    replacementPartNumber?: string,
    notes?: string
  ) => {
    if (!resolveEntity) return;
    if (resolveEntity.status === FaultyEntityStatus.CONFIRMED_FAULTY && !resolveEntity.fault_type) {
      toast.error('Cannot resolve a confirmed faulty entity without a fault type.');
      return;
    }

    setResolveLoading(true);

    try {
      const descendantIds = getDescendantEntityIds(resolveEntity.id).filter(
        (id) => id !== resolveEntity.id
      );
      const cascadeIds = descendantIds.filter((id) => {
        const entity = entities.find((e) => e.id === id);
        return entity && entity.status !== FaultyEntityStatus.RESOLVED;
      });

      const changes: Partial<FaultyEntity> = {
        status: FaultyEntityStatus.RESOLVED,
        resolution_type: resolutionType,
      };

      if (replacementPartNumber) {
        changes.part_number = replacementPartNumber;
      }

      await maintenanceService.updateFaultyEntity(resolveEntity.id, changes);

      if (replacementPartNumber) {
        await maintenanceService.updateEntityPartNumber(
          resolveEntity.entity_type,
          resolveEntity.entity_id,
          replacementPartNumber
        );
      }

      if (cascadeIds.length > 0) {
        const missingFaultType = cascadeIds.filter((id) => {
          const entity = entities.find((e) => e.id === id);
          return entity?.status === FaultyEntityStatus.CONFIRMED_FAULTY && !entity.fault_type;
        });

        if (missingFaultType.length > 0) {
          toast.error(
            `${missingFaultType.length} child entity(ies) still need a fault type before the case can fully close.`
          );
        } else {
          await maintenanceService.bulkUpdateFaultyEntities(caseId, {
            entity_ids: cascadeIds,
            status: FaultyEntityStatus.RESOLVED,
            notes:
              notes ||
              `Cascaded resolution from ${resolveEntity.entity_name || resolveEntity.part_number || 'parent entity'}`,
          });
        }
      }

      const actionType =
        resolutionType === ResolutionType.REPAIRED
          ? ActionType.Repair
          : resolutionType === ResolutionType.REPLACED
          ? ActionType.Replacement
          : resolutionType === ResolutionType.NO_FAULT_FOUND
          ? ActionType.Testing
          : resolutionType === ResolutionType.DECOMMISSIONED
          ? ActionType.Disassembly
          : ActionType.Inspection;

      await maintenanceService.createMaintenanceAction({
        faulty_entity_id: resolveEntity.id,
        action_type: actionType,
        outcome: ActionOutcome.Pass,
        replacement_entity_type:resolveEntity.entity_type,
        replacement_entity_id:resolveEntity.entity_id,
        notes: notes ||
          `Resolved via ${resolutionType}${replacementPartNumber ? `, replacement part ${replacementPartNumber}` : ''}`,
        performed_at: new Date().toISOString(),
      });

      toast.success('Fault resolved successfully.');
      setResolveDialogOpen(false);
      setResolveEntity(null);

      const { caseData, updatedEntities } = await reloadCaseState();
      await tryAutoResolveCase(updatedEntities, caseData);
    } catch (error) {
      console.error('Resolve fault failed', error);
      toast.error('Unable to resolve faulty entity.');
    } finally {
      setResolveLoading(false);
    }
  };

  if (!Number.isFinite(caseId) || caseId <= 0) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        Invalid maintenance case ID.
      </div>
    );
  }

  return (
    <div className="space-y-8 ">
      <div className="flex flex-col gap sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link href="/maintenance" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to maintenance cases
          </Link>
          <div className='pt-4 flex flex-col w-4xl '>
            <div className='flex px-1  items-center w-2xl h-10'>
              <InspectionPanel  className=' w-1/12 h-full'/>
              <h1 className="text-2xl font-bold tracking-tight  w-11/12 h-full">Maintenance Case Investigation</h1>
            </div>
            <p className="pl-16 text-sm text-muted-foreground ">
              Inspect suspected or confirmed faulty entities and manage the investigation lifecycle for this case.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={refresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* <Separator /> */}

      {maintenanceCase ? (
        
        <MaintenanceCaseSummary maintenanceCase={maintenanceCase} counts={counts} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">Loading maintenance case details...</div>
      )}

      <Separator />

      <div className="space-y-6">
        <Tabs defaultValue="tree">
          <TabsList>
            <TabsTrigger value="tree">Investigation Tree</TabsTrigger>
            <TabsTrigger value="entities">Faulty Entities</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
            <TabsContent value="tree">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the hierarchy tree to inspect entity relationships and confirm whether a specific part is faulty.
                </p>
                <InvestigationTree
                  nodes={treeNodes}
                  caseStatus={maintenanceCase?.status}
                  onSelect={(node) => {
                    const selected = entities.find((entity) => entity.id === node.id);
                    if (selected) {
                      handleViewEntity(selected);
                    }
                  }}
                  onMarkHealthy={(node) => {
                    const selected = entities.find((entity) => entity.id === node.id);
                    if (selected) {
                      handleMarkHealthy(selected);
                    }
                  }}
                  onFaultTypeChange={handleFaultTypeChange}
                />
              </div>
            </TabsContent>
            <TabsContent value="entities">
              <div className="space-y-4">
                <MaintenanceFaultyEntitiesTable
                  entities={entities}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onView={handleViewEntity}
                  onConfirmFaulty={handleConfirmFaulty}
                  onMarkHealthy={handleMarkHealthy}
                  onResolve={handleOpenResolveDialog}
                  isLoading={isLoading}
                />
                <BulkActionsToolbar
                  selectedCount={selectedIds.length}
                  isLoading={actionLoading}
                  onConfirmFaulty={() => updateSelectedStatus(FaultyEntityStatus.CONFIRMED_FAULTY, 'Bulk confirmed during investigation')}
                  onMarkHealthy={() => updateSelectedStatus(FaultyEntityStatus.HEALTHY, 'Bulk marked healthy during investigation')}
                  onSetUnderInspection={() => updateSelectedStatus(FaultyEntityStatus.UNDER_INSPECTION, 'Bulk set under inspection')}
                  onResolve={() => updateSelectedStatus(FaultyEntityStatus.RESOLVED, 'Bulk resolved during investigation')}
                  onRemoveFalsePositive={() => updateSelectedStatus(FaultyEntityStatus.FALSEPOSITIVE, 'Bulk marked false positive')}
                />
              </div>
            </TabsContent>
            <TabsContent value="timeline">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Review investigation actions and outcomes recorded against this case.</p>
                <CaseTimeline events={timelineEventsView} isLoading={timelineLoading} />
              </div>
            </TabsContent>
        </Tabs>
      </div>

      <EntityDetailSheet
        entity={activeEntity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onConfirmFaulty={() => activeEntity && handleConfirmFaulty(activeEntity)}
        onMarkHealthy={() => activeEntity && handleMarkHealthy(activeEntity)}
        onResolve={() => activeEntity && handleOpenResolveDialog(activeEntity)}
        onFaultTypeChange={(faultType) => activeEntity && handleFaultTypeChange(activeEntity.id, faultType)}
      />

      <ResolveFaultDialog
        entity={resolveEntity}
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        onResolve={handleResolveFault}
        isProcessing={resolveLoading}
      />
    </div>
  );
}
