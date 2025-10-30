'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { customerPortalAction, unsubscribeAction } from '@/lib/payments/actions';
import { useActionState } from 'react';
import { User, TokenAccount } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember } from '@/app/(login)/actions';
import useSWR from 'swr';
import { Suspense, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';

type ActionState = {
  error?: string;
  success?: string;
};

type UserWithTokenAccount = User & {
  tokenAccount: TokenAccount | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeState, unsubscribeActionHandler] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      setIsUnsubscribing(true);
      try {
        await unsubscribeAction(formData);
        setShowUnsubscribeDialog(false);
        setIsUnsubscribing(false);
        return { success: 'Successfully unsubscribed from your plan' };
      } catch (error) {
        setIsUnsubscribing(false);
        // Re-throw redirect errors so they can be handled by Next.js
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
          throw error;
        }
        console.error('Unsubscribe error:', error);
        return { error: 'Failed to unsubscribe. Please try again.' };
      }
    },
    { error: '', success: '' }
  );

  if (!user) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading subscription...</p>
        </CardContent>
      </Card>
    );
  }

  const { tokenAccount } = user;
  const hasActiveSubscription = tokenAccount?.stripeSubscriptionId && tokenAccount?.subscriptionStatus === 'active';
  const planName = tokenAccount?.planCode || 'FREE';

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <p className="font-medium">
                  Current Plan: {planName === 'FREE' ? 'Free' : planName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveSubscription 
                    ? `Status: ${tokenAccount.subscriptionStatus}`
                    : 'No active subscription'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {hasActiveSubscription ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/pricing">
                        Change Plan
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowUnsubscribeDialog(true)}
                    >
                      Unsubscribe
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/pricing">
                      Upgrade Plan
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showUnsubscribeDialog} onClose={() => setShowUnsubscribeDialog(false)}>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Are you sure you want to unsubscribe?
          </h3>
          <p className="text-gray-600">
            You will lose access to your current plan features immediately. 
            Your account will be downgraded to the free plan.
          </p>
          {unsubscribeState.error && (
            <p className="text-red-600 text-sm">{unsubscribeState.error}</p>
          )}
          <form action={unsubscribeActionHandler} className="contents">
            <div className="flex gap-3 justify-center pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowUnsubscribeDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={isUnsubscribing}
              >
                {isUnsubscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  'Yes, Unsubscribe'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
}

function UserProfileSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserProfile() {
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);

  if (!user) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.photoUrl || ''} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        {user.lastLoginAt && (
          <p className="text-sm text-muted-foreground mt-4">
            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TokenBalanceSkeleton() {
  return (
    <Card className="h-[140px]">
      <CardHeader>
        <CardTitle>Token Balance</CardTitle>
      </CardHeader>
    </Card>
  );
}

function TokenBalance() {
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading balance...</p>
        </CardContent>
      </Card>
    );
  }

  const { tokenAccount } = user;
  const balance = tokenAccount?.balance || 0;
  const planName = tokenAccount?.planCode || 'FREE';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-orange-500">
              {balance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Available tokens
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Current plan: {planName === 'FREE' ? 'Free' : planName}</p>
            {tokenAccount?.nextRefillAt && (
              <p>Next refill: {new Date(tokenAccount.nextRefillAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for unsubscribe success message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('unsubscribed') === 'true') {
        setShowSuccess(true);
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
  }, []);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Dashboard</h1>
      
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Successfully unsubscribed from your plan. Your account has been downgraded to the free plan.
          </p>
        </div>
      )}

      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<TokenBalanceSkeleton />}>
        <TokenBalance />
      </Suspense>
    </section>
  );
}
