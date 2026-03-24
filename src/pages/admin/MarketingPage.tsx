

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus,
  Send,
  Mail,
  MessageSquare,
  Gift,
  Copy,
  Percent,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function AdminMarketingPage() {
  const {
    campaigns,
    addCampaign,
    updateCampaign,
    coupons,
    addCoupon,
    salonSettings,
    updateSalonSettings,
  } = useStore();

  // Campaign dialog
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'SMS' | 'Email'>('Email');
  const [campaignSegment, setCampaignSegment] = useState<string>('all');
  const [campaignMessage, setCampaignMessage] = useState('');

  // Coupon dialog
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');

  // Loyalty settings
  const [loyaltyPointsPerUnit, setLoyaltyPointsPerUnit] = useState(
    salonSettings.loyaltySettings.pointsPerCurrencyUnit
  );
  const [bronzeThreshold, setBronzeThreshold] = useState(
    salonSettings.loyaltySettings.bronzeThreshold
  );
  const [silverThreshold, setSilverThreshold] = useState(
    salonSettings.loyaltySettings.silverThreshold
  );
  const [goldThreshold, setGoldThreshold] = useState(
    salonSettings.loyaltySettings.goldThreshold
  );

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !campaignMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name: campaignName.trim(),
      type: campaignType,
      targetSegment: campaignSegment as 'all' | 'new' | 'lapsed' | 'gold' | 'silver' | 'bronze',
      messageBody: campaignMessage.trim(),
      status: 'draft' as const,
      openRate: 0,
      createdAt: new Date().toISOString(),
    };

    addCampaign(newCampaign);
    toast.success('Campaign created successfully');
    setCampaignDialogOpen(false);
    setCampaignName('');
    setCampaignType('Email');
    setCampaignSegment('all');
    setCampaignMessage('');
  };

  const handleSendCampaign = (id: string) => {
    const openRate = Math.floor(Math.random() * 26) + 20; // 20-45%
    updateCampaign(id, { status: 'sent', openRate });
    toast.success('Campaign sent successfully!');
  };

  const handleCreateCoupon = () => {
    if (!couponCode.trim() || !couponDiscount || !couponExpiry) {
      toast.error('Please fill in all fields');
      return;
    }

    const newCoupon = {
      id: `coupon-${Date.now()}`,
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponDiscount),
      expiryDate: couponExpiry,
      isActive: true,
    };

    addCoupon(newCoupon);
    toast.success('Coupon created successfully');
    setCouponDialogOpen(false);
    setCouponCode('');
    setCouponDiscount('');
    setCouponExpiry('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  const handleSaveLoyaltySettings = () => {
    updateSalonSettings({
      loyaltySettings: {
        pointsPerCurrencyUnit: loyaltyPointsPerUnit,
        bronzeThreshold,
        silverThreshold,
        goldThreshold,
      },
    });
    toast.success('Loyalty settings updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description="Manage campaigns, loyalty program, and coupons"
      />

      <Tabs defaultValue="campaigns">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCampaignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns yet"
              description="Create your first marketing campaign to engage with your clients."
              action={
                <Button onClick={() => setCampaignDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <Badge
                        variant={campaign.status === 'sent' ? 'default' : 'secondary'}
                        className={
                          campaign.status === 'sent'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          campaign.type === 'SMS'
                            ? 'border-blue-300 text-blue-700'
                            : 'border-purple-300 text-purple-700'
                        }
                      >
                        {campaign.type === 'SMS' ? (
                          <MessageSquare className="h-3 w-3 mr-1" />
                        ) : (
                          <Mail className="h-3 w-3 mr-1" />
                        )}
                        {campaign.type}
                      </Badge>
                      <Badge variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {campaign.targetSegment}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.messageBody}
                    </p>

                    {campaign.status === 'sent' && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Open rate: </span>
                        <span className="font-semibold">{campaign.openRate}%</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created {format(parseISO(campaign.createdAt), 'MMM d, yyyy')}
                    </div>

                    {campaign.status === 'draft' && (
                      <>
                        <Separator />
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleSendCampaign(campaign.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Campaign
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Campaign Dialog */}
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Summer Sale Blast"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={campaignType}
                    onValueChange={(v) => setCampaignType(v as 'SMS' | 'Email')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Segment</Label>
                  <Select
                    value={campaignSegment}
                    onValueChange={(v) => setCampaignSegment(v ?? 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="new">New Clients</SelectItem>
                      <SelectItem value="lapsed">Lapsed Clients</SelectItem>
                      <SelectItem value="gold">Gold Tier</SelectItem>
                      <SelectItem value="silver">Silver Tier</SelectItem>
                      <SelectItem value="bronze">Bronze Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-message">Message Body</Label>
                  <Textarea
                    id="campaign-message"
                    placeholder="Write your campaign message..."
                    rows={4}
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-800">Bronze Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-700">
                  {salonSettings.loyaltySettings.bronzeThreshold}
                </p>
                <p className="text-sm text-amber-600">points threshold</p>
              </CardContent>
            </Card>

            <Card className="border-gray-300 bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-600">Silver Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-600">
                  {salonSettings.loyaltySettings.silverThreshold}
                </p>
                <p className="text-sm text-gray-500">points threshold</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-300 bg-yellow-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-yellow-700">Gold Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {salonSettings.loyaltySettings.goldThreshold}
                </p>
                <p className="text-sm text-yellow-600">points threshold</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Loyalty Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="points-per-unit">Points per Currency Unit</Label>
                  <Input
                    id="points-per-unit"
                    type="number"
                    min={1}
                    value={loyaltyPointsPerUnit}
                    onChange={(e) => setLoyaltyPointsPerUnit(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bronze-threshold">Bronze Threshold</Label>
                  <Input
                    id="bronze-threshold"
                    type="number"
                    min={0}
                    value={bronzeThreshold}
                    onChange={(e) => setBronzeThreshold(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="silver-threshold">Silver Threshold</Label>
                  <Input
                    id="silver-threshold"
                    type="number"
                    min={0}
                    value={silverThreshold}
                    onChange={(e) => setSilverThreshold(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gold-threshold">Gold Threshold</Label>
                  <Input
                    id="gold-threshold"
                    type="number"
                    min={0}
                    value={goldThreshold}
                    onChange={(e) => setGoldThreshold(Number(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveLoyaltySettings}>
                Save Loyalty Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCouponDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Coupon
            </Button>
          </div>

          {coupons.length === 0 ? (
            <EmptyState
              icon={Percent}
              title="No coupons yet"
              description="Generate discount coupons for your clients."
              action={
                <Button onClick={() => setCouponDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Coupon
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-bold tracking-wider">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-purple-300 text-purple-700"
                      >
                        <Percent className="h-3 w-3 mr-1" />
                        {coupon.discountPercent}% off
                      </Badge>
                      <Badge
                        variant={coupon.isActive ? 'default' : 'secondary'}
                        className={
                          coupon.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                        }
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Expires {format(parseISO(coupon.expiryDate), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Generate Coupon Dialog */}
          <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Coupon Code</Label>
                  <Input
                    id="coupon-code"
                    placeholder="e.g., SUMMER25"
                    className="font-mono uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-discount">Discount %</Label>
                  <Input
                    id="coupon-discount"
                    type="number"
                    min={1}
                    max={100}
                    placeholder="e.g., 25"
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-expiry">Expiry Date</Label>
                  <Input
                    id="coupon-expiry"
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleCreateCoupon}>
                  Generate Coupon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
