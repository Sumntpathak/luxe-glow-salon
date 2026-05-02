import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// MGN-506: Quick-add client modal — a globally-mounted dialog that opens
// in response to the `luxe:open-quick-add-client` window event (fired from
// the Cmd+K palette).

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone is required'),
  tags: z.string().optional(),
});

type FormState = z.infer<typeof schema>;
const EMPTY: FormState = { name: '', email: '', phone: '', tags: '' };

export default function QuickAddClient() {
  const navigate = useNavigate();
  const addClient = useStore((s) => s.addClient);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('luxe:open-quick-add-client', onOpen);
    return () => window.removeEventListener('luxe:open-quick-add-client', onOpen);
  }, []);

  // Reset form when dialog closes.
  useEffect(() => {
    if (!open) setForm(EMPTY);
  }, [open]);

  const handleSave = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const created = addClient({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      preferences: '',
      allergies: '',
      tags: form.tags?.split(',').map((t) => t.trim()).filter(Boolean),
    });
    toast.success(`Added ${created.name}`);
    setOpen(false);
    navigate(`/admin/clients/${created.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qac-name">Full name *</Label>
            <Input
              id="qac-name"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qac-phone">Phone *</Label>
              <Input
                id="qac-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qac-email">Email *</Label>
              <Input
                id="qac-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@email.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qac-tags">Tags <span className="text-xs text-muted-foreground">(comma-separated, optional)</span></Label>
            <Input
              id="qac-tags"
              value={form.tags ?? ''}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="VIP, Color, Weekends"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Add client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
