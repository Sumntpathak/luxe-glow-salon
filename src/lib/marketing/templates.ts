import { Flow, FlowStep, FlowTrigger } from '@/types';

// ── Pre-built flow templates (MGN-803) ─────────────────────────────────────
// One-click activation from the Flows list. Templates do NOT carry orgId
// until activation — the store action stamps it.

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  /** Estimated lift from Mangomint case studies (for marketing copy). */
  expectedLift?: string;
  trigger: FlowTrigger;
  steps: Array<Omit<FlowStep, 'id'>>;
}

let stepCount = 0;
function step<T extends Omit<FlowStep, 'id'>>(s: T): Omit<FlowStep, 'id'> & T {
  return s;
}
function withIds(steps: Array<Omit<FlowStep, 'id'>>): FlowStep[] {
  return steps.map((s) => ({ ...s, id: `step-${++stepCount}-${Date.now()}` } as FlowStep));
}

export const TEMPLATES: ReadonlyArray<FlowTemplate> = [
  {
    id: 'tpl-welcome',
    name: 'Welcome new clients',
    description: 'Send a friendly intro SMS the moment a client is added.',
    expectedLift: '+12% rebook rate',
    trigger: 'client_created',
    steps: [
      step({ kind: 'send_sms', body: 'Welcome to {salon_name}, {first_name}! Use code WELCOME10 for 10% off your first visit.' }),
      step({ kind: 'end' }),
    ],
  },
  {
    id: 'tpl-thank-you',
    name: 'First-visit thank you',
    description: 'Email a personal thank you 2 hours after their first appointment.',
    expectedLift: '+18% NPS',
    trigger: 'first_appointment_completed',
    steps: [
      step({ kind: 'delay', minutes: 120 }),
      step({
        kind: 'send_email',
        subject: 'Thank you for your first visit, {first_name}!',
        body: 'It was wonderful having you in today. We\'d love to see you again — book your next appointment anytime.',
      }),
      step({ kind: 'end' }),
    ],
  },
  {
    id: 'tpl-win-back',
    name: 'Win back lapsed clients',
    description: 'SMS clients who haven\'t visited in 60+ days with a discount.',
    expectedLift: '+9% reactivation',
    trigger: 'lapsed_60d',
    steps: [
      step({ kind: 'send_sms', body: 'We miss you, {first_name}! Book any service this month and get 15% off — on us.' }),
      step({ kind: 'end' }),
    ],
  },
  {
    id: 'tpl-birthday',
    name: 'Birthday card',
    description: 'Email a birthday greeting with a complimentary upgrade offer.',
    expectedLift: '+22% birthday-month bookings',
    trigger: 'birthday',
    steps: [
      step({
        kind: 'send_email',
        subject: 'Happy birthday, {first_name}! 🎂',
        body: 'Treat yourself this birthday — book any service this month and get a complimentary upgrade.',
        abVariant: { subjectB: 'A little birthday gift inside, {first_name} 🎁' },
      }),
      step({ kind: 'end' }),
    ],
  },
  {
    id: 'tpl-24hr-reminder',
    name: '24-hour appointment reminder',
    description: 'SMS reminder 24 hours before each appointment.',
    expectedLift: '−40% no-shows',
    trigger: 'pre_service',
    steps: [
      step({ kind: 'send_sms', body: 'Hi {first_name} — friendly reminder of your appointment tomorrow. Reply C to confirm or R to reschedule.' }),
      step({ kind: 'end' }),
    ],
  },
  {
    id: 'tpl-review',
    name: 'Review request',
    description: 'Email asking for a Google review 1 day after the visit.',
    expectedLift: '+30% reviews / month',
    trigger: 'post_service',
    steps: [
      step({ kind: 'delay', minutes: 24 * 60 }),
      step({
        kind: 'send_email',
        subject: 'How was your visit, {first_name}?',
        body: 'We hope you loved your time with us. A quick Google review helps us a ton: [your-link-here]',
      }),
      step({ kind: 'end' }),
    ],
  },
];

/** Mock metrics generator so dashboards aren't all zeros for activated templates. */
export function mockTemplateMetrics(templateId: string) {
  const seed = templateId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const sent = Math.floor(50 + r(1) * 400);
  const delivered = Math.floor(sent * (0.93 + r(2) * 0.06));
  const openRate = 18 + r(3) * 25;
  const revenueAttributed = Math.floor(sent * (5 + r(4) * 30));
  return { sent, delivered, openRate, revenueAttributed };
}

/** Convert a template into a fresh Flow ready to add. orgId is stamped by the store. */
export function instantiateTemplate(template: FlowTemplate): Omit<Flow, 'orgId'> {
  return {
    id: `flow-${Date.now()}-${template.id}`,
    name: template.name,
    description: template.description,
    trigger: template.trigger,
    steps: withIds(template.steps),
    active: true,
    fromTemplate: template.id,
    metrics: mockTemplateMetrics(template.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
