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
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as Models from '@/lib/models';
import * as api from '@/lib/api';

export default function SubsystemDetailPage() {
  const params = useParams();
  const subsystemId = params.id as string;
  const { subsystems, loading, systems, modules, createModule, deleteModule } = useDataStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const subsystem = subsystems.find((s) => String(s.id) === subsystemId);
  const system = subsystem ? systems.find((s) => s.id === subsystem.system_id) : null;
  const subsystemModules = subsystem ? modules.filter((m) => m.subsystem_id === subsystem.id) : [];
  const [statuses, setStatuses] = useState<Models.Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [subsystemHierarchyNames, setSubsystemHierarchyNames] = useState<Models.Hierarchy[]>([]);
  const [moduleHierarchyNames, setModuleHierarchyNames] = useState<Models.Hierarchy[]>([]);
  const moduleFormFields = [
    {
      name: 'name',
      label: 'Module Name',
      type: 'select' as const,
      required: true,
      options: moduleHierarchyNames.map((hierarchy) => ({ label: hierarchy.name, value: hierarchy.name })),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter module description',
    },
    {
      name: 'partnumber',
      label: 'Part #',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter Part Number of Module',
    },
    {
      name: 'id',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: statuses.map(s => ({ label: s.status_name, value: s.id })),
    },
  ];

  async function handleAddModule(formData: Record<string, any>) {
    if (!subsystem) {
      toast.error('Subsystem not found');
      return;
    }
    setIsSubmitting(true);
    try {
      await createModule({
        name: formData.name,
        description: formData.description || '',
        subsystem_id: subsystem.id,
        status_id: Number(formData.id),
        part_number:formData.partnumber,
        serial_number: formData.name && formData.partnumber
                        ? `${formData.name}-${formData.partnumber}`
                        : formData.name || formData.partnumber || ""
      });
      setIsAddOpen(false);
      toast.success('Module added successfully');
    } catch (error) {
      console.error('Module creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add module';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteModule(id: number) {
    try {
      await deleteModule(id);
      toast.success('Module deleted successfully');
    } catch {
      toast.error('Failed to delete module');
    }
  }

  if (!subsystem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Subsystem Not Found</h2>
        <Link href="/subsystems" className="mt-2 text-sm text-primary underline">
          Back to Subsystems
        </Link>
      </div>
    );
  }
 useEffect(() => {
      const fetchData = async () => {
        try {
          const [statusRes, subsystemHierarchyRes] = await Promise.all([
            api.statuses.list("modules"),
            api.hierarchies.list("subsystem"),
          ]);
          setStatuses(statusRes.data);
          setSubsystemHierarchyNames(subsystemHierarchyRes.data);

          if (subsystem) {
            const parentHierarchyId = subsystemHierarchyRes.data.find(
              (hierarchy) => hierarchy.name === subsystem.name
            )?.id;

            if (parentHierarchyId) {
              const childRes = await api.hierarchies.list("module", parentHierarchyId);
              setModuleHierarchyNames(childRes.data);
            } else {
              setModuleHierarchyNames([]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch statuses or hierarchy names", err);
        } finally {
          setLoadingStatuses(false);
        }
      };

      fetchData();
    }, [subsystem]);
  if (loading) return <div className="p-8 text-center">Loading...</div>;

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
            <BreadcrumbLink asChild>
              <Link href={`/systems/${system?.id}`}>{system?.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subsystem.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href="/subsystems">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{subsystem.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subsystem.description}</p>
        </div>
      </div>

      {/* Subsystem Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">System</p>
              <p className="text-sm font-medium">{system?.name || 'N/A'}</p>
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
              <StatusBadge status={subsystem.status?.status_name || 'Unknown'} />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modules</p>
              <p className="text-sm font-medium">{subsystemModules.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Cards */}
      <EntityCards
        title="Modules"
        description={`Manage modules for ${subsystem.name}`}
        entities={subsystemModules}
        onAdd={() => setIsAddOpen(true)}
        onDelete={handleDeleteModule}
        detailPath={(id) => `/modules/${id}`}
        addButtonLabel="Add Module"
        emptyMessage="No modules yet. Click 'Add Module' to create one."
      />

      {/* Add Module Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>Create a new module for {subsystem.name}</DialogDescription>
          </DialogHeader>
          <EntityForm
            fields={moduleFormFields}
            onSubmit={handleAddModule}
            isLoading={isSubmitting}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
