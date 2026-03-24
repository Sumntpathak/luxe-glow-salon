

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Download, Users, Mail, Phone, Star, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Client } from '@/types';

const tierColors: Record<string, string> = {
  Gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  Silver: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  Bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function AdminClientsPage() {
  const { clients, bookings, services, staff } = useStore();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesTier = tierFilter === 'all' || c.loyaltyTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [clients, search, tierFilter]);

  const getClientBookings = (clientId: string) =>
    bookings.filter((b) => b.clientId === clientId);

  const getServiceById = (id: string) => services.find((s) => s.id === id);
  const getStaffById = (id: string) => staff.find((s) => s.id === id);

  const getTotalSpent = (clientId: string) => {
    return getClientBookings(clientId)
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => {
        const service = getServiceById(b.serviceId);
        return sum + (service?.price ?? 0);
      }, 0);
  };

  const exportCSV = () => {
    const header = 'Name,Email,Phone,Loyalty Tier,Points,Total Bookings';
    const rows = clients.map((c) => {
      const totalBookings = getClientBookings(c.id).length;
      return `"${c.name}","${c.email}","${c.phone}","${c.loyaltyTier}",${c.loyaltyPoints},${totalBookings}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clients.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Client data exported successfully');
  };

  const clientBookings = selectedClient
    ? getClientBookings(selectedClient.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your salon clients and view their profiles"
        action={
          <Button onClick={exportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Table */}
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients found"
              description="No clients match your current search or filter criteria."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Loyalty Tier</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const totalBookings = getClientBookings(client.id).length;
                    return (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedClient(client)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={tierColors[client.loyaltyTier]}
                          >
                            {client.loyaltyTier}
                          </Badge>
                        </TableCell>
                        <TableCell>{client.loyaltyPoints}</TableCell>
                        <TableCell>{totalBookings}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Profile Dialog */}
      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>Client Profile</DialogTitle>
              </DialogHeader>

              {/* Profile Header */}
              <div className="flex items-center gap-4 mt-2">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedClient.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedClient.phone}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Preferences</p>
                  <p className="text-sm">{selectedClient.preferences || 'None specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Allergies</p>
                  <p className="text-sm">{selectedClient.allergies || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Loyalty Tier</p>
                  <Badge
                    variant="secondary"
                    className={tierColors[selectedClient.loyaltyTier]}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {selectedClient.loyaltyTier}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Loyalty Points</p>
                  <p className="text-sm font-semibold">{selectedClient.loyaltyPoints} pts</p>
                </div>
              </div>

              <Separator />

              {/* Tabs: Booking History & Spend Summary */}
              <Tabs defaultValue="bookings">
                <TabsList>
                  <TabsTrigger value="bookings">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Booking History
                  </TabsTrigger>
                  <TabsTrigger value="spend">Spend Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings">
                  {clientBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No bookings found for this client.
                    </p>
                  ) : (
                    <div className="rounded-md border mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientBookings.map((booking) => {
                            const service = getServiceById(booking.serviceId);
                            const staffMember = getStaffById(booking.staffId);
                            return (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  {format(parseISO(booking.date), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>{service?.name ?? 'Unknown'}</TableCell>
                                <TableCell>{staffMember?.name ?? 'Unknown'}</TableCell>
                                <TableCell>
                                  <StatusBadge status={booking.status} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="spend">
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Amount Spent (Completed Bookings)
                    </p>
                    <p className="text-3xl font-bold">
                      ${getTotalSpent(selectedClient.id).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across{' '}
                      {
                        clientBookings.filter((b) => b.status === 'completed')
                          .length
                      }{' '}
                      completed booking
                      {clientBookings.filter((b) => b.status === 'completed')
                        .length !== 1
                        ? 's'
                        : ''}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
