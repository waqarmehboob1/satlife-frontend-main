'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Layers } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { StatusBadge } from '@/components/status-badge';
import { EntityCards } from '@/components/entity-cards';
import { EntityForm } from '@/components/entity-form';
import { useState,useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import * as api from '@/lib/api';
import { fetchStatusesByType } from '@/lib/api';
import * as Models from '@/lib/models';
import { resolveStatusName } from '@/lib/entity-status';

export default function SystemDetailPage() {
  const params = useParams();
  const systemId = params.id as string;
  const { systems, projects,loading, subsystems, createSubsystem, deleteSubsystem, statuses: storeStatuses } = useDataStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const system = systems.find((s) => String(s.id) === systemId);
  const project = system ? projects.find((p) => p.id === system.project_id) : null;
  const systemSubsystems = system ? subsystems.filter((sub) => sub.system_id === system.id) : [];
  const [statuses, setStatuses] = useState<Models.Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [systemHierarchyNames, setSystemHierarchyNames] = useState<Models.Hierarchy[]>([]);
  const [subsystemHierarchyNames, setSubsystemHierarchyNames] = useState<Models.Hierarchy[]>([]);
  const subsystemFormFields = [
    {
      name: 'name',
      label: 'Subsystem Name',
      type: 'select' as const,
      required: true,
      options: subsystemHierarchyNames.map((hierarchy) => ({ label: hierarchy.name, value: hierarchy.name })),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter subsystem description',
    },
    {
      name: 'partnumber',
      label: 'Part #',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter Part Number of SubSystem',
    },
    {
      name: 'id',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: statuses.map(s => ({ label: s.status_name, value: s.id })),
    },
    
  ];

  async function handleAddSubsystem(formData: Record<string, any>) {
    if (!system) {
      toast.error('System not found');
      return;
    }
    setIsSubmitting(true);
    try {
      await createSubsystem({
        name: formData.name,
        description: formData.description || '',
        system_id: system.id,
        status_id: Number(formData.id),
        part_number: formData.partnumber,
        serial_number: formData.name && formData.partnumber
                        ? `${formData.name}-${formData.partnumber}`
                        : formData.name || formData.partnumber || "",
        configuration_item: formData.partnumber || formData.name,
      });
      setIsAddOpen(false);
      toast.success('Subsystem added successfully');
    } catch (error) {
      console.error('[v0] Subsystem creation error:', error);
      let errorMessage = 'Failed to add subsystem';
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSubsystem(id: number) {
    try {
      await deleteSubsystem(id);
      toast.success('Subsystem deleted successfully');
    } catch {
      toast.error('Failed to delete subsystem');
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusResult, hierarchyResult] = await Promise.allSettled([
          fetchStatusesByType('subsystems'),
          api.hierarchies.list('system'),
        ]);

        if (statusResult.status === 'fulfilled') {
          setStatuses(statusResult.value);
        }

        if (hierarchyResult.status === 'fulfilled') {
          setSystemHierarchyNames(hierarchyResult.value.data);

          if (system) {
            const parentHierarchyId = hierarchyResult.value.data.find(
              (hierarchy) => hierarchy.name === system.name
            )?.id;

            if (parentHierarchyId) {
              try {
                const childRes = await api.hierarchies.list('subsystem', parentHierarchyId);
                setSubsystemHierarchyNames(childRes.data);
              } catch (childError) {
                console.error('Failed to fetch subsystem hierarchy names', childError);
                setSubsystemHierarchyNames([]);
              }
            } else {
              setSubsystemHierarchyNames([]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch statuses or hierarchy names', err);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchData();
  }, [system]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!system) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">System Not Found</h2>
        <Link href="/systems" className="mt-2 text-sm text-primary underline">
          Back to Systems
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/systems">Systems</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{system.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href="/systems">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{system.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{system.description}</p>
        </div>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="text-sm font-medium">{project?.name || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={resolveStatusName(system, storeStatuses.length ? storeStatuses : statuses)} />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subsystems</p>
              <p className="text-sm font-medium">{systemSubsystems.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subsystems Cards */}
      <EntityCards
        title="Subsystems"
        description={`Manage subsystems for ${system.name}`}
        entities={systemSubsystems}
        statuses={storeStatuses.length ? storeStatuses : statuses}
        onAdd={() => setIsAddOpen(true)}
        onDelete={handleDeleteSubsystem}
        detailPath={(id) => `/subsystems/${id}`}
        addButtonLabel="Add Subsystem"
        emptyMessage="No subsystems yet. Click 'Add Subsystem' to create one."
      />

      {/* Add Subsystem Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subsystem</DialogTitle>
            <DialogDescription>Create a new subsystem for {system.name}</DialogDescription>
          </DialogHeader>
          <EntityForm
            fields={subsystemFormFields}
            onSubmit={handleAddSubsystem}
            isLoading={isSubmitting}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
