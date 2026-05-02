

import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Award, Star } from 'lucide-react';
import { Client } from '@/types';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  avatar: z.string().url('Must be a valid URL').or(z.literal('')),
  preferences: z.string(),
  allergies: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

import { TIER_BADGE_CLASS } from '@/lib/ui/palettes';

export default function ProfilePage() {
  const { currentUser, updateClient } = useStore();
  const client = currentUser as Client | null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
      avatar: client?.avatar || '',
      preferences: client?.preferences || '',
      allergies: client?.allergies || '',
    },
  });

  const avatarUrl = watch('avatar');

  const onSubmit = (data: ProfileFormData) => {
    if (!client) return;
    updateClient(client.id, {
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      preferences: data.preferences,
      allergies: data.allergies,
    });
    toast.success('Profile updated successfully');
  };

  if (!client) {
    return <p className="text-muted-foreground">Please log in to view your profile.</p>;
  }

  const tierClassName = TIER_BADGE_CLASS[client.loyaltyTier] ?? TIER_BADGE_CLASS.Bronze;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your personal information and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarUrl} alt={client.name} />
                    <AvatarFallback className="text-lg">
                      {client.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" placeholder="https://example.com/photo.jpg" {...register('avatar')} />
                  {errors.avatar && (
                    <p className="text-sm text-destructive">{errors.avatar.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferences">Service Preferences</Label>
                  <Textarea
                    id="preferences"
                    placeholder="E.g., Prefer balayage technique, like layers cut with scissors not razor..."
                    rows={3}
                    {...register('preferences')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies / Health Notes</Label>
                  <Textarea
                    id="allergies"
                    placeholder="E.g., Allergic to parabens, sensitive scalp..."
                    rows={3}
                    {...register('allergies')}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!isDirty}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 mb-3">
                  <Star className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mb-2">
                  <Badge className={tierClassName} variant="secondary">
                    {client.loyaltyTier} Tier
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{client.loyaltyPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Tier</span>
                  <span className="font-medium">{client.loyaltyTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referral Code</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {client.referralCode}
                  </span>
                </div>
              </div>

              <a href="/consumer/rewards" className="block">
                <Button variant="outline" className="w-full">
                  View Rewards
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
