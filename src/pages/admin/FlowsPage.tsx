import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { Flow } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { FeatureGate } from '@/components/shared/feature-gate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Sparkles, Trash2, ChevronRight, TrendingUp, Send } from 'lucide-react';
import { TRIGGERS, triggerMeta } from '@/lib/marketing/triggers';
import { TEMPLATES, instantiateTemplate } from '@/lib/marketing/templates';

export default function FlowsPageWrapper() {
  return (
    <FeatureGate plan="standard">
      <FlowsPage />
    </FeatureGate>
  );
}

function FlowsPage() {
  const navigate = useNavigate();
  const flows = useStore((s) => s.flows);
  const currentOrgId = useStore((s) => s.currentOrgId);
  const addFlow = useStore((s) => s.addFlow);
  const deleteFlow = useStore((s) => s.deleteFlow);
  const toggleFlowActive = useStore((s) => s.toggleFlowActive);

  const orgFlows = useMemo(() => flows.filter((f) => f.orgId === currentOrgId), [flows, currentOrgId]);

  const totalSent = orgFlows.reduce((s, f) => s + f.metrics.sent, 0);
  const totalRevenue = orgFlows.reduce((s, f) => s + f.metrics.revenueAttributed, 0);
  const activeCount = orgFlows.filter((f) => f.active).length;

  // Mark which templates are already activated (so we don't show them as available again).
  const activeTemplateIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of orgFlows) if (f.fromTemplate) set.add(f.fromTemplate);
    return set;
  }, [orgFlows]);

  const availableTemplates = TEMPLATES.filter((t) => !activeTemplateIds.has(t.id));

  const handleActivateTemplate = (templateId: string) => {
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const created = addFlow(instantiateTemplate(t));
    toast.success(`Activated "${created.name}"`);
  };

  const handleNew = () => {
    const created = addFlow({
      id: `flow-${Date.now()}`,
      name: 'Untitled flow',
      description: '',
      trigger: 'client_created',
      steps: [
        { id: `step-${Date.now()}-1`, kind: 'send_sms', body: 'Hi {first_name}!' },
        { id: `step-${Date.now()}-2`, kind: 'end' },
      ],
      active: false,
      metrics: { sent: 0, delivered: 0, openRate: 0, revenueAttributed: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    navigate(`/admin/marketing/flows/${created.id}`);
  };

  const handleDelete = (f: Flow) => {
    if (!confirm(`Delete "${f.name}"?`)) return;
    deleteFlow(f.id);
    toast.success('Flow deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Flows"
        description="Triggered sequences that nurture clients over time."
        action={
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-1.5" /> New flow
          </Button>
        }
      />

      {/* Aggregate metrics */}
      <div className="grid sm:grid-cols-3 gap-3">
        <MetricCard label="Active flows" value={activeCount.toString()} />
        <MetricCard label="Messages sent (30d)" value={totalSent.toLocaleString()} icon={Send} />
        <MetricCard label="Attributed revenue (30d)" value={`$${totalRevenue.toLocaleString()}`} icon={TrendingUp} />
      </div>

      {/* Active flows */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Your flows</h2>
          <span className="text-xs text-muted-foreground">{orgFlows.length} total</span>
        </div>
        {orgFlows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center text-muted-foreground">
            <Sparkles className="size-8 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-medium text-foreground">No flows yet</p>
            <p className="text-xs mt-1">Activate a template below or build one from scratch.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orgFlows.map((f) => (
              <FlowRow
                key={f.id}
                flow={f}
                onOpen={() => navigate(`/admin/marketing/flows/${f.id}`)}
                onToggle={() => toggleFlowActive(f.id)}
                onDelete={() => handleDelete(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Templates library */}
      {availableTemplates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Templates</h2>
            <span className="text-xs text-muted-foreground">One-click activation</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTemplates.map((t) => {
              const tm = triggerMeta(t.trigger);
              const Icon = tm.icon;
              return (
                <Card key={t.id} className="p-4 flex flex-col gap-2 hover:border-primary/40 transition">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm flex-1 truncate">{t.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">{tm.label}</Badge>
                    <span>·</span>
                    <span>{t.steps.filter(s => s.kind !== 'end').length} step{t.steps.filter(s => s.kind !== 'end').length === 1 ? '' : 's'}</span>
                  </div>
                  {t.expectedLift && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <TrendingUp className="size-3" /> {t.expectedLift}
                    </div>
                  )}
                  <Button size="sm" className="mt-1" onClick={() => handleActivateTemplate(t.id)}>
                    Activate
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Triggers reference */}
      <section className="space-y-3">
        <h2 className="font-semibold">Available triggers</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {TRIGGERS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card">
                <Icon className="size-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground text-center pt-4">
        <Link to="/admin/marketing" className="hover:text-foreground hover:underline">← Back to Marketing</Link>
      </p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function FlowRow({ flow, onOpen, onToggle, onDelete }: {
  flow: Flow;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const tm = triggerMeta(flow.trigger);
  const Icon = tm.icon;
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 transition">
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{flow.name}</span>
            {flow.fromTemplate && <Badge variant="outline" className="text-[10px] py-0 px-1.5">Template</Badge>}
            {!flow.active && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">Paused</Badge>}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
            <span>{tm.label}</span>
            <span>·</span>
            <span>{flow.steps.filter(s => s.kind !== 'end').length} step{flow.steps.filter(s => s.kind !== 'end').length === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>Updated {format(parseISO(flow.updatedAt), 'MMM d')}</span>
          </div>
        </div>
      </button>
      <div className="hidden sm:flex items-center gap-4 text-right">
        <Stat label="Sent" value={flow.metrics.sent.toLocaleString()} />
        <Stat label="Open" value={`${flow.metrics.openRate.toFixed(0)}%`} />
        <Stat label="Revenue" value={`$${flow.metrics.revenueAttributed.toLocaleString()}`} />
      </div>
      <div className="flex items-center gap-1">
        <Switch checked={flow.active} onCheckedChange={onToggle} aria-label="Active" />
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5 transition"
          aria-label="Delete flow"
        >
          <Trash2 className="size-4" />
        </button>
        <button onClick={onOpen} className="text-muted-foreground hover:text-foreground p-1.5">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
