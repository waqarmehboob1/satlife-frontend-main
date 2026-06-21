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
import * as Models from '@/lib/models';
import { resolveStatusName } from '@/lib/entity-status';
import { getSubsystemCountBySystemId, getCount } from '@/lib/entity-counts';
import { EntityCountCell } from '@/components/entity-count-cell';
import { EntityNameWithFault } from '@/components/entity-fault-ping';
import { useEntityFaultMap } from '@/hooks/use-entity-fault-map';



const SYSTEM_STATUSES = {
  'Design': { icon: Clock, color: 'text-blue-500' },
  'Development': { icon: Wrench, color: 'text-amber-500' },
  'Testing': { icon: AlertCircle, color: 'text-orange-500' },
  'Operational': { icon: CheckCircle2, color: 'text-green-500' },
  'Retired': { icon: Trash2, color: 'text-red-500' },
};

export default function SystemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { systems, projects, subsystems, loading, createSystem, updateSystem, deleteSystem, statuses: storeStatuses } = useDataStore();
  const faultMap = useEntityFaultMap();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const statusFilterParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<string>(statusFilterParam || 'all');
  const [statuses, setStatuses] = useState<Models.Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [systemHierarchyNames, setSystemHierarchyNames] = useState<Hierarchy[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: 0,
    status_id: 0,
  });

  const subsystemCountBySystem = useMemo(
    () => getSubsystemCountBySystemId(subsystems),
    [subsystems]
  );

  const allStatuses = statuses.length ? statuses : storeStatuses;
  const getStatusName = (system: (typeof systems)[0]) =>
    resolveStatusName(system, allStatuses);

  const filtered = systems.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStatusName(s) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(SYSTEM_STATUSES).reduce((acc, status) => {
    acc[status] = systems.filter(s => getStatusName(s) === status).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleCreate() {
    if (!formData.name.trim() || !formData.project_id || !formData.status_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createSystem(formData);
      setFormData({ name: '', description: '', project_id: 0, status_id: statuses[0]?.id ?? 0 });
      setIsCreateOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!formData.name.trim() || !formData.project_id || !formData.status_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateSystem(editingId, formData);
      setFormData({ name: '', description: '', project_id: 0, status_id: statuses[0]?.id ?? 0 });
      setEditingId(null);
      setIsEditOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSystem(id);
      toast.success('System deleted successfully');
    } catch {
      toast.error('Failed to delete system');
    }
  }

  function openEdit(system: typeof systems[0]) {
    setEditingId(system.id);
    setFormData({
      name: system.name,
      description: system.description,
      project_id: system.project_id,
      status_id: system.status_id ?? 0,
    });
    setIsEditOpen(true);
  }

  useEffect(() => {
        const fetchStatuses = async () => {
          try {
            const [statusRes, hierarchyRes] = await Promise.all([
              api.statuses.list("systems"),
              api.hierarchies.list("system"),
            ]);
            setStatuses(statusRes.data);
            setSystemHierarchyNames(hierarchyRes.data);
            const defaultStatus = statusRes.data.find((s) => s.status_name === 'Design') ?? statusRes.data[0];
            if (defaultStatus) {
              setFormData((prev) => ({ ...prev, status_id: defaultStatus.id }));
            }
          } catch (err) {
            console.error("Failed to fetch statuses or hierarchy names", err);
          } finally {
            setLoadingStatuses(false);
          }
        };
  
        fetchStatuses();
      }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Systems</h1>
        <p className="text-muted-foreground mt-2">Manage satellite systems hierarchy</p>
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
                router.push('/systems');
              }}
              className={`text-left cursor-pointer transition-transform hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary rounded-lg' : ''}`}
            >
              <Card className={`hover:shadow-lg ${statusFilter === 'all' ? 'bg-accent' : ''}`}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">All Systems</p>
                  <p className="text-2xl font-bold">{systems.length}</p>
                </CardContent>
              </Card>
            </button>

            {Object.entries(SYSTEM_STATUSES).map(([statusName, { icon: Icon, color }]) => (
              <button
                key={statusName}
                onClick={() => {
                  setStatusFilter(statusName);
                  router.push(`/systems?status=${encodeURIComponent(statusName)}`);
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
            placeholder="Search systems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New System
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create System</DialogTitle>
              <DialogDescription>Add a new satellite system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>System Name *</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value) => setFormData({ ...formData, name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system from hierarchy" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemHierarchyNames.map((hierarchy) => (
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
                  placeholder="System details"
                />
              </div>
              <div>
                <Label>Project *</Label>
                <Select
                  value={formData.project_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, project_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status_id ? formData.status_id.toString() : ''}
                  onValueChange={(v) => setFormData({ ...formData, status_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.status_name}
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
          <CardTitle>All Systems</CardTitle>
          <CardDescription>Total: {filtered.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subsystems</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No systems found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((system) => {
                    const project = projects.find((p) => p.id === system.project_id);
                    return (
                      <TableRow key={system.id} onClick={() => router.push(`/systems/${system.id}`)}>
                        <TableCell className="font-medium">
                          <EntityNameWithFault
                            name={system.name}
                            entityType="system"
                            entityId={system.id}
                            faultMap={faultMap}
                          />
                        </TableCell>
                        <TableCell>{project?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusBadge status={getStatusName(system)} />
                        </TableCell>
                        <TableCell>
                          <EntityCountCell
                            count={getCount(subsystemCountBySystem, system.id)}
                            label="Total subsystems"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`systems/${system.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); openEdit(system)}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* <ConfirmDialog
                              title="Delete System"
                              description="Are you sure you want to delete this system?"
                              onConfirm={() => handleDelete(system.id)}
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
            <DialogTitle>Edit System</DialogTitle>
            <DialogDescription>Update system details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>System Name</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system from hierarchy" />
                </SelectTrigger>
                <SelectContent>
                  {systemHierarchyNames.map((hierarchy) => (
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
                placeholder="System details"
              />
            </div>
            <div>
              <Label>Project</Label>
              <Select
                value={formData.project_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, project_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status_id ? formData.status_id.toString() : ''}
                onValueChange={(v) => setFormData({ ...formData, status_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.status_name}
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
