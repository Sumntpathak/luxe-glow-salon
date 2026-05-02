

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Users,
  Mail,
  Phone,
  Heart,
  AlertTriangle,
  Award,
  CalendarDays,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Client } from '@/types';

import { TIER_BADGE_CLASS as tierColors } from '@/lib/ui/palettes';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StaffClientsPage() {
  const { currentUser, bookings, clients, services } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Derive clients from bookings assigned to this staff member
  const myClients = useMemo(() => {
    if (!currentUser) return [];
    const myBookings = bookings.filter((b) => b.staffId === currentUser.id);
    const uniqueClientIds = Array.from(new Set(myBookings.map((b) => b.clientId)));
    return clients.filter((c) => uniqueClientIds.includes(c.id));
  }, [currentUser, bookings, clients]);

  // Filter by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return myClients;
    const q = searchQuery.toLowerCase();
    return myClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [myClients, searchQuery]);

  // Get the last visit date for a client (most recent completed or confirmed booking with this staff)
  const getLastVisit = (clientId: string): string | null => {
    if (!currentUser) return null;
    const clientBookings = bookings
      .filter(
        (b) =>
          b.clientId === clientId &&
          b.staffId === currentUser.id &&
          (b.status === 'completed' || b.status === 'confirmed')
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    return clientBookings.length > 0 ? clientBookings[0].date : null;
  };

  // Get all bookings for a specific client with this staff member
  const getClientBookings = (clientId: string) => {
    if (!currentUser) return [];
    return bookings
      .filter((b) => b.clientId === clientId && b.staffId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  // Resolve service name by ID
  const getServiceName = (serviceId: string): string => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Clients"
        description="Clients who have bookings with you"
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={
            searchQuery
              ? 'No clients match your search. Try a different name.'
              : 'You do not have any clients yet. Clients will appear here once they book with you.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const lastVisit = getLastVisit(client.id);
            return (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        <Badge
                          variant="secondary"
                          className={tierColors[client.loyaltyTier] || ''}
                        >
                          {client.loyaltyTier}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                        {lastVisit && (
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span>Last visit: {format(parseISO(lastVisit), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Client Detail Dialog */}
      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null);
        }}
      >
        {selectedClient && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Profile</DialogTitle>
            </DialogHeader>

            {/* Client Info Header */}
            <div className="flex items-center gap-4 mt-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{selectedClient.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedClient.phone}</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  Booking History
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <h4 className="font-medium text-sm">Preferences</h4>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {selectedClient.preferences || 'No preferences specified.'}
                  </p>
                </div>

                {/* Allergies / Health Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium text-sm">Allergies / Health Notes</h4>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {selectedClient.allergies || 'None noted.'}
                  </p>
                </div>

                {/* Loyalty */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium text-sm">Loyalty Program</h4>
                  </div>
                  <div className="flex items-center gap-3 pl-6">
                    <Badge
                      variant="secondary"
                      className={tierColors[selectedClient.loyaltyTier] || ''}
                    >
                      {selectedClient.loyaltyTier} Tier
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedClient.loyaltyPoints.toLocaleString()} points
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Booking History Tab */}
              <TabsContent value="history" className="mt-4">
                {(() => {
                  const clientBookings = getClientBookings(selectedClient.id);
                  if (clientBookings.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No booking history with you yet.
                      </p>
                    );
                  }
                  return (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Service</th>
                            <th className="text-left p-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientBookings.map((booking) => (
                            <tr key={booking.id} className="border-b last:border-0">
                              <td className="p-3">
                                {format(parseISO(booking.date), 'MMM d, yyyy')}
                              </td>
                              <td className="p-3">{getServiceName(booking.serviceId)}</td>
                              <td className="p-3">
                                <StatusBadge status={booking.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
