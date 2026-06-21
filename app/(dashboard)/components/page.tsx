'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Link from 'next/link';
import * as api from '@/lib/api';
import type { Hierarchy } from '@/lib/models';
import { getInventoryQuantityByComponentId, getCount } from '@/lib/entity-counts';
import { EntityCountCell } from '@/components/entity-count-cell';
import { EntityNameWithFault } from '@/components/entity-fault-ping';
import { useEntityFaultMap } from '@/hooks/use-entity-fault-map';

const COMPONENT_STATUSES = {
  'Procured': { icon: Clock, color: 'text-blue-500' },
  'In Inspection': { icon: AlertCircle, color: 'text-orange-500' },
  'Approved': { icon: CheckCircle2, color: 'text-green-500' },
  'Rejected': { icon: XCircle, color: 'text-red-500' },
};

export default function ComponentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { components, units, inventory, loading, createComponent, updateComponent, deleteComponent } = useDataStore();
  const faultMap = useEntityFaultMap();
  const statusFilterParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<string>(statusFilterParam || 'all');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [unitHierarchyNames, setUnitHierarchyNames] = useState<Hierarchy[]>([]);
  const [componentHierarchyNames, setComponentHierarchyNames] = useState<Hierarchy[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_id: 0,
  });

  useEffect(() => {
    const fetchHierarchyNames = async () => {
      try {
        const unitsRes = await api.hierarchies.list('unit');
        setUnitHierarchyNames(unitsRes.data);
      } catch (err) {
        console.error('Failed to load unit hierarchy names', err);
      }
    };

    fetchHierarchyNames();
  }, []);

  useEffect(() => {
    const fetchComponentNames = async () => {
      if (!formData.unit_id) {
        setComponentHierarchyNames([]);
        return;
      }

      const selectedUnit = units.find((u) => u.id === formData.unit_id);
      const parentHierarchyId = selectedUnit
        ? unitHierarchyNames.find((hierarchy) => hierarchy.name === selectedUnit.name)?.id
        : undefined;

      if (!parentHierarchyId) {
        setComponentHierarchyNames([]);
        return;
      }

      try {
        const res = await api.hierarchies.list('component', parentHierarchyId);
        setComponentHierarchyNames(res.data);
      } catch (err) {
        console.error('Failed to load component hierarchy names', err);
      }
    };

    fetchComponentNames();
  }, [formData.unit_id, unitHierarchyNames, units]);

  const inventoryQtyByComponent = useMemo(
    () => getInventoryQuantityByComponentId(inventory),
    [inventory]
  );

  const filtered = components.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status?.status_name === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(COMPONENT_STATUSES).reduce((acc, status) => {
    acc[status] = components.filter(c => c.status?.status_name === status).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleCreate() {
    if (!formData.name.trim() || !formData.unit_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createComponent(formData);
      setFormData({ name: '', description: '', unit_id: 0 });
      setIsCreateOpen(false);
    } catch {
      // Error handled
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!formData.name.trim() || !formData.unit_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateComponent(editingId, formData);
      setFormData({ name: '', description: '', unit_id: 0 });
      setEditingId(null);
      setIsEditOpen(false);
    } catch {
      // Error handled
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteComponent(id);
      toast.success('Component deleted successfully');
    } catch {
      toast.error('Failed to delete component');
    }
  }

  function openEdit(component: typeof components[0]) {
    setEditingId(component.id);
    setFormData({
      name: component.name,
      description: component.description,
      unit_id: component.unit_id,
    });
    setIsEditOpen(true);
  }

  useEffect(() => {
    const fetchHierarchyNames = async () => {
      try {
        const [unitRes, componentRes] = await Promise.all([
          api.hierarchies.list('unit'),
          api.hierarchies.list('component'),
        ]);
        setUnitHierarchyNames(unitRes.data);
        setComponentHierarchyNames(componentRes.data);
      } catch (err) {
        console.error('Failed to load component hierarchy names', err);
      }
    };

    fetchHierarchyNames();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Components</h1>
        <p className="text-muted-foreground mt-2">Manage unit components and parts</p>
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
                router.push('/components');
              }}
              className={`text-left cursor-pointer transition-transform hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary rounded-lg' : ''}`}
            >
              <Card className={`hover:shadow-lg ${statusFilter === 'all' ? 'bg-accent' : ''}`}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">All Components</p>
                  <p className="text-2xl font-bold">{components.length}</p>
                </CardContent>
              </Card>
            </button>

            {Object.entries(COMPONENT_STATUSES).map(([statusName, { icon: Icon, color }]) => (
              <button
                key={statusName}
                onClick={() => {
                  setStatusFilter(statusName);
                  router.push(`/components?status=${encodeURIComponent(statusName)}`);
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
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Component
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Component</DialogTitle>
              <DialogDescription>Add a new component</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Choose component from hierarchy</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value) => setFormData({ ...formData, name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component name" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentHierarchyNames.map((hierarchy) => (
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
                <Label>Unit *</Label>
                <Select
                  value={formData.unit_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, unit_id: parseInt(v), name: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
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
          <CardTitle>All Components</CardTitle>
          <CardDescription>Total: {filtered.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inventory Qty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No components found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((component) => {
                    const unit = units.find((u) => u.id === component.unit_id);
                    return (
                      <TableRow key={component.id} onClick={() => router.push(`/components/${component.id}`)}>
                        <TableCell className="font-medium">
                          <EntityNameWithFault
                            name={component.name}
                            entityType="component"
                            entityId={component.id}
                            faultMap={faultMap}
                          />
                        </TableCell>
                        <TableCell>{unit?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusBadge status={component.status?.status_name || 'Unknown'} />
                        </TableCell>
                        <TableCell>
                          <EntityCountCell
                            count={getCount(inventoryQtyByComponent, component.id)}
                            label="Inventory quantity"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/components/${component.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); openEdit(component)}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* <ConfirmDialog
                              title="Delete Component"
                              description="Are you sure you want to delete this component?"
                              onConfirm={() => handleDelete(component.id)}
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
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>Update component details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Choose component from hierarchy</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component name" />
                </SelectTrigger>
                <SelectContent>
                  {componentHierarchyNames.map((hierarchy) => (
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
              <Label>Unit</Label>
              <Select
                value={formData.unit_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, unit_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name}
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