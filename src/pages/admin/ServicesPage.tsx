

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Clock, DollarSign, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Service, ServiceCategory } from '@/types';

const CATEGORIES: ServiceCategory[] = ['Hair', 'Nails', 'Skin'];

const categoryColors: Record<ServiceCategory, string> = {
  Hair: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Nails: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  Skin: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const categoryGradients: Record<ServiceCategory, string> = {
  Hair: 'from-purple-400 to-purple-600',
  Nails: 'from-pink-400 to-pink-600',
  Skin: 'from-green-400 to-green-600',
};

const emptyForm = {
  name: '',
  category: 'Hair' as ServiceCategory,
  duration: 30,
  price: 0,
  description: '',
  photoUrl: '',
  assignableStaff: [] as string[],
  isActive: true,
};

export default function AdminServicesPage() {
  const { services, staff, addService, updateService, deleteService } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Filtered services
  const filtered = services.filter((svc) => {
    const matchCategory = filterCategory === 'All' || svc.category === filterCategory;
    const matchSearch = svc.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Helpers
  const resolveStaffNames = (ids: string[]) =>
    ids
      .map((id) => staff.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      category: svc.category,
      duration: svc.duration,
      price: svc.price,
      description: svc.description,
      photoUrl: svc.photoUrl,
      assignableStaff: [...svc.assignableStaff],
      isActive: svc.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (form.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (editingId) {
      updateService(editingId, { ...form });
      toast.success('Service updated successfully');
    } else {
      addService({
        id: `svc-${Date.now()}`,
        ...form,
      });
      toast.success('Service added successfully');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteService(id);
      toast.success('Service deleted');
    }
  };

  const toggleStaff = (staffId: string) => {
    setForm((prev) => ({
      ...prev,
      assignableStaff: prev.assignableStaff.includes(staffId)
        ? prev.assignableStaff.filter((id) => id !== staffId)
        : [...prev.assignableStaff, staffId],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage your salon service catalog"
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'All')}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No services found"
          description={
            search || filterCategory !== 'All'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first service'
          }
          action={
            !search && filterCategory === 'All' ? (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc) => (
            <Card key={svc.id} className="overflow-hidden">
              {/* Photo / Placeholder */}
              {svc.photoUrl ? (
                <img
                  src={svc.photoUrl}
                  alt={svc.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div
                  className={`w-full h-40 bg-gradient-to-br ${categoryGradients[svc.category]} flex items-center justify-center`}
                >
                  <span className="text-white text-3xl font-bold opacity-60">
                    {svc.name.charAt(0)}
                  </span>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle>{svc.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={categoryColors[svc.category]}
                      >
                        {svc.category}
                      </Badge>
                      <Badge variant={svc.isActive ? 'default' : 'outline'}>
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(svc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(svc.id, svc.name)}
                      aria-label={`Delete ${svc.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {svc.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${svc.price}
                  </span>
                </div>

                {svc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {svc.description}
                  </p>
                )}

                {svc.assignableStaff.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {resolveStaffNames(svc.assignableStaff)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Classic Haircut"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) =>
                  setForm({ ...form, category: val as ServiceCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-duration">Duration (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price ($)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="svc-photo">Photo URL</Label>
              <Input
                id="svc-photo"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Assignable Staff */}
            <div className="space-y-2">
              <Label>Assignable Staff</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No staff members available
                  </p>
                ) : (
                  staff.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignableStaff.includes(s.id)}
                        onChange={() => toggleStaff(s.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-active">Active</Label>
              <Switch
                id="svc-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Update Service' : 'Add Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
