'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Clock, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Link from 'next/link';
import * as api from '@/lib/api';
import type { Hierarchy } from '@/lib/models';
import { getComponentCountByUnitId, getCount } from '@/lib/entity-counts';
import { EntityCountCell } from '@/components/entity-count-cell';
import { EntityNameWithFault } from '@/components/entity-fault-ping';
import { useEntityFaultMap } from '@/hooks/use-entity-fault-map';

const UNIT_STATUSES = {
  'Manufacturing': { icon: Clock, color: 'text-blue-500' },
  'Assembled': { icon: Wrench, color: 'text-amber-500' },
  'Testing': { icon: AlertCircle, color: 'text-orange-500' },
  'Qualified': { icon: CheckCircle2, color: 'text-green-500' },
};

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { units, modules, components, loading, createUnit, updateUnit, deleteUnit } = useDataStore();
  const faultMap = useEntityFaultMap();
  const statusFilterParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<string>(statusFilterParam || 'all');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [moduleHierarchyNames, setModuleHierarchyNames] = useState<Hierarchy[]>([]);
  const [unitHierarchyNames, setUnitHierarchyNames] = useState<Hierarchy[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module_id: 0,
  });

  useEffect(() => {
    const fetchHierarchyNames = async () => {
      try {
        const modulesRes = await api.hierarchies.list('module');
        setModuleHierarchyNames(modulesRes.data);
      } catch (err) {
        console.error('Failed to load module hierarchy names', err);
      }
    };

    fetchHierarchyNames();
  }, []);

  useEffect(() => {
    const fetchUnitNames = async () => {
      if (!formData.module_id) {
        setUnitHierarchyNames([]);
        return;
      }

      const selectedModule = modules.find((m) => m.id === formData.module_id);
      const parentHierarchyId = selectedModule
        ? moduleHierarchyNames.find((hierarchy) => hierarchy.name === selectedModule.name)?.id
        : undefined;

      if (!parentHierarchyId) {
        setUnitHierarchyNames([]);
        return;
      }

      try {
        const res = await api.hierarchies.list('unit', parentHierarchyId);
        setUnitHierarchyNames(res.data);
      } catch (err) {
        console.error('Failed to load unit hierarchy names', err);
      }
    };

    fetchUnitNames();
  }, [formData.module_id, moduleHierarchyNames, modules]);

  const componentCountByUnit = useMemo(
    () => getComponentCountByUnitId(components),
    [components]
  );

  const filtered = units.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status?.status_name === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(UNIT_STATUSES).reduce((acc, status) => {
    acc[status] = units.filter(u => u.status?.status_name === status).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleCreate() {
    if (!formData.name.trim() || !formData.module_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createUnit(formData);
      setFormData({ name: '', description: '', module_id: 0 });
      setIsCreateOpen(false);
    } catch {
      // Error handled
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!formData.name.trim() || !formData.module_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateUnit(editingId, formData);
      setFormData({ name: '', description: '', module_id: 0 });
      setEditingId(null);
      setIsEditOpen(false);
    } catch {
      // Error handled
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteUnit(id);
      toast.success('Unit deleted successfully');
    } catch {
      toast.error('Failed to delete unit');
    }
  }

  function openEdit(unit: typeof units[0]) {
    setEditingId(unit.id);
    setFormData({
      name: unit.name,
      description: unit.description,
      module_id: unit.module_id,
    });
    setIsEditOpen(true);
  }


  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Units</h1>
        <p className="text-muted-foreground mt-2">Manage module units and assemblies</p>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
          <CardDescription>Click to filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={() => {
                setStatusFilter('all');
                router.push('/units');
              }}
              className={`text-left cursor-pointer transition-transform hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary rounded-lg' : ''}`}
            >
              <Card className={`hover:shadow-lg ${statusFilter === 'all' ? 'bg-accent' : ''}`}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">All Units</p>
                  <p className="text-2xl font-bold">{units.length}</p>
                </CardContent>
              </Card>
            </button>

            {Object.entries(UNIT_STATUSES).map(([statusName, { icon: Icon, color }]) => (
              <button
                key={statusName}
                onClick={() => {
                  setStatusFilter(statusName);
                  router.push(`/units?status=${encodeURIComponent(statusName)}`);
                }}
                className={`text-left cursor-pointer transition-transform hover:scale-105 ${statusFilter === statusName ? 'ring-2 ring-primary rounded-lg' : ''}`}
              >
                <Card className={`hover:shadow-lg ${statusFilter === statusName ? 'bg-accent' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{statusName}</p>
                        <p className="text-2xl font-bold">{statusCounts[statusName] || 0}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${color}`} />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Unit</DialogTitle>
              <DialogDescription>Add a new unit</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Choose unit from hierarchy</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value) => setFormData({ ...formData, name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit name" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitHierarchyNames.map((hierarchy) => (
                      <SelectItem key={hierarchy.id} value={hierarchy.name}>
                        {hierarchy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details"
                />
              </div>
              <div>
                <Label>Module *</Label>
                <Select
                  value={formData.module_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, module_id: parseInt(v), name: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
          <CardDescription>Total: {filtered.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No units found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((unit) => {
                    const module = modules.find((m) => m.id === unit.module_id);
                    return (
                      <TableRow key={unit.id} onClick={() => router.push(`/units/${unit.id}`)}>
                        <TableCell className="font-medium">
                          <EntityNameWithFault
                            name={unit.name}
                            entityType="unit"
                            entityId={unit.id}
                            faultMap={faultMap}
                          />
                        </TableCell>
                        <TableCell>{module?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusBadge status={unit.status?.status_name || 'Unknown'} />
                        </TableCell>
                        <TableCell>
                          <EntityCountCell
                            count={getCount(componentCountByUnit, unit.id)}
                            label="Total components"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/units/${unit.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); openEdit(unit)}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* <ConfirmDialog
                              title="Delete Unit"
                              description="Are you sure you want to delete this unit?"
                              onConfirm={() => handleDelete(unit.id)}
                            >
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog> */}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Update unit details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Choose unit from hierarchy</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit name" />
                </SelectTrigger>
                <SelectContent>
                  {unitHierarchyNames.map((hierarchy) => (
                    <SelectItem key={hierarchy.id} value={hierarchy.name}>
                      {hierarchy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Module</Label>
              <Select
                value={formData.module_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, module_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
