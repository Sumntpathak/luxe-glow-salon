import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { openComposer } from '@/components/messages/message-composer';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
  Mail, Phone, Calendar, Sparkles, Award, Edit2, ArrowLeft, Plus,
  MessageSquare, DollarSign, Activity, Scissors, Receipt, FileText, Lock, Star,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  useTenantBookings, useTenantStaff, useTenantServices,
  useTenantClients, useTenantPointsHistory,
} from '@/lib/store/hooks';
import { computeClientMetrics } from '@/lib/clients/metrics';
import {
  buildClientTimeline, filterTimeline,
  type TimelineEvent, type TimelineEventKind,
} from '@/lib/clients/timeline';
import { STATUS_STYLES } from '@/lib/calendar/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Booking, Client, Service, Staff, BookingStatus } from '@/types';

// ── Tag colors (deterministic by hash) ───────────────────────────────────
type TagColor = 'gray' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
const TAG_PALETTE: TagColor[] = ['gray', 'blue', 'purple', 'emerald', 'amber', 'rose'];
const TAG_CLASS: Record<TagColor, string> = {
  gray: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-400/40',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/40',
  purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/40',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40',
};
function tagColorFor(label: string): TagColor {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

// ── Timeline kind icon/color ─────────────────────────────────────────────
const KIND_ICON: Record<TimelineEventKind, typeof Scissors> = {
  appointment: Scissors, sale: DollarSign, note: FileText, comm: MessageSquare, points: Sparkles,
};
const KIND_BG: Record<TimelineEventKind, string> = {
  appointment: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  sale: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  note: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  comm: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  points: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
};

type FilterValue = 'all' | TimelineEventKind;

interface FilterChipProps { active: boolean; label: string; onClick: () => void }
function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button type="button" onClick={onClick} className={[
      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      active ? 'bg-primary/15 text-primary border-primary/40'
        : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70',
    ].join(' ')}>{label}</button>
  );
}

