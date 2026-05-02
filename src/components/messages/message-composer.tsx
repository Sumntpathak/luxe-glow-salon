import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { useTenantClients } from '@/lib/store/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageChannel, Client } from '@/types';
import { MessageSquare, Mail, Send } from 'lucide-react';

// MGN-702: Send-from-anywhere SMS/Email composer.
// Triggered globally via `window.dispatchEvent(new CustomEvent('luxe:open-composer', { detail: { clientId, channel? } }))`.
// Mounted once at App root.

interface ComposerOpenDetail {
  clientId: string;
  channel?: MessageChannel;
  prefillBody?: string;
}

const TEMPLATES: Array<{ id: string; label: string; body: string; subject?: string }> = [
  { id: 'confirm', label: 'Confirmation', body: 'Hi {first_name}, your appointment is confirmed for {date} at {time}. Reply STOP to opt out.' },
  { id: 'remind',  label: 'Reminder',     body: 'Hi {first_name} — friendly reminder of your appointment {date} at {time}. Reply C to confirm.' },
  { id: 'thanks',  label: 'Thank you',    body: 'Thank you for visiting today, {first_name}! We loved seeing you. Tap to rebook anytime.' },
  { id: 'review',  label: 'Review ask',   body: 'Hi {first_name}, hope you loved your visit! A quick Google review helps us a ton: [your-link-here]' },
  { id: 'lapsed',  label: 'We miss you',  body: 'It has been a while, {first_name}. Book any service this month and get 15% off — on us.' },
];

function applyMergeTags(body: string, client: Client | undefined): string {
  if (!client) return body;
  const first = client.name.split(' ')[0] ?? client.name;
  return body
    .replace(/\{first_name\}/g, first)
    .replace(/\{name\}/g, client.name)
    .replace(/\{phone\}/g, client.phone)
    .replace(/\{email\}/g, client.email);
}

export default function MessageComposer() {
  const sendMessage = useStore((s) => s.sendMessage);
  const clients = useTenantClients();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ComposerOpenDetail>).detail ?? { clientId: '' };
      setClientId(detail.clientId);
      setChannel(detail.channel ?? 'sms');
      setBody(detail.prefillBody ?? '');
      setSubject('');
      setOpen(true);
    };
    window.addEventListener('luxe:open-composer', onOpen);
    return () => window.removeEventListener('luxe:open-composer', onOpen);
  }, []);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const handleSend = () => {
    if (!clientId) return toast.error('Pick a client first');
    if (!body.trim()) return toast.error('Message body required');
    if (channel === 'email' && !subject.trim()) return toast.error('Subject required for email');
    sendMessage({
      clientId,
      channel,
      body: applyMergeTags(body.trim(), client),
      subject: channel === 'email' ? subject.trim() : undefined,
    });
    toast.success(`${channel === 'email' ? 'Email' : 'SMS'} sent to ${client?.name ?? 'client'}`);
    setOpen(false);
  };

  const applyTemplate = (templateId: string) => {
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    setBody(t.body);
    if (t.subject) setSubject(t.subject);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === 'email' ? <Mail className="size-4" /> : <MessageSquare className="size-4" />}
            New {channel === 'email' ? 'email' : 'message'}
            {client && <span className="text-muted-foreground font-normal text-sm">· {client.name}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Channel toggle */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={channel === 'sms' ? 'default' : 'outline'}
              onClick={() => setChannel('sms')}
            >
              <MessageSquare className="size-3.5 mr-1.5" /> SMS
            </Button>
            <Button
              size="sm"
              variant={channel === 'email' ? 'default' : 'outline'}
              onClick={() => setChannel('email')}
            >
              <Mail className="size-3.5 mr-1.5" /> Email
            </Button>
          </div>

          {/* Recipient picker — only when no client passed */}
          {!client && (
            <div className="space-y-1.5">
              <Label htmlFor="msg-client">To</Label>
              <select
                id="msg-client"
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Pick a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {channel === 'email' ? c.email : c.phone}</option>
                ))}
              </select>
            </div>
          )}

          {/* Templates dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Templates:</span>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className="text-xs px-2 py-0.5 rounded-md border border-border/60 hover:bg-muted transition"
              >
                {t.label}
              </button>
            ))}
          </div>

          {channel === 'email' && (
            <div className="space-y-1.5">
              <Label htmlFor="msg-subject">Subject</Label>
              <Input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              rows={channel === 'email' ? 8 : 5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={channel === 'email' ? 'Write your email…' : 'Type a message…'}
            />
            <p className="text-[11px] text-muted-foreground">
              Merge tags: <code className="font-mono">{'{first_name}'}</code>, <code className="font-mono">{'{name}'}</code>, <code className="font-mono">{'{phone}'}</code>, <code className="font-mono">{'{email}'}</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!clientId || !body.trim()}>
            <Send className="size-3.5 mr-1.5" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Helper for callers — fires the composer-open event with clean typing. */
export function openComposer(detail: ComposerOpenDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ComposerOpenDetail>('luxe:open-composer', { detail }));
}
