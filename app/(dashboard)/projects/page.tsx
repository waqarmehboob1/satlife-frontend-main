'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Clock, AlertTriangle, Zap, Pause, CheckCircle,Sigma , Presentation, Asterisk, AlertCircle, CheckCircle2, Wrench, Package, Lock, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/status-badge';
import * as api from '@/lib/api';
import * as Models from '@/lib/models';
import Link from 'next/link';
import { KPICard } from '@/components/kpi-card';
import { projectShutdown } from 'next/dist/build/swc/generated-native';

interface StatusCount {
  status: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber' | 'orange' | 'slate' | 'emerald';
}


export default function ProjectsPage(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, users, orders, loading, createProject, updateProject, deleteProject, getEntityMaintenanceLogs } = useDataStore();
  const [search, setSearch] = useState('');
  
  // Get status filter from URL params
  const statusFilterParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<string>(statusFilterParam || 'Total');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    owner_id: 0,
    order_id: 0,
    status_id: 0,
  });
  const [statuses, setStatuses] = useState<Models.Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);


    // const statusCounts: StatusCount[] = [
    //   {
    //     status: 'Total',
    //     count: totalCount,
    //     icon: Package,
    //     color: 'emerald',
    //   },
    //   {
    //     status: 'open',
    //     count: cases.filter((c) => c.status === 'open').length,
    //     icon: AlertCircle,
    //     color: 'blue',
    //   },
    //   {
    //     status: 'under_inspection',
    //     count: cases.filter((c) => c.status === 'under_inspection').length,
    //     icon: Wrench,
    //     color: 'amber',
    //   },
    //   {
    //     status: 'under_repair',
    //     count: cases.filter((c) => c.status === 'under_repair').length,
    //     icon: Wrench,
    //     color: 'orange',
    //   },
    //   {
    //     status: 'resolved',
    //     count: cases.filter((c) => c.status === 'resolved').length,
    //     icon: CheckCircle2,
    //     color: 'green',
    //   },
    //   {
    //     status: 'closed',
    //     count: cases.filter((c) => c.status === 'closed').length,
    //     icon: Lock,
    //     color: 'slate',
    //   },
    // ];
  
  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) 
                        || p.description.toLowerCase().includes(search.toLowerCase()) 
                        || p.start_date.toLowerCase().includes(search.toLowerCase()) 
                        || p.end_date.toLowerCase().includes(search.toLowerCase())  
                        || p.status_name?.toLowerCase().includes(search.toLowerCase()) 
    const matchesStatus = statusFilter === 'Total' || p.status_name === statusFilter;
    console.log('Filtering project:', p.name, 'Matches Search:', matchesSearch, 'Matches Status:', matchesStatus);
    return matchesSearch && matchesStatus;
  });

  async function handleCreate() {
    if (!formData.name.trim() || !formData.owner_id  || !formData.order_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createProject(formData);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        owner_id: 0,
        order_id: 0,
        status_id: 0,
      });
      setIsCreateOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!formData.name.trim() || !formData.owner_id || !formData.status_id || !formData.order_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateProject(editingId, formData);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        owner_id: 0,
        order_id: 0,
        status_id: 0,
      });
      setEditingId(null);
      setIsEditOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure? This will delete associated systems.')) return;
    try {
      await deleteProject(id);  
    } catch {
      // Error handled by DataStore
    }
  }

  function openEdit(project: typeof projects[0]) {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      owner_id: project.owner_id,
      order_id: project.order_id,
      status_id: project.status_id,
    });
    setIsEditOpen(true);
  }
  const icons = {
                'Initiation': Clock,
                'Planning': Presentation,
                'Execution': Zap,
                'Monitoring': AlertTriangle,
                'Completed': CheckCircle,
                'On Hold': Pause,
                'Total': Sigma ,
              };
  const status_colors = {
                'Initiation': 'blue',
                'Planning': 'amber',
                'Execution': 'emerald',
                'Monitoring': 'orange',
                'Completed': 'green',
                'On Hold': 'slate',
                'Total': 'red',
              } as const;
  const Icon = icons['Total'] || Clock;

  useEffect(() => {
      const fetchStatuses = async () => {
        try {
          const res = await api.statuses.list("projects"); // 👈 filter here
          setStatuses(res.data);
        } catch (err) {
          console.error("Failed to fetch statuses", err);
        } finally {
          setLoadingStatuses(false);
        }
      };

      fetchStatuses();
    }, []);


  if (loading) return <div className="p-8 text-center">Loading...</div>;
  const statusNames = statuses.map((status) => status.status_name);
  console.log("statusNames", statusNames);
  
  statusNames.unshift("Total");
  const Project_status = statusNames.map((status) => ({
      s_name: status,
      s_count: status!= "Total"? projects.filter((item) => item.status_name === status).length : projects.length,
      s_icon: icons[status as keyof typeof icons] ?? Clock,
      s_color: status_colors[status as keyof typeof status_colors],
    }));


  console.log(statuses)
  console.log(statusNames)
  console.log(filtered)
  console.log(Project_status)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-2 text-sm ">Manage satellite lifecycle projects</p>
      </div>

      {/* Project Status cards mini dashboard*/}
      <div className="">
          {statuses.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-7 items-stretch">
            {Project_status.map((item) => (
              <button
                key={item.s_name}
                onClick={() => setStatusFilter(item.s_name)}
                className="w-full h-full cursor-pointer"
              >
                <div className = "h-full w-full" >

                
                <KPICard
                  title={item.s_name.replace(/_/g, ' ').charAt(0).toUpperCase() + item.s_name.replace(/_/g, ' ').slice(1)}
                  value={item.s_count}
                  change={item.s_name != 'Total'? Math.round(100* item.s_count/projects.length):0}
                  icon={item.s_icon}
                  accentColor={item.s_color}
                  isSelected={statusFilter === item.s_name}
                />
                </div>
              </button>
            ))}
          </div>
        )}
      </div> 

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Create New Project PoP up Window */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Set up a new satellite project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sat-A Lifecycle"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project details"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Owner *</Label>
                <Select
                  value={formData.owner_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, owner_id: parseInt(v) })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.full_name}
                      </SelectItem>
                    ))
                  }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Select
                  value={formData.order_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, order_id: parseInt(v) })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select order (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.order_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, status_id: parseInt(v) })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.status_name}
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
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Total: {filtered.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>% Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((project) => {
                    const owner = users.find((u) => u.id === project.owner_id);
                    const status = statuses.find((s) => s.id === project.status_id);
                    return (
                      <TableRow key={project.id}   onClick={() => router.push(`/projects/${project.id}`)}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{owner?.full_name || 'N/A'}</TableCell>
                        <TableCell><StatusBadge status={status?.status_name || 'Unknown'} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(project.start_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(project.end_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground ">10%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            
                              <Edit className="h-4 w-4 text-accent-foreground hover:text-blue-600" 
                                onClick={(e) => { e.stopPropagation()
                                openEdit(project)}}
                                />

                              <Trash2 className="h-4 w-4 text-accent-foreground hover:text-red-600" 
                              onClick={(e) => { e.stopPropagation();handleDelete(project.id)}}/>
                          </div>
                        </TableCell>
                        {/* <Link href={`/projects/${project.id}`} className="absolute inset-0" /> */}
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
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Owner</Label>
              <Select
                value={formData.owner_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, owner_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, status_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.status_name}
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