// ── Edit dialog ──────────────────────────────────────────────────────────
interface EditClientDialogProps { client: Client; open: boolean; onOpenChange: (open: boolean) => void }
function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const updateClient = useStore((s) => s.updateClient);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [preferences, setPreferences] = useState(client.preferences);
  const [allergies, setAllergies] = useState(client.allergies);
  const [tagsInput, setTagsInput] = useState((client.tags ?? []).join(', '));

  useEffect(() => {
    if (!open) return;
    setName(client.name); setEmail(client.email); setPhone(client.phone);
    setPreferences(client.preferences); setAllergies(client.allergies);
    setTagsInput((client.tags ?? []).join(', '));
  }, [open, client]);

  const handleSave = (): void => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    updateClient(client.id, { name, email, phone, preferences, allergies, tags });
    toast.success('Client updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit client</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">Name</Label>
            <Input id="ec-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-email">Email</Label>
              <Input id="ec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-phone">Phone</Label>
              <Input id="ec-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-pref">Preferences</Label>
            <Textarea id="ec-pref" rows={2} value={preferences} onChange={(e) => setPreferences(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-allergies">Allergies</Label>
            <Textarea id="ec-allergies" rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-tags">Tags</Label>
            <Input id="ec-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VIP, color, weekend-only" />
            <p className="text-xs text-muted-foreground">Comma-separated.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Loyalty card ─────────────────────────────────────────────────────────
function LoyaltyCard({ client }: { client: Client }) {
  const loyaltySettings = useStore((s) => s.salonSettings.loyaltySettings);
  const points = client.loyaltyPoints;
  const tier = client.loyaltyTier;
  const nextThreshold =
    tier === 'Bronze' ? loyaltySettings.silverThreshold
      : tier === 'Silver' ? loyaltySettings.goldThreshold : null;
  const nextTierLabel = tier === 'Bronze' ? 'Silver' : tier === 'Silver' ? 'Gold' : null;
  const delta = nextThreshold !== null ? Math.max(0, nextThreshold - points) : 0;
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold">{tier} member</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{points.toLocaleString()} pts</p>
      {nextThreshold !== null && nextTierLabel ? (
        <p className="text-xs text-muted-foreground mt-1">
          {points} / {nextThreshold} points · {delta} to {nextTierLabel}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Top tier reached.</p>
      )}
    </div>
  );
}

// ── Timeline tab ─────────────────────────────────────────────────────────
function TimelineTab({ events }: { events: TimelineEvent[] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(
    () => (filter === 'all' ? events : filterTimeline(events, [filter])),
    [events, filter],
  );
  const visible = showAll ? filtered : filtered.slice(0, 50);
  const handleClick = (e: TimelineEvent): void => {
    if (e.kind === 'appointment') navigate(`/admin/calendar?date=${e.at.slice(0, 10)}`);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} label="All" onClick={() => setFilter('all')} />
        <FilterChip active={filter === 'appointment'} label="Appointments" onClick={() => setFilter('appointment')} />
        <FilterChip active={filter === 'sale'} label="Sales" onClick={() => setFilter('sale')} />
        <FilterChip active={filter === 'note'} label="Notes" onClick={() => setFilter('note')} />
        <FilterChip active={filter === 'points'} label="Points" onClick={() => setFilter('points')} />
      </div>
      {visible.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No activity yet.</div>
      ) : (
        <ul className="border-l-2 border-border/50 pl-4 space-y-3">
          {visible.map((e) => {
            const Icon = KIND_ICON[e.kind];
            const clickable = e.kind === 'appointment';
            return (
              <li key={e.id}
                className={[
                  'flex items-start gap-3 -ml-[1.55rem] pl-3 py-2 rounded-md',
                  clickable ? 'cursor-pointer hover:bg-muted/40' : '',
                ].join(' ')}
                onClick={() => handleClick(e)}>
                <span className={['mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', KIND_BG[e.kind]].join(' ')}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  {e.subtitle && <p className="text-xs text-muted-foreground truncate">{e.subtitle}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatDistanceToNow(parseISO(e.at), { addSuffix: true })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {!showAll && filtered.length > 50 && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show more ({filtered.length - 50})
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Appointments / Sales tabs ────────────────────────────────────────────
interface ListTabProps { bookings: Booking[]; services: Service[]; staff: Staff[] }
const dt = (b: Booking): string => `${b.date}T${b.time}`;

function AppointmentsTab({ bookings, services, staff }: ListTabProps) {
  const navigate = useNavigate();
  const sorted = useMemo(() => [...bookings].sort((a, b) => dt(b).localeCompare(dt(a))), [bookings]);
  if (sorted.length === 0) return <div className="text-center py-12 text-sm text-muted-foreground">No appointments yet.</div>;
  return (
    <ul className="space-y-2">
      {sorted.map((b) => {
        const svc = services.find((s) => s.id === b.serviceId);
        const st = staff.find((s) => s.id === b.staffId);
        const style = STATUS_STYLES[b.status as BookingStatus];
        return (
          <li key={b.id}>
            <button type="button" onClick={() => navigate(`/admin/calendar?date=${b.date}`)}
              className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors px-4 py-3 flex items-center gap-3">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{style.label}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{svc?.name ?? 'Service'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  with {st?.name ?? 'Unknown'} · {format(parseISO(b.date), 'MMM d, yyyy')} · {b.time}–{b.endTime}
                </p>
              </div>
              <span className="text-sm font-medium">${(svc?.price ?? 0).toFixed(2)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SalesTab({ bookings, services, staff }: ListTabProps) {
  const completed = useMemo(
    () => bookings.filter((b) => b.status === 'completed').sort((a, b) => dt(b).localeCompare(dt(a))),
    [bookings],
  );
  const total = useMemo(() => completed.reduce((sum, b) => sum + (services.find((s) => s.id === b.serviceId)?.price ?? 0), 0),
    [completed, services]);
  if (completed.length === 0) return <div className="text-center py-12 text-sm text-muted-foreground">No completed sales yet.</div>;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Lifetime total</span>
        <span className="text-xl font-bold">${total.toFixed(2)}</span>
      </div>
      <ul className="divide-y rounded-lg border bg-card">
        {completed.map((b) => {
          const svc = services.find((s) => s.id === b.serviceId);
          const st = staff.find((s) => s.id === b.staffId);
          return (
            <li key={b.id} className="px-4 py-3 flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{format(parseISO(b.date), 'MMM d, yyyy')}</span>
              <span className="flex-1 min-w-0 truncate">{svc?.name ?? 'Service'}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[8rem]">{st?.name ?? 'Unknown'}</span>
              <span className="font-medium tabular-nums">${(svc?.price ?? 0).toFixed(2)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Notes tab (auto-save on blur) ────────────────────────────────────────
function NotesTab({ client }: { client: Client }) {
  const updateClient = useStore((s) => s.updateClient);
  const [value, setValue] = useState(client.adminNotes ?? '');
  useEffect(() => { setValue(client.adminNotes ?? ''); }, [client.id, client.adminNotes]);
  const handleBlur = (): void => {
    if (value !== (client.adminNotes ?? '')) {
      updateClient(client.id, { adminNotes: value });
      toast.success('Notes saved', { duration: 1500 });
    }
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="admin-notes" className="flex items-center gap-1.5 text-sm font-medium">
        <Lock className="h-3.5 w-3.5" /> Internal admin notes
      </Label>
      <Textarea id="admin-notes" rows={8} value={value}
        onChange={(e) => setValue(e.target.value)} onBlur={handleBlur}
        placeholder="Notes about this client (visible to staff only)…" />
      <p className="text-xs text-muted-foreground">Visible only to staff. Not shared with the client.</p>
    </div>
  );
}

function MembershipsTab() {
  return (
    <div className="text-center py-16 space-y-3">
      <Award className="h-10 w-10 mx-auto text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">Memberships coming in Epic 6</p>
      <Button variant="outline" size="sm" onClick={() => toast('Coming soon')}>View packages</Button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
export default function AdminClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const clients = useTenantClients();
  const bookings = useTenantBookings('org');
  const staff = useTenantStaff('org');
  const services = useTenantServices('org');
  const pointsHistory = useTenantPointsHistory();

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const clientBookings = useMemo(
    () => (client ? bookings.filter((b) => b.clientId === client.id) : []),
    [bookings, client],
  );
  const metrics = useMemo(
    () => (client ? computeClientMetrics(client.id, bookings, services) : null),
    [client, bookings, services],
  );
  const timeline = useMemo(
    () => (client ? buildClientTimeline({ clientId: client.id, bookings, services, staff, pointsHistory }) : []),
    [client, bookings, services, staff, pointsHistory],
  );
  const [editOpen, setEditOpen] = useState(false);

  if (!client || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-base font-medium">Client not found</p>
        <Link to="/admin/clients" className="text-sm text-primary hover:underline">Back to clients</Link>
      </div>
    );
  }

  const lastVisit = metrics.lastVisitDate
    ? formatDistanceToNow(parseISO(metrics.lastVisitDate), { addSuffix: true }) : '—';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-80 lg:shrink-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Link to="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Clients
        </Link>
        <Card className="p-5 space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(client.name)}`} alt={client.name} />
              <AvatarFallback className="text-2xl">{client.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{client.name}</h1>
              <a href={`mailto:${client.email}`}
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Mail className="h-3 w-3" /> {client.email}
              </a><br />
              <a href={`tel:${client.phone}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Phone className="h-3 w-3" /> {client.phone}
              </a>
            </div>
          </div>
          {client.tags && client.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {client.tags.map((t) => (
                <Badge key={t} variant="outline" className={`text-[11px] font-medium ${TAG_CLASS[tagColorFor(t)]}`}>{t}</Badge>
              ))}
            </div>
          )}
          <Separator />
          <LoyaltyCard client={client} />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Visits</p>
              <p className="text-base font-semibold mt-0.5">{metrics.visitCount}</p>
            </div>
            <div className="rounded-lg border p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lifetime</p>
              <p className="text-base font-semibold mt-0.5">${metrics.lifetimeValue.toFixed(0)}</p>
            </div>
            <div className="rounded-lg border p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last visit</p>
              <p className="text-[11px] font-medium mt-1 leading-tight">{lastVisit}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate(`/book?clientId=${client.id}`)}>
              <Plus className="h-4 w-4 mr-1.5" /> Book appointment
            </Button>
            <Button variant="outline" onClick={() => openComposer({ clientId: client.id })}>
              <MessageSquare className="h-4 w-4 mr-1.5" /> Send message
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </div>
        </Card>
      </aside>

      <section className="flex-1 min-w-0 space-y-4">
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline"><Activity className="h-4 w-4 mr-1.5" /> Timeline</TabsTrigger>
            <TabsTrigger value="appointments"><Calendar className="h-4 w-4 mr-1.5" /> Appointments</TabsTrigger>
            <TabsTrigger value="sales"><Receipt className="h-4 w-4 mr-1.5" /> Sales</TabsTrigger>
            <TabsTrigger value="notes"><FileText className="h-4 w-4 mr-1.5" /> Notes</TabsTrigger>
            <TabsTrigger value="memberships"><Award className="h-4 w-4 mr-1.5" /> Memberships</TabsTrigger>
          </TabsList>
          <Card className="p-5">
            <TabsContent value="timeline" className="m-0"><TimelineTab events={timeline} /></TabsContent>
            <TabsContent value="appointments" className="m-0"><AppointmentsTab bookings={clientBookings} services={services} staff={staff} /></TabsContent>
            <TabsContent value="sales" className="m-0"><SalesTab bookings={clientBookings} services={services} staff={staff} /></TabsContent>
            <TabsContent value="notes" className="m-0"><NotesTab client={client} /></TabsContent>
            <TabsContent value="memberships" className="m-0"><MembershipsTab /></TabsContent>
          </Card>
        </Tabs>
      </section>

      <EditClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
