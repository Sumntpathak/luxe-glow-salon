

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Gift, Copy, Star, Trophy, History } from 'lucide-react';
import { Client } from '@/types';
import toast from 'react-hot-toast';

export default function RewardsPage() {
  const { currentUser, pointsHistory, rewards, updateClient, addPoints } = useStore();
  const client = currentUser as Client | null;

  const myPointsHistory = useMemo(() => {
    if (!client) return [];
    return pointsHistory
      .filter((p) => p.clientId === client.id)
      .sort((a, b) => {
        const da = parseISO(a.date);
        const db = parseISO(b.date);
        return db.getTime() - da.getTime();
      });
  }, [pointsHistory, client]);

  const copyReferralCode = async () => {
    if (!client) return;
    try {
      await navigator.clipboard.writeText(client.referralCode);
      toast.success('Referral code copied to clipboard!');
    } catch {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const handleRedeem = (reward: (typeof rewards)[0]) => {
    if (!client) return;
    if (client.loyaltyPoints < reward.pointsCost) {
      toast.error('Not enough points to redeem this reward');
      return;
    }

    updateClient(client.id, {
      loyaltyPoints: client.loyaltyPoints - reward.pointsCost,
    });

    addPoints({
      id: `pts-${Date.now()}`,
      clientId: client.id,
      points: -reward.pointsCost,
      reason: `Redeemed: ${reward.name}`,
      date: new Date().toISOString(),
    });

    toast.success(`Redeemed "${reward.name}" - ${reward.discountPercent}% discount applied!`);
  };

  if (!client) {
    return <p className="text-muted-foreground">Please log in to view your rewards.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards & Loyalty"
        description="Track your points, redeem rewards, and share your referral code"
      />

      {/* Points Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Balance</p>
              <p className="text-2xl font-bold">{client.loyaltyPoints.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <p className="text-2xl font-bold">{client.loyaltyTier}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                {client.referralCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyReferralCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Available Rewards
          </CardTitle>
          <CardDescription>Redeem your points for discounts and perks</CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No rewards available"
              description="Check back later for new rewards!"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => {
                const canAfford = client.loyaltyPoints >= reward.pointsCost;
                return (
                  <Card key={reward.id} className={!canAfford ? 'opacity-60' : ''}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {reward.discountPercent}% off
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-medium">{reward.pointsCost.toLocaleString()} pts</span>
                        </div>
                        <Button
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => handleRedeem(reward)}
                        >
                          Redeem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Points History
          </CardTitle>
          <CardDescription>Your recent points activity</CardDescription>
        </CardHeader>
        <CardContent>
          {myPointsHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="No points history"
              description="Your points activity will appear here once you start earning or redeeming."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myPointsHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">{entry.reason}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            entry.points > 0
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-red-600 dark:text-red-400 font-medium'
                          }
                        >
                          {entry.points > 0 ? '+' : ''}
                          {entry.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
