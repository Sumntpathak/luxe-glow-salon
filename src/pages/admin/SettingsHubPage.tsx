import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { useTenantBookings } from '@/lib/store/hooks';
import {
  Building, Clock, BookOpen, MessageSquare, Mail, Sparkles, Award, Box, Lock,
  MapPin, CreditCard, Palette, Save, Plus, X, Edit2, Check, Image as ImageIcon,
  Bell, type LucideIcon,
} from 'lucide-react';
import {
  WorkingHours, BookingRules, ResourceKind, Resource,
  PermissionRole, PermissionId,
} from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// ── MGN-901: macOS System-Settings-style hub ───────────────────────────────
// Left rail = section list, right pane = active section content.
// URL is synced via ?section=... so deep-linking works.

interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'general' | 'operations' | 'marketing' | 'billing';
}

const SECTIONS: ReadonlyArray<SectionDef> = [
  // General
  { id: 'business',     label: 'Business info',  icon: Building,       group: 'general' },
  { id: 'branding',     label: 'Branding',       icon: Palette,        group: 'general' },
  { id: 'working',      label: 'Working hours',  icon: Clock,          group: 'general' },
  // Operations
  { id: 'booking',      label: 'Booking rules',  icon: BookOpen,       group: 'operations' },
  { id: 'resources',    label: 'Resources',      icon: Box,            group: 'operations' },
  { id: 'locations',    label: 'Locations',      icon: MapPin,         group: 'operations' },
  { id: 'permissions',  label: 'Permissions',    icon: Lock,           group: 'operations' },
  // Marketing & comms
  { id: 'communications', label: 'Communications', icon: Bell,         group: 'marketing' },
  { id: 'loyalty',      label: 'Loyalty program',icon: Award,          group: 'marketing' },
  // Billing
  { id: 'billing',      label: 'Billing & plan', icon: CreditCard,     group: 'billing' },
];

const GROUP_LABEL: Record<SectionDef['group'], string> = {
  general: 'General',
  operations: 'Operations',
  marketing: 'Marketing',
  billing: 'Billing',
};

