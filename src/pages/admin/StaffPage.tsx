

import { useState, useMemo } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Star, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';
import type { Staff } from '@/types';

const SPECIALTIES = ['Hair', 'Nails', 'Skin'] as const;
const BOOKINGS_WEEKLY_TARGET = 20;

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string[];
  commissionPercent: number;
  isActive: boolean;
}

const defaultFormData: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  specialties: [],
  commissionPercent: 50,
  isActive: true,
};

export default function AdminStaffPage() {
  const { staff, addStaff, updateStaff, bookings, earnings } = useStore();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(defaultFormData);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weeklyStats = useMemo(() => {
    const stats: Record<string, { bookings: number; revenue: number }> = {};

    for (const s of staff) {
      stats[s.id] = { bookings: 0, revenue: 0 };
    }

    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      try {
        const bookingDate = parseISO(b.date);
        if (isWithinInterval(bookingDate, { start: weekStart, end: weekEnd })) {
          if (stats[b.staffId]) {
            stats[b.staffId].bookings += 1;
          }
        }
      } catch {
        // skip invalid dates
      }
    }

    for (const e of earnings) {
      try {
        const earningDate = parseISO(e.date);
        if (isWithinInterval(earningDate, { start: weekStart, end: weekEnd })) {
          if (stats[e.staffId]) {
            stats[e.staffId].revenue += e.serviceAmount;
          }
        }
      } catch {
        // skip invalid dates
      }
    }

    return stats;
  }, [staff, bookings, earnings, weekStart, weekEnd]);

  function toggleSpecialty(specialty: string) {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: 'staff' as const,
      avatar: '',
      createdAt: new Date().toISOString(),
      bio: formData.bio.trim(),
      specialties: formData.specialties,
      commissionPercent: formData.commissionPercent,
      rating: 0,
      isActive: true,
      workingHours: {
        monday: { isOpen: true, open: '09:00', close: '17:00' },
        tuesday: { isOpen: true, open: '09:00', close: '17:00' },
        wednesday: { isOpen: true, open: '09:00', close: '17:00' },
        thursday: { isOpen: true, open: '09:00', close: '17:00' },
        friday: { isOpen: true, open: '09:00', close: '17:00' },
        saturday: { isOpen: false, open: '09:00', close: '17:00' },
        sunday: { isOpen: false, open: '09:00', close: '17:00' },
      },
      blockedDates: [],
    };

    addStaff(newStaff);
    toast.success(`${newStaff.name} has been added to the team`);
    setFormData(defaultFormData);
    setAddDialogOpen(false);
  }

  function handleEditOpen(member: Staff) {
    setEditingStaffId(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      bio: member.bio,
      specialties: [...member.specialties],
      commissionPercent: member.commissionPercent,
      isActive: member.isActive,
    });
    setEditDialogOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editingStaffId) return;
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    updateStaff(editingStaffId, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      bio: formData.bio.trim(),
      specialties: formData.specialties,
      commissionPercent: formData.commissionPercent,
      isActive: formData.isActive,
    });

    toast.success(`${formData.name} has been updated`);
    setFormData(defaultFormData);
    setEditingStaffId(null);
    setEditDialogOpen(false);
  }

  function renderStaffForm(onSubmit: (e: React.FormEvent) => void, isEdit: boolean) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staff-name">Name</Label>
          <Input
            id="staff-name"
            placeholder="Full name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-email">Email</Label>
          <Input
            id="staff-email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-phone">Phone</Label>
          <Input
            id="staff-phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-bio">Bio</Label>
          <textarea
            id="staff-bio"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Brief bio..."
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Specialties</Label>
          <div className="flex flex-wrap gap-3">
            {SPECIALTIES.map((specialty) => (
              <label
                key={specialty}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={() => toggleSpecialty(specialty)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{specialty}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-commission">Commission %</Label>
          <Input
            id="staff-commission"
            type="number"
            min={0}
            max={100}
            value={formData.commissionPercent}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                commissionPercent: Number(e.target.value),
              }))
            }
          />
        </div>

        {isEdit && (
          <div className="flex items-center justify-between">
            <Label htmlFor="staff-active">Active</Label>
            <Switch
              id="staff-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: !!checked }))
              }
            />
          </div>
        )}

        <Separator />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(defaultFormData);
              if (isEdit) {
                setEditDialogOpen(false);
              } else {
                setAddDialogOpen(false);
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit">{isEdit ? 'Update Staff' : 'Add Staff'}</Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff Management"
        description="Manage your team members, roles, and performance."
        action={
          <Button onClick={() => { setFormData(defaultFormData); setAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        }
      />

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members yet"
          description="Add your first team member to get started with scheduling and management."
          action={
            <Button onClick={() => { setFormData(defaultFormData); setAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((member) => {
            const stats = weeklyStats[member.id] || { bookings: 0, revenue: 0 };
            const isExpanded = expandedStaffId === member.id;
            const progressValue = Math.min(
              (stats.bookings / BOOKINGS_WEEKLY_TARGET) * 100,
              100,
            );

            return (
              <Card key={member.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(member.id)}`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditOpen(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Role badge */}
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>

                  {/* Specialties */}
                  {member.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  <StarRating rating={member.rating} />

                  {/* Commission */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Commission: {member.commissionPercent}%</span>
                  </div>

                  <Separator />

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        <span className="font-medium">{stats.bookings}</span>{' '}
                        <span className="text-muted-foreground">bookings</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        <span className="font-medium">${stats.revenue.toFixed(0)}</span>{' '}
                        <span className="text-muted-foreground">revenue</span>
                      </span>
                    </div>
                  </div>

                  {/* Expand performance */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setExpandedStaffId(isExpanded ? null : member.id)
                    }
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {isExpanded ? 'Hide Performance' : 'View Performance'}
                  </Button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <h4 className="text-sm font-semibold">Weekly Performance</h4>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bookings this week</span>
                          <span className="font-medium">
                            {stats.bookings} / {BOOKINGS_WEEKLY_TARGET}
                          </span>
                        </div>
                        <Progress value={progressValue} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                          <p className="text-lg font-semibold">${stats.revenue.toFixed(0)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Avg. Rating</p>
                          <p className="text-lg font-semibold">{member.rating.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new team member.
            </DialogDescription>
          </DialogHeader>
          {renderStaffForm(handleAddSubmit, false)}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the staff member details below.
            </DialogDescription>
          </DialogHeader>
          {renderStaffForm(handleEditSubmit, true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
