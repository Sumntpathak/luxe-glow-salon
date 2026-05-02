import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNowStrict, isToday, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Message, MessageChannel } from '@/types';
import { useStore } from '@/lib/store';
import { useTenantClients, useTenantMessages } from '@/lib/store/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox as InboxIcon, MessageSquare, Mail, Send, Search, ExternalLink } from 'lucide-react';

// ── Thread = (clientId, channel) tuple ──────────────────────────────────────
interface Thread {
  clientId: string;
  channel: MessageChannel;
  messages: Message[];
  unreadCount: number;
  lastAt: string;
  preview: string;
}

type FilterChip = 'all' | 'unread' | 'sms' | 'email';

const FILTERS: ReadonlyArray<{ id: FilterChip; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
];

export default function AdminInboxPage() {
  const messages = useTenantMessages();
  const clients = useTenantClients();
  const sendMessage = useStore((s) => s.sendMessage);
  const markThreadRead = useStore((s) => s.markThreadRead);

  const [filter, setFilter] = useState<FilterChip>('all');
  const [search, setSearch] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Thread aggregation ──────────────────────────────────────────────
  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, Thread>();
    for (const m of messages) {
      const key = `${m.clientId}::${m.channel}`;
      const existing = map.get(key);
      if (existing) {
        existing.messages.push(m);
      } else {
        map.set(key, {
          clientId: m.clientId,
          channel: m.channel,
          messages: [m],
          unreadCount: 0,
          lastAt: m.sentAt,
          preview: m.body,
        });
      }
    }
    for (const t of map.values()) {
      t.messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
      const last = t.messages[t.messages.length - 1];
      t.lastAt = last.sentAt;
      t.preview = last.body;
      t.unreadCount = t.messages.filter((m) => !m.read && m.direction === 'inbound').length;
    }
    return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [messages]);

  // ── Filter pipeline ─────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === 'unread' && t.unreadCount === 0) return false;
      if (filter === 'sms' && t.channel !== 'sms') return false;
      if (filter === 'email' && t.channel !== 'email') return false;
      if (q) {
        const c = clients.find((x) => x.id === t.clientId);
        const haystack = `${c?.name ?? ''} ${c?.email ?? ''} ${c?.phone ?? ''} ${t.preview}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [threads, filter, search, clients]);

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  // Auto-select the first thread when none selected.
  useEffect(() => {
    if (!activeKey && filteredThreads.length > 0) {
      const first = filteredThreads[0];
      setActiveKey(`${first.clientId}::${first.channel}`);
    }
  }, [activeKey, filteredThreads]);

  // Scroll to bottom when active thread changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeKey, messages.length]);

  const activeThread = activeKey
    ? threads.find((t) => `${t.clientId}::${t.channel}` === activeKey) ?? null
    : null;
  const activeClient = activeThread ? clients.find((c) => c.id === activeThread.clientId) : null;

  // Mark inbound messages as read when a thread becomes active.
  useEffect(() => {
    if (activeThread && activeThread.unreadCount > 0) {
      markThreadRead(activeThread.clientId, activeThread.channel);
    }
  }, [activeThread, markThreadRead]);

  const handleSendReply = () => {
    if (!activeThread) return;
    if (!reply.trim()) return toast.error('Type a reply first');
    sendMessage({
      clientId: activeThread.clientId,
      channel: activeThread.channel,
      body: reply.trim(),
    });
    setReply('');
  };

  return (
    <div className="-mt-6 -mx-4 md:-mx-8 flex h-[calc(100vh-3.5rem)]">
      {/* ── Left: thread list ─────────────────────────────────────────── */}
      <aside className="w-full md:w-80 lg:w-96 shrink-0 border-r border-border/60 flex flex-col bg-background">
        <div className="px-4 py-3 border-b border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <InboxIcon className="size-4" /> Inbox
              {totalUnread > 0 && <Badge>{totalUnread}</Badge>}
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages, clients…"
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 hover:bg-muted border-transparent text-muted-foreground'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No conversations match.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {filteredThreads.map((t) => {
                const c = clients.find((x) => x.id === t.clientId);
                const key = `${t.clientId}::${t.channel}`;
                const active = key === activeKey;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setActiveKey(key)}
                      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition ${active ? 'bg-muted/60' : ''}`}
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={c?.avatar} alt={c?.name} />
                        <AvatarFallback>{(c?.name ?? '?').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${t.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
                            {c?.name ?? 'Unknown client'}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatRelative(t.lastAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {t.channel === 'sms'
                            ? <MessageSquare className="size-3 text-muted-foreground" />
                            : <Mail className="size-3 text-muted-foreground" />}
                          <p className={`text-xs truncate ${t.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {t.preview}
                          </p>
                        </div>
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="size-2 mt-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Right: active thread ──────────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0 bg-muted/20">
        {!activeThread || !activeClient ? (
          <EmptyThread />
        ) : (
          <>
            <header className="px-5 py-3 border-b border-border/40 bg-background flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-9">
                  <AvatarImage src={activeClient.avatar} alt={activeClient.name} />
                  <AvatarFallback>{activeClient.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{activeClient.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {activeThread.channel === 'sms'
                      ? <><MessageSquare className="size-3" /> SMS · {activeClient.phone}</>
                      : <><Mail className="size-3" /> Email · {activeClient.email}</>}
                  </div>
                </div>
              </div>
              <Link
                to={`/admin/clients/${activeClient.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open profile <ExternalLink className="size-3" />
              </Link>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeThread.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border/40 bg-background">
              <div className="flex items-end gap-2">
                <Textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={activeThread.channel === 'sms' ? 'Type a reply…' : 'Compose your email…'}
                  className="resize-none"
                />
                <Button onClick={handleSendReply} disabled={!reply.trim()}>
                  <Send className="size-3.5 mr-1.5" /> Send
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Press ⌘/Ctrl + Enter to send. Demo mode — messages are not actually delivered.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === 'outbound';
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
        outbound
          ? 'bg-primary text-primary-foreground rounded-br-sm'
          : 'bg-card border border-border/50 rounded-bl-sm'
      }`}>
        {message.subject && (
          <div className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${outbound ? 'opacity-80' : 'text-muted-foreground'}`}>
            {message.subject}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.body}</div>
        <div className={`text-[10px] mt-1 ${outbound ? 'opacity-70' : 'text-muted-foreground'}`}>
          {format(parseISO(message.sentAt), 'h:mm a')}
          {outbound && message.status && ` · ${message.status}`}
        </div>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-10">
      <InboxIcon className="size-10 mb-3 opacity-50" />
      <p className="text-sm font-medium text-foreground">No conversation selected</p>
      <p className="text-xs mt-1 max-w-[280px]">
        Pick a thread from the list, or start a new conversation from any appointment or client profile.
      </p>
    </div>
  );
}

function formatRelative(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return format(d, 'h:mm a');
    return formatDistanceToNowStrict(d, { addSuffix: false });
  } catch {
    return '';
  }
}