export default function AdminSettingsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') ?? 'business';
  const [active, setActive] = useState<string>(
    SECTIONS.some((s) => s.id === initialSection) ? initialSection : 'business',
  );

  // Sync to URL
  useEffect(() => {
    if (searchParams.get('section') !== active) {
      const next = new URLSearchParams(searchParams);
      next.set('section', active);
      setSearchParams(next, { replace: true });
    }
  }, [active, searchParams, setSearchParams]);

  const grouped = useMemo(() => {
    const out = new Map<SectionDef['group'], SectionDef[]>();
    for (const s of SECTIONS) {
      const arr = out.get(s.group) ?? [];
      arr.push(s);
      out.set(s.group, arr);
    }
    return out;
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Configure how your salon runs." />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left rail ─────────────────────────────────────────────── */}
        <aside className="lg:w-60 lg:shrink-0 lg:sticky lg:top-20 lg:self-start space-y-4">
          {(['general', 'operations', 'marketing', 'billing'] as const).map((g) => (
            <div key={g}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 px-2">
                {GROUP_LABEL[g]}
              </div>
              <ul className="space-y-0.5">
                {(grouped.get(g) ?? []).map((s) => {
                  const Icon = s.icon;
                  const isActive = active === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setActive(s.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-left transition ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground/80 hover:bg-muted/60'
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* ── Right content ─────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 space-y-4 max-w-3xl">
          {active === 'business'       && <BusinessPanel />}
          {active === 'branding'       && <BrandingPanel />}
          {active === 'working'        && <WorkingHoursPanel />}
          {active === 'booking'        && <BookingRulesPanel />}
          {active === 'resources'      && <ResourcesPanel />}
          {active === 'locations'      && <LocationsRedirectPanel />}
          {active === 'permissions'    && <PermissionsPanel />}
          {active === 'communications' && <CommunicationsRedirectPanel />}
          {active === 'loyalty'        && <LoyaltyPanel />}
          {active === 'billing'        && <BillingRedirectPanel />}
        </section>
      </div>
    </div>
  );
}

// ── Business info panel (was the salon-info tab) ───────────────────────────

function BusinessPanel() {
  const salonSettings = useStore((s) => s.salonSettings);
  const updateSalonSettings = useStore((s) => s.updateSalonSettings);
  const [name, setName] = useState(salonSettings.name);
  const [address, setAddress] = useState(salonSettings.address);
  const [phone, setPhone] = useState(salonSettings.phone);

  useEffect(() => {
    setName(salonSettings.name);
    setAddress(salonSettings.address);
    setPhone(salonSettings.phone);
  }, [salonSettings]);

  const handleSave = () => {
    updateSalonSettings({ name, address, phone });
    toast.success('Business info saved');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Building className="size-5" /> Business info</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field id="b-name" label="Business name" value={name} onChange={setName} />
        <Field id="b-addr" label="Address" value={address} onChange={setAddress} />
        <Field id="b-phone" label="Phone" value={phone} onChange={setPhone} />
        <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="size-4 mr-1.5" />Save</Button></div>
      </CardContent>
    </Card>
  );
}

// ── Branding panel (MGN-904) ───────────────────────────────────────────────

function BrandingPanel() {
  const organizations = useStore((s) => s.organizations);
  const currentOrgId = useStore((s) => s.currentOrgId);
  const updateOrganization = useStore((s) => s.updateOrganization);
  const org = organizations.find((o) => o.id === currentOrgId);

  const [color, setColor] = useState(org?.primaryColor ?? '#a855f7');
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl ?? '');

  useEffect(() => {
    if (org) {
      setColor(org.primaryColor ?? '#a855f7');
      setLogoUrl(org.logoUrl ?? '');
    }
  }, [org]);

  const handleSave = () => {
    if (!org) return;
    updateOrganization(org.id, { primaryColor: color, logoUrl: logoUrl.trim() || undefined });
    toast.success('Branding saved');
  };

  const presets = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#0ea5e9'];

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="size-5" /> Branding</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Apply your salon's brand color and logo to the admin top bar, online booking page, and email templates.
        </p>

        <div className="space-y-2">
          <Label>Primary color</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-12 rounded-lg border border-border cursor-pointer"
              aria-label="Primary color"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="font-mono w-32"
              maxLength={7}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setColor(p)}
                  className={`size-6 rounded-full border-2 transition ${color.toLowerCase() === p ? 'border-foreground scale-110' : 'border-border hover:scale-105'}`}
                  style={{ backgroundColor: p }}
                  aria-label={`Use ${p}`}
                />
              ))}
            </div>
          </div>
          <PreviewBlock color={color} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url">Logo URL</Label>
          <div className="flex items-center gap-3">
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://your-cdn.com/logo.png"
              className="flex-1"
            />
            {logoUrl ? (
              <img src={logoUrl} alt="Logo preview" className="size-10 rounded-lg border border-border object-contain bg-muted" />
            ) : (
              <div className="size-10 rounded-lg border border-dashed border-border flex items-center justify-center">
                <ImageIcon className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Demo mode — production accepts uploads via R2/S3.</p>
        </div>

        <div className="flex justify-end"><Button onClick={handleSave}><Save className="size-4 mr-1.5" />Save</Button></div>
      </CardContent>
    </Card>
  );
}

function PreviewBlock({ color }: { color: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="text-[11px] font-medium text-muted-foreground mb-2">Live preview</div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          style={{ backgroundColor: color }}
          className="px-3 py-1.5 rounded-md text-white text-sm font-medium"
        >Primary button</button>
        <span style={{ color }} className="text-sm font-medium">Accent text</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={{ borderColor: color, color }}>
          Outline pill
        </span>
      </div>
    </div>
  );
}

// ── Working hours panel ────────────────────────────────────────────────────

const DAYS: Array<{ key: keyof WorkingHours; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function WorkingHoursPanel() {
  const salonSettings = useStore((s) => s.salonSettings);
  const updateSalonSettings = useStore((s) => s.updateSalonSettings);
  const [hours, setHours] = useState<WorkingHours>(salonSettings.workingHours);

  useEffect(() => { setHours(salonSettings.workingHours); }, [salonSettings.workingHours]);

  const update = (key: keyof WorkingHours, patch: Partial<WorkingHours[keyof WorkingHours]>) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSave = () => {
    updateSalonSettings({ workingHours: hours });
    toast.success('Working hours saved');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-5" /> Working hours</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {DAYS.map((d) => {
          const day = hours[d.key];
          return (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium">{d.label}</span>
              <Switch checked={day.isOpen} onCheckedChange={(v) => update(d.key, { isOpen: v })} />
              <Input type="time" value={day.open} onChange={(e) => update(d.key, { open: e.target.value })} disabled={!day.isOpen} className="w-32" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="time" value={day.close} onChange={(e) => update(d.key, { close: e.target.value })} disabled={!day.isOpen} className="w-32" />
              {!day.isOpen && <span className="text-xs text-muted-foreground">Closed</span>}
            </div>
          );
        })}
        <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="size-4 mr-1.5" />Save</Button></div>
      </CardContent>
    </Card>
  );
}

// ── Booking rules panel ────────────────────────────────────────────────────

function BookingRulesPanel() {
  const salonSettings = useStore((s) => s.salonSettings);
  const updateSalonSettings = useStore((s) => s.updateSalonSettings);
  const [rules, setRules] = useState<BookingRules>(salonSettings.bookingRules);

  useEffect(() => { setRules(salonSettings.bookingRules); }, [salonSettings.bookingRules]);

  const handleSave = () => {
    updateSalonSettings({ bookingRules: rules });
    toast.success('Booking rules saved');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5" /> Booking rules</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <NumField label="Minimum advance hours"   value={rules.minAdvanceHours}        onChange={(v) => setRules({ ...rules, minAdvanceHours: v })} hint="How far in advance clients must book" />
        <NumField label="Maximum future days"     value={rules.maxFutureDays}          onChange={(v) => setRules({ ...rules, maxFutureDays: v })} hint="How far ahead bookings are allowed" />
        <NumField label="Cancellation window (hours)" value={rules.cancellationWindowHours} onChange={(v) => setRules({ ...rules, cancellationWindowHours: v })} hint="Free cancellation cutoff before appointment" />
        <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="size-4 mr-1.5" />Save</Button></div>
      </CardContent>
    </Card>
  );
}

// ── Resources panel (MGN-902) ──────────────────────────────────────────────

const KIND_LABEL: Record<ResourceKind, string> = { room: 'Room', chair: 'Chair', equipment: 'Equipment' };
const KIND_COLOR: Record<ResourceKind, string> = {
  room: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  chair: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  equipment: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

function ResourcesPanel() {
  const resources = useStore((s) => s.resources);
  const currentOrgId = useStore((s) => s.currentOrgId);
  const currentLocationId = useStore((s) => s.currentLocationId);
  const addResource = useStore((s) => s.addResource);
  const updateResource = useStore((s) => s.updateResource);
  const deleteResource = useStore((s) => s.deleteResource);
  const bookings = useTenantBookings('location');

  const visible = useMemo(
    () => resources.filter((r) => r.orgId === currentOrgId && r.locationId === currentLocationId),
    [resources, currentOrgId, currentLocationId],
  );

  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<ResourceKind>('chair');
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return toast.error('Name required');
    addResource({ name: newName.trim(), kind: newKind, isActive: true });
    setNewName('');
    toast.success('Resource added');
  };

  // Future-use: detect bookings using each resource (stubbed — Service.requiredResourceIds not yet enforced).
  void bookings;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Box className="size-5" /> Resources & rooms</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Track the physical assets your services need — chairs, treatment rooms, shared equipment.
          Bookings can be configured to require a resource (coming soon).
        </p>

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No resources yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-card hover:border-border transition">
                {editing === r.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="sm" variant="outline" onClick={() => {
                      if (editingName.trim()) { updateResource(r.id, { name: editingName.trim() }); }
                      setEditing(null);
                    }}>
                      <Check className="size-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${KIND_COLOR[r.kind]}`}>{KIND_LABEL[r.kind]}</Badge>
                    <span className={`flex-1 text-sm ${r.isActive ? '' : 'text-muted-foreground line-through'}`}>{r.name}</span>
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={(v) => updateResource(r.id, { isActive: v })}
                      aria-label="Active"
                    />
                    <button
                      onClick={() => { setEditing(r.id); setEditingName(r.name); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${r.name}"?`)) { deleteResource(r.id); toast.success('Resource deleted'); } }}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Add resource</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="e.g. Treatment room C"
              className="flex-1"
            />
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as ResourceKind)}
              className="h-9 px-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="chair">Chair</option>
              <option value="room">Room</option>
              <option value="equipment">Equipment</option>
            </select>
            <Button onClick={handleAdd}><Plus className="size-4 mr-1.5" />Add</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Permissions panel (MGN-903) ────────────────────────────────────────────

const ROLES: Array<{ id: PermissionRole; label: string }> = [
  { id: 'owner',      label: 'Owner' },
  { id: 'admin',      label: 'Admin' },
  { id: 'manager',    label: 'Manager' },
  { id: 'front_desk', label: 'Front desk' },
  { id: 'stylist',    label: 'Stylist' },
];

const PERMISSIONS: Array<{ id: PermissionId; label: string; group: string }> = [
  { id: 'view_calendar',     label: 'View calendar',         group: 'Calendar' },
  { id: 'edit_bookings',     label: 'Create / edit bookings',group: 'Calendar' },
  { id: 'cancel_bookings',   label: 'Cancel bookings',       group: 'Calendar' },
  { id: 'manage_clients',    label: 'Manage clients',        group: 'People' },
  { id: 'manage_staff',      label: 'Manage staff',          group: 'People' },
  { id: 'manage_services',   label: 'Manage services',       group: 'Catalog' },
  { id: 'manage_inventory',  label: 'Manage inventory',      group: 'Catalog' },
  { id: 'process_payments',  label: 'Take payments',         group: 'Money' },
  { id: 'process_refunds',   label: 'Process refunds',       group: 'Money' },
  { id: 'view_reports',      label: 'View reports',          group: 'Money' },
  { id: 'manage_marketing',  label: 'Manage marketing',      group: 'Admin' },
  { id: 'manage_settings',   label: 'Manage settings',       group: 'Admin' },
  { id: 'manage_billing',    label: 'Manage billing',        group: 'Admin' },
];

const DEFAULT_MATRIX: Record<PermissionRole, PermissionId[]> = {
  owner: PERMISSIONS.map((p) => p.id),
  admin: PERMISSIONS.filter((p) => p.id !== 'manage_billing').map((p) => p.id),
  manager: ['view_calendar','edit_bookings','cancel_bookings','manage_clients','manage_inventory','process_payments','view_reports','manage_marketing'],
  front_desk: ['view_calendar','edit_bookings','cancel_bookings','manage_clients','process_payments'],
  stylist: ['view_calendar','manage_clients'],
};

function isPermAllowed(role: PermissionRole, p: PermissionId, override: import('@/types').PermissionMatrix): boolean {
  const ov = override[role]?.[p];
  if (ov !== undefined) return ov;
  return DEFAULT_MATRIX[role].includes(p);
}

function PermissionsPanel() {
  const permissionMatrix = useStore((s) => s.permissionMatrix);
  const setPermission = useStore((s) => s.setPermission);

  const grouped = useMemo(() => {
    const out = new Map<string, typeof PERMISSIONS>();
    for (const p of PERMISSIONS) {
      const arr = out.get(p.group) ?? [];
      arr.push(p);
      out.set(p.group, arr);
    }
    return out;
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="size-5" /> Permissions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Control what each role can do. Defaults follow industry standard; override per-permission as needed.
          Demo mode — production enforces these via API middleware.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 pl-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Permission</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="text-center p-2 font-medium text-xs">
                    <div>{r.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([group, perms]) => (
                <>
                  <tr key={`g-${group}`} className="bg-muted/20">
                    <td colSpan={ROLES.length + 1} className="p-1.5 pl-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-t border-border/40">
                      <td className="p-2 pl-3">{p.label}</td>
                      {ROLES.map((r) => {
                        const allowed = isPermAllowed(r.id, p.id, permissionMatrix);
                        const isOwner = r.id === 'owner';
                        return (
                          <td key={r.id} className="text-center p-2">
                            <input
                              type="checkbox"
                              checked={allowed}
                              disabled={isOwner}
                              onChange={(e) => setPermission(r.id, p.id, e.target.checked)}
                              className="size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`${r.label}: ${p.label}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">Owner has all permissions and can't be restricted.</p>
      </CardContent>
    </Card>
  );
}

// ── Loyalty (extracted from old MarketingPage / Settings) ──────────────────

function LoyaltyPanel() {
  const salonSettings = useStore((s) => s.salonSettings);
  const updateSalonSettings = useStore((s) => s.updateSalonSettings);
  const ls = salonSettings.loyaltySettings;
  const [pts, setPts] = useState(ls.pointsPerCurrencyUnit);
  const [bronze, setBronze] = useState(ls.bronzeThreshold);
  const [silver, setSilver] = useState(ls.silverThreshold);
  const [gold, setGold] = useState(ls.goldThreshold);

  useEffect(() => {
    setPts(ls.pointsPerCurrencyUnit);
    setBronze(ls.bronzeThreshold);
    setSilver(ls.silverThreshold);
    setGold(ls.goldThreshold);
  }, [ls]);

  const handleSave = () => {
    if (silver <= bronze || gold <= silver) return toast.error('Tier thresholds must increase');
    updateSalonSettings({
      loyaltySettings: { pointsPerCurrencyUnit: pts, bronzeThreshold: bronze, silverThreshold: silver, goldThreshold: gold },
    });
    toast.success('Loyalty settings saved');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Award className="size-5" /> Loyalty program</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <NumField label="Points per $1 spent" value={pts} onChange={setPts} />
        <Separator />
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tier thresholds (lifetime points)</p>
        <NumField label="Bronze" value={bronze} onChange={setBronze} />
        <NumField label="Silver" value={silver} onChange={setSilver} />
        <NumField label="Gold"   value={gold}   onChange={setGold} />
        <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="size-4 mr-1.5" />Save</Button></div>
      </CardContent>
    </Card>
  );
}

// ── Redirect-style panels for surfaces that already have full pages ────────

function LocationsRedirectPanel() {
  return (
    <RedirectCard
      icon={MapPin}
      title="Locations"
      description="Add, edit, and switch between salon locations from the dedicated Locations page."
      href="/admin/locations"
    />
  );
}

function CommunicationsRedirectPanel() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="size-5" /> Communications</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Reminder cadence, SMS/Email channels, and message templates have moved to the dedicated
          <strong> Notifications</strong> tab in the legacy settings page. Templates also live inside <strong>Marketing → Flows</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/inbox"><Button variant="outline"><MessageSquare className="size-4 mr-1.5" />Open Inbox</Button></Link>
          <Link to="/admin/marketing/flows"><Button variant="outline"><Sparkles className="size-4 mr-1.5" />Manage Flows</Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingRedirectPanel() {
  return (
    <RedirectCard
      icon={CreditCard}
      title="Billing & plan"
      description="Manage your subscription plan, payment methods, and invoices in the Billing page."
      href="/admin/billing"
    />
  );
}

function RedirectCard({ icon: Icon, title, description, href }: { icon: LucideIcon; title: string; description: string; href: string }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-5" /> {title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button onClick={() => navigate(href)}>Open</Button>
      </CardContent>
    </Card>
  );
}

// ── Reusable form fields ───────────────────────────────────────────────────

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="max-w-[200px]"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Re-export helper used by other surfaces (e.g. apply branding via App).
export { isPermAllowed };
export const _resourceTagSentinel = (_: Resource) => undefined;
