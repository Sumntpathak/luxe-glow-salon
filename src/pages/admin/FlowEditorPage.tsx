import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { Flow, FlowStep, FlowTrigger, DelayStep, SendSmsStep, SendEmailStep } from '@/types';
import { TRIGGERS } from '@/lib/marketing/triggers';
import { FeatureGate } from '@/components/shared/feature-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft, Clock, MessageSquare, Mail, Plus, Trash2, ChevronUp,
  ChevronDown, Save, Sparkles, ArrowRight, FlaskConical,
} from 'lucide-react';

export default function FlowEditorPageWrapper() {
  return (
    <FeatureGate plan="standard">
      <FlowEditorPage />
    </FeatureGate>
  );
}

function FlowEditorPage() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const flows = useStore((s) => s.flows);
  const updateFlow = useStore((s) => s.updateFlow);
  const flow = flows.find((f) => f.id === flowId);

  const [draft, setDraft] = useState<Flow | null>(flow ?? null);
  useEffect(() => { setDraft(flow ?? null); }, [flow]);

  if (!flow || !draft) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link to="/admin/marketing/flows" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> All flows
        </Link>
        <p className="text-muted-foreground">Flow not found.</p>
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(flow);
  const activeStepCount = draft.steps.filter((s) => s.kind !== 'end').length;

  const updateStep = (idx: number, patch: Partial<FlowStep>) => {
    setDraft((prev) => prev ? { ...prev, steps: prev.steps.map((s, i) => i === idx ? { ...s, ...patch } as FlowStep : s) } : prev);
  };
  const removeStep = (idx: number) => {
    setDraft((prev) => prev ? { ...prev, steps: prev.steps.filter((_, i) => i !== idx) } : prev);
  };
  const moveStep = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.steps];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      // Don't allow moving past or below the 'end' step
      if (next[target].kind === 'end' && dir === 1) return prev;
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...prev, steps: next };
    });
  };
  const insertStep = (afterIdx: number, kind: FlowStep['kind']) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.steps];
      next.splice(afterIdx + 1, 0, makeStep(kind));
      return { ...prev, steps: next };
    });
  };

  const handleSave = () => {
    if (!draft.name.trim()) { toast.error('Name is required'); return; }
    if (activeStepCount === 0) { toast.error('Add at least one action step'); return; }
    updateFlow(draft.id, {
      name: draft.name.trim(),
      description: draft.description,
      trigger: draft.trigger,
      steps: draft.steps,
      active: draft.active,
    });
    toast.success('Flow saved');
    navigate('/admin/marketing/flows');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/admin/marketing/flows" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> All flows
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              checked={draft.active}
              onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              aria-label="Active"
            />
            <span className="text-sm font-medium">{draft.active ? 'Active' : 'Paused'}</span>
          </div>
          <Button onClick={handleSave} disabled={!dirty}>
            <Save className="size-4 mr-1.5" /> Save changes
          </Button>
        </div>
      </div>

      {/* Header card: name + description + trigger */}
      <Card>
        <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="flow-name">Flow name</Label>
          <Input
            id="flow-name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="text-base font-medium"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="flow-desc">Description</Label>
          <Textarea
            id="flow-desc"
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="What does this flow accomplish? Notes for your team."
          />
        </div>
        <TriggerPicker
          value={draft.trigger}
          onChange={(t) => setDraft({ ...draft, trigger: t })}
        />
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Steps</h2>
          <span className="text-xs text-muted-foreground">
            {activeStepCount} action{activeStepCount === 1 ? '' : 's'} · runs top → bottom
          </span>
        </div>

        {draft.steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            idx={idx}
            isFirst={idx === 0}
            isLast={idx === draft.steps.length - 1}
            onUpdate={(patch) => updateStep(idx, patch)}
            onRemove={() => removeStep(idx)}
            onMoveUp={() => moveStep(idx, -1)}
            onMoveDown={() => moveStep(idx, 1)}
            onInsertAfter={(kind) => insertStep(idx, kind)}
          />
        ))}
      </div>
    </div>
  );
}

