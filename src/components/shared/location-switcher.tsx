import { useStore } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, ChevronsUpDown, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function LocationSwitcher() {
  const { locations, currentLocationId, currentOrgId, setCurrentLocation } = useStore();
  const [open, setOpen] = useState(false);

  const orgLocations = locations.filter(l => l.orgId === currentOrgId && l.isActive);
  const current = orgLocations.find(l => l.id === currentLocationId);

  // Hide when there's only one location — nothing to switch
  if (orgLocations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span className="truncate max-w-[200px]">{current?.name || '—'}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-muted/60 transition border border-border/50 bg-background">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="truncate max-w-[180px] font-medium">{current?.name || 'Select location'}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1" align="start">
        <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground">Switch location</div>
        <div className="space-y-0.5">
          {orgLocations.map(loc => {
            const active = loc.id === currentLocationId;
            return (
              <button
                key={loc.id}
                onClick={() => { setCurrentLocation(loc.id); setOpen(false); }}
                className={`w-full flex items-start gap-2 p-2 rounded-md text-left text-sm hover:bg-muted transition ${
                  active ? 'bg-muted/60' : ''
                }`}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{loc.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{loc.address}</div>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/50 mt-1 pt-1">
          <Link
            to="/admin/locations"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Plus className="h-4 w-4" />
            Manage locations
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
