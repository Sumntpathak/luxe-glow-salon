import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Location, BookingRules, WorkingHours } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { FeatureGate } from '@/components/shared/feature-gate';
import { MapPin, Plus, Phone, Edit2, Power, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const defaultHours: WorkingHours = {
  monday: { isOpen: true, open: '09:00', close: '18:00' },
  tuesday: { isOpen: true, open: '09:00', close: '18:00' },
  wednesday: { isOpen: true, open: '09:00', close: '18:00' },
  thursday: { isOpen: true, open: '09:00', close: '18:00' },
  friday: { isOpen: true, open: '09:00', close: '18:00' },
  saturday: { isOpen: true, open: '10:00', close: '17:00' },
  sunday: { isOpen: false, open: '10:00', close: '15:00' },
};

const defaultRules: BookingRules = {
  minAdvanceHours: 2,
  maxFutureDays: 30,
  cancellationWindowHours: 24,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

interface LocationFormState {
  name: string;
  address: string;
  phone: string;
}

export default function LocationsPage() {
  const {
    locations, organizations, currentOrgId, currentLocationId,
    addLocation, setCurrentLocation,
  } = useStore();
  const updateLocationViaStore = (id: string, data: Partial<Location>) => {
    // Direct mutation through store — locations array isn't exposed via an updater yet
    useStore.setState((state) => ({
      locations: state.locations.map(l => l.id === id ? { ...l, ...data } : l),
    }));
  };

  const org = organizations.find(o => o.id === currentOrgId);
  const orgLocations = locations.filter(l => l.orgId === currentOrgId);
  const planAllowsMore = (() => {
    if (!org) return false;
    if (org.plan === 'unlimited') return true;
    if (org.plan === 'standard') return orgLocations.length < 3;
    return orgLocations.length < 1;
  })();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFormState>({ name: '', address: '', phone: '' });

  function openAdd() {
    if (!planAllowsMore) {
      toast.error(`Your ${org?.plan} plan only allows ${org?.plan === 'standard' ? '3' : '1'} location${org?.plan === 'standard' ? 's' : ''}. Upgrade to add more.`);
      return;
    }
    setEditingId(null);
    setForm({ name: '', address: '', phone: '' });
    setDialogOpen(true);
  }

  function openEdit(loc: Location) {
    setEditingId(loc.id);
    setForm({ name: loc.name, address: loc.address, phone: loc.phone });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.address.trim()) {
      return toast.error('Name and address are required');
    }
    if (editingId) {
      updateLocationViaStore(editingId, { name: form.name, address: form.address, phone: form.phone });
      toast.success('Location updated');
    } else {
      const newLoc: Location = {
        id: `loc-${Date.now()}`,
        orgId: currentOrgId,
        name: form.name,
        slug: slugify(form.name),
        address: form.address,
        phone: form.phone,
        logoUrl: '',
        workingHours: defaultHours,
        bookingRules: defaultRules,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      addLocation(newLoc);
      toast.success(`Added "${newLoc.name}"`);
    }
    setDialogOpen(false);
  }

  function toggleActive(loc: Location) {
    if (loc.id === currentLocationId && loc.isActive) {
      return toast.error("Can't deactivate the location you're currently viewing");
    }
    updateLocationViaStore(loc.id, { isActive: !loc.isActive });
    toast.success(loc.isActive ? 'Deactivated' : 'Reactivated');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description={`${orgLocations.length} location${orgLocations.length === 1 ? '' : 's'} on the ${org?.plan} plan.`}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add location
          </Button>
        }
      />

      {!planAllowsMore && org?.plan !== 'unlimited' && (
        <FeatureGate plan="standard">
          <></>
        </FeatureGate>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orgLocations.map(loc => {
          const isCurrent = loc.id === currentLocationId;
          return (
            <Card
              key={loc.id}
              className={`transition ${
                isCurrent ? 'border-primary shadow-md shadow-primary/5' : 'border-border/60'
              } ${!loc.isActive ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{loc.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">/{loc.slug}</p>
                    </div>
                  </div>
                  {isCurrent && <Badge variant="outline" className="shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>}
                </div>

                <p className="text-sm text-muted-foreground mb-1.5 line-clamp-2">{loc.address}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {loc.phone || '—'}
                </p>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  {!isCurrent && loc.isActive && (
                    <Button size="sm" variant="ghost" onClick={() => setCurrentLocation(loc.id)}>
                      Switch to
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(loc)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(loc)} className="ml-auto" aria-label={loc.isActive ? 'Deactivate location' : 'Reactivate location'}>
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add card */}
        {planAllowsMore && (
          <button
            onClick={openAdd}
            className="p-5 rounded-2xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition flex flex-col items-center justify-center min-h-[180px] gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add a location</span>
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit location' : 'Add a new location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locName">Name</Label>
              <Input id="locName" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Branch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locAddr">Street address</Label>
              <Input id="locAddr" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State 12345" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locPhone">Phone</Label>
              <Input id="locPhone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? 'Save changes' : 'Add location'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
