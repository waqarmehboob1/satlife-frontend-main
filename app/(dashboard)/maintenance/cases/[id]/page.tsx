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
import { CaseTimeline } from '@/components/maintenance/case-timeline';
import { BulkActionsToolbar } from '@/components/maintenance/bulk-actions-toolbar';
import { EntityDetailSheet } from '@/components/maintenance/entity-detail-sheet';
import { FaultyEntity, MaintenanceCase, FaultyEntityStatus, MaintenanceAction } from '@/lib/models';
import { InspectionPanel } from 'lucide-react';

const buildTreeNodes = (entities: FaultyEntity[]) =>
  entities.map((entity) => ({
    id: entity.id,
    part_number: entity.part_number || entity.entity_name || `${entity.entity_type}-${entity.entity_id}`,
    display_name: entity.entity_name || entity.part_number || `${entity.entity_type} ${entity.entity_id}`,
    status: entity.status,
    children: [],
  }));

export default function MaintenanceCaseInvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const caseId = Number(resolvedParams.id);

  const [maintenanceCase, setMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [entities, setEntities] = useState<FaultyEntity[]>([]);
  const [timeline, setTimeline] = useState<MaintenanceAction[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeEntity, setActiveEntity] = useState<FaultyEntity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const getDescendantEntityIds = (entityId: number, entityList: FaultyEntity[] = entities): number[] => {
    const children = entityList.filter((entity) => entity.parent_faulty_entity_id === entityId);

    return children.flatMap((child) => [child.id, ...getDescendantEntityIds(child.id, entityList)]);
  };

  const loadInvestigationData = async () => {
    if (!caseId) return;

    setIsLoading(true);
    try {
      const [caseRes, entitiesRes, timelineRes] = await Promise.all([
        maintenanceService.getCase(caseId),
        maintenanceService.getFaultyEntitiesByCaseId(caseId),
        maintenanceService.getFaultyEntitiesByCaseId(caseId),
        // maintenanceService.getCaseTimeline(caseId),
      ]);
      // console.log("Maintenance case Detail", caseRes.data);
      // console.log("Maintenance case FaultyENtities", entitiesRes.data);
      // console.log("Maintenance case Timeline", timelineRes.data);

      setMaintenanceCase(caseRes.data);
      setEntities(entitiesRes.data || []);
      // setTimeline(timelineRes.data || []);
    } catch (error) {
      console.error('Unable to load investigation data', error);
      toast.error('Failed to load maintenance investigation details.');
    } finally {
      setIsLoading(false);
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
      await loadInvestigationData();
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
      await loadInvestigationData();
    } catch (error) {
      console.error('Confirm Healthy failed', error);
      toast.error('Unable to confirm entity as Healthy.');
    } finally {
      setActionLoading(false);
    }
  };

  // const handleMarkHealthy = async (entity: FaultyEntity) => {
  //   const descendantIds = getDescendantEntityIds(entity.id);
  //         console.log("entity.id",entity.id)
  //         console.log("descendantIds",descendantIds)
  //   const totalEntities = [entity.id, ...descendantIds].length;
  //         console.log("totalEntities",totalEntities)

  //   const confirmed = window.confirm(
  //     descendantIds.length > 0
  //       ? `Mark this parent entity and ${descendantIds.length} child entity(s) as healthy?`
  //       : 'Mark this entity as healthy?'
  //   );

  //   if (!confirmed) return;

  //   setActionLoading(true);
  //   try {
  //     const targets = [entity.id, ...descendantIds];
  //     console.log("targets",targets)

  //     const results = await Promise.allSettled(targets.map((entityId) => maintenanceService.markEntityHealthy(entityId)));
  //     console.log("results",results)

  //     if (results.some((result) => result.status === 'rejected')) {
  //       throw new Error('One or more healthy updates failed.');
  //     }

  //     toast.success(
  //       totalEntities > 1
  //         ? `Marked ${totalEntities} entity(s), including all child nodes, as healthy.`
  //         : 'Entity marked as healthy.'
  //     );
  //     await loadInvestigationData();
  //   } catch (error) {
  //     console.error('Mark healthy failed', error);
  //     toast.error('Unable to mark the selected entity and its child nodes healthy.');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleViewEntity = (entity: FaultyEntity) => {
    setActiveEntity(entity);
    setSheetOpen(true);
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
                nodes={buildTreeNodes(entities)}
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
              <CaseTimeline logs={timeline} />
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
      />
    </div>
  );
}
