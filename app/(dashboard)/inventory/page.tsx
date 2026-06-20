'use client';

import { useState } from 'react';
import { useDataStore } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { inventory, components, loading, createInventory, updateInventory, deleteInventory } = useDataStore();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    component_id: 0,
    quantity: 0,
    location: '',
    serial_number: '',
  });

  const filtered = inventory.filter((item) =>
    item.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    components.find((c) => c.id === item.component_id)?.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!formData.component_id || formData.quantity <= 0 || !formData.location.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createInventory(formData);
      setFormData({ component_id: 0, quantity: 0, location: '', serial_number: '' });
      setIsCreateOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!formData.component_id || formData.quantity <= 0 || !formData.location.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateInventory(editingId, formData);
      setFormData({ component_id: 0, quantity: 0, location: '', serial_number: '' });
      setEditingId(null);
      setIsEditOpen(false);
    } catch {
      // Error handled by DataStore
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await deleteInventory(id);
    } catch {
      // Error handled by DataStore
    }
  }

  function openEdit(item: typeof inventory[0]) {
    setEditingId(item.id);
    setFormData({
      component_id: item.component_id,
      quantity: item.quantity,
      location: item.location,
      serial_number: item.serial_number,
    });
    setIsEditOpen(true);
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-2">Track component inventory and stock levels</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by serial number or component..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Register a new component in inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Component *</Label>
                <Select
                  value={formData.component_id.toString()}
                  onValueChange={(v) => setFormData({ ...formData, component_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    {components.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Warehouse A, Shelf 3"
                />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="SN-2024-001"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Total items: {filtered.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => {
                    const component = components.find((c) => c.id === item.component_id);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{component?.name || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{item.serial_number || '—'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update inventory details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Component</Label>
              <Select
                value={formData.component_id.toString()}
                onValueChange={(v) => setFormData({ ...formData, component_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
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