function makeStep(kind: FlowStep['kind']): FlowStep {
  const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (kind) {
    case 'delay':      return { id, kind, minutes: 60 };
    case 'send_sms':   return { id, kind, body: 'Hi {first_name}!' };
    case 'send_email': return { id, kind, subject: 'Subject', body: 'Body' };
    case 'end':        return { id, kind };
  }
}

// ── Trigger picker ────────────────────────────────────────────────────────

function TriggerPicker({ value, onChange }: { value: FlowTrigger; onChange: (t: FlowTrigger) => void }) {
  const current = TRIGGERS.find((t) => t.id === value) ?? TRIGGERS[0];
  const Icon = current.icon;
  return (
    <div className="space-y-1.5">
      <Label>Trigger</Label>
      <Popover>
        <PopoverTrigger className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 bg-background text-left">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{current.label}</div>
            <div className="text-xs text-muted-foreground truncate">{current.description}</div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-h-72 overflow-y-auto p-1" align="start">
          {TRIGGERS.map((t) => {
            const I = t.icon;
            const active = t.id === value;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`w-full flex items-start gap-3 p-2 text-left rounded-md hover:bg-muted ${active ? 'bg-muted/60' : ''}`}
              >
                <I className="size-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
                {active && <span className="text-xs text-primary">✓</span>}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────

interface StepCardProps {
  step: FlowStep;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<FlowStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertAfter: (kind: FlowStep['kind']) => void;
}

function StepCard({ step, idx, isFirst, isLast, onUpdate, onRemove, onMoveUp, onMoveDown, onInsertAfter }: StepCardProps) {
  if (step.kind === 'end') {
    return (
      <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="size-1.5 rounded-full bg-border" />
        End of flow
      </div>
    );
  }
  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <StepIcon kind={step.kind} />
            <span className="font-medium text-sm flex-1">{stepLabel(step)}</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">Step {idx + 1}</Badge>
            <div className="flex items-center gap-0.5 ml-1">
              <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move up">
                <ChevronUp className="size-3.5" />
              </button>
              <button onClick={onMoveDown} disabled={isLast} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move down">
                <ChevronDown className="size-3.5" />
              </button>
              <button onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          <StepBody step={step} onUpdate={onUpdate} />
        </CardContent>
      </Card>
      <AddStepButton onAdd={onInsertAfter} />
    </>
  );
}

function StepIcon({ kind }: { kind: FlowStep['kind'] }) {
  if (kind === 'delay')      return <Clock className="size-4 text-amber-500" />;
  if (kind === 'send_sms')   return <MessageSquare className="size-4 text-blue-500" />;
  if (kind === 'send_email') return <Mail className="size-4 text-purple-500" />;
  return <Sparkles className="size-4 text-muted-foreground" />;
}

function stepLabel(step: FlowStep): string {
  if (step.kind === 'delay') {
    const m = step.minutes;
    if (m < 60) return `Wait ${m} minute${m === 1 ? '' : 's'}`;
    if (m < 24 * 60) return `Wait ${Math.round(m / 60)} hour${Math.round(m / 60) === 1 ? '' : 's'}`;
    return `Wait ${Math.round(m / 60 / 24)} day${Math.round(m / 60 / 24) === 1 ? '' : 's'}`;
  }
  if (step.kind === 'send_sms')   return 'Send SMS';
  if (step.kind === 'send_email') return 'Send email';
  return 'End';
}

function StepBody({ step, onUpdate }: { step: FlowStep; onUpdate: (patch: Partial<FlowStep>) => void }) {
  if (step.kind === 'delay') {
    return <DelayBody step={step} onUpdate={onUpdate} />;
  }
  if (step.kind === 'send_sms') {
    return <SmsBody step={step} onUpdate={onUpdate} />;
  }
  if (step.kind === 'send_email') {
    return <EmailBody step={step} onUpdate={onUpdate} />;
  }
  return null;
}

function DelayBody({ step, onUpdate }: { step: DelayStep; onUpdate: (patch: Partial<FlowStep>) => void }) {
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>(() => {
    if (step.minutes >= 24 * 60 && step.minutes % (24 * 60) === 0) return 'days';
    if (step.minutes >= 60 && step.minutes % 60 === 0) return 'hours';
    return 'minutes';
  });
  const value = useMemo(() => {
    if (unit === 'days') return Math.round(step.minutes / 60 / 24);
    if (unit === 'hours') return Math.round(step.minutes / 60);
    return step.minutes;
  }, [step.minutes, unit]);

  const setValue = (n: number) => {
    const minutes = unit === 'days' ? n * 24 * 60 : unit === 'hours' ? n * 60 : n;
    onUpdate({ minutes } as Partial<DelayStep>);
  };

  return (
    <div className="flex items-center gap-2 ml-6">
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
        className="w-24 h-9"
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as typeof unit)}
        className="h-9 px-2 rounded-md border border-border bg-background text-sm"
      >
        <option value="minutes">minutes</option>
        <option value="hours">hours</option>
        <option value="days">days</option>
      </select>
    </div>
  );
}

function SmsBody({ step, onUpdate }: { step: SendSmsStep; onUpdate: (patch: Partial<FlowStep>) => void }) {
  return (
    <div className="ml-6 space-y-1.5">
      <Textarea
        rows={3}
        value={step.body}
        onChange={(e) => onUpdate({ body: e.target.value } as Partial<SendSmsStep>)}
        placeholder="Hi {first_name}, thanks for visiting…"
        className="text-sm"
      />
      <p className="text-[11px] text-muted-foreground">
        {step.body.length} chars · 1 SMS = 160 chars · use {'{first_name}'}, {'{salon_name}'}
      </p>
    </div>
  );
}

function EmailBody({ step, onUpdate }: { step: SendEmailStep; onUpdate: (patch: Partial<FlowStep>) => void }) {
  const hasAB = !!step.abVariant;
  return (
    <div className="ml-6 space-y-2.5">
      <div className="space-y-1.5">
        <Label className="text-xs">{hasAB ? 'Subject A' : 'Subject'}</Label>
        <Input
          value={step.subject}
          onChange={(e) => onUpdate({ subject: e.target.value } as Partial<SendEmailStep>)}
          placeholder="Subject line…"
        />
      </div>
      {hasAB && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FlaskConical className="size-3" /> Subject B
          </Label>
          <Input
            value={step.abVariant?.subjectB ?? ''}
            onChange={(e) => onUpdate({ abVariant: { subjectB: e.target.value } } as Partial<SendEmailStep>)}
            placeholder="Variant subject line…"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Body</Label>
        <Textarea
          rows={5}
          value={step.body}
          onChange={(e) => onUpdate({ body: e.target.value } as Partial<SendEmailStep>)}
          placeholder="Email body…"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Use {'{first_name}'}, {'{salon_name}'}, {'{date}'}, {'{time}'}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => onUpdate({ abVariant: hasAB ? undefined : { subjectB: '' } } as Partial<SendEmailStep>)}
        >
          <FlaskConical className="size-3 mr-1" />
          {hasAB ? 'Remove A/B test' : 'Add A/B subject test'}
        </Button>
      </div>
    </div>
  );
}

function AddStepButton({ onAdd }: { onAdd: (kind: FlowStep['kind']) => void }) {
  return (
    <div className="flex items-center justify-center -my-1">
      <Popover>
        <PopoverTrigger className="size-7 rounded-full bg-muted hover:bg-muted/70 border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Plus className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="center">
          {[
            { kind: 'delay'      as const, icon: Clock,         label: 'Wait' },
            { kind: 'send_sms'   as const, icon: MessageSquare, label: 'Send SMS' },
            { kind: 'send_email' as const, icon: Mail,          label: 'Send email' },
          ].map((opt) => {
            const I = opt.icon;
            return (
              <button
                key={opt.kind}
                onClick={() => onAdd(opt.kind)}
                className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-muted rounded-md"
              >
                <I className="size-3.5 text-primary" />
                {opt.label}
                <ArrowRight className="size-3 ml-auto opacity-40" />
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}
