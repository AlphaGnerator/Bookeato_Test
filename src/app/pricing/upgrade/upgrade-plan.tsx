

'use client';

import React, { useState, useEffect } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { calculateUpgradeQuote, type UpgradeQuote } from '@/lib/upgrade-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, BadgeCheck, Check, Info, Loader2, Sparkles, Tag, Users, Utensils, Wallet, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function UpgradeSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
}

export function UpgradePlan() {
    const { user, isInitialized, checkBalance, upgradeSubscription } = useCulinaryStore();
    const router = useRouter();
    const { toast } = useToast();

    const [quote, setQuote] = useState<UpgradeQuote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isInitialized) {
            if (user.subscription?.planId?.toLowerCase() !== 'weekly') {
                router.replace('/pricing');
                return;
            }
            
            calculateUpgradeQuote(user).then(res => {
                setQuote(res);
                setIsLoading(false);
            });
        }
    }, [isInitialized, user, router]);

    const handleUpgrade = async () => {
        if (!quote) return;

        if (!checkBalance(quote.finalPayable)) {
             toast({
                title: 'Insufficient Balance',
                description: `You need ₹${quote.finalPayable.toLocaleString('en-IN')} to upgrade. Please recharge your wallet.`,
                variant: 'destructive',
            });
            router.push('/wallet');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await upgradeSubscription({
                newPlanType: 'monthly',
                netAmount: quote.finalPayable,
                fullMonthlyCost: quote.newMonthlyCost,
            });
            toast({
                title: 'Upgrade Successful!',
                description: 'You are now on the Monthly Peace Plan.',
            });
            router.push('/dashboard');
        } catch (e: any) {
            toast({
                title: 'Upgrade Failed',
                description: e.message || 'Could not process your upgrade.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }


    if (isLoading || !isInitialized) {
        return <UpgradeSkeleton />;
    }

    if (!quote) {
        return (
             <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Cannot Calculate Upgrade</AlertTitle>
                  <AlertDescription>
                    We could not calculate an upgrade price at this moment. This might be because your current plan is not eligible or pricing is not configured for your area.
                  </AlertDescription>
                </Alert>
            </div>
        )
    }

    const canAfford = checkBalance(quote.finalPayable);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            
            <Alert variant="default" className="bg-blue-100/50 border-blue-500/30 text-blue-800">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-bold text-blue-900">Upgrade Effective Tomorrow</AlertTitle>
                <AlertDescription>
                    Your new Monthly plan will begin on <strong>{format(quote.newStartDate, 'MMM d, yyyy')}</strong>. Your current plan remains active for today's meals.
                </AlertDescription>
            </Alert>


            <Card>
                <CardHeader>
                    <CardTitle>Your Plan Configuration</CardTitle>
                    <CardDescription>Your new monthly plan will inherit these settings. They cannot be changed during an upgrade.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-muted/50 p-4 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="font-bold">{user.subscription?.config?.people}</p>
                    </Card>
                     <Card className="bg-muted/50 p-4 text-center">
                        <Utensils className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="font-bold">{user.subscription?.config?.meals}</p>
                    </Card>
                     <Card className="bg-muted/50 p-4 text-center">
                        <Check className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="font-bold">{user.subscription?.config?.diet}</p>
                    </Card>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Upgrade Transparency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>New Monthly Peace Plan Cost</span> <span>₹{quote.newMonthlyCost.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between text-green-600">
                        <span>Credit for Unused Days ({quote.daysCredited} approx.)</span> 
                        <span>-₹{quote.credit.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Net Payable Now</span>
                        <span>₹{quote.finalPayable.toLocaleString('en-IN')}</span>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary"/> Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Available Wallet Balance</span>
                        <span className="font-bold">₹{(user.walletBalance || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {!canAfford && (
                         <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Insufficient Balance</AlertTitle>
                            <AlertDescription>
                                You need to add at least ₹{(quote.finalPayable - (user.walletBalance || 0)).toLocaleString('en-IN')} to your wallet to complete this upgrade.
                            </AlertDescription>
                        </Alert>
                    )}
                     <Button size="lg" className="w-full" onClick={handleUpgrade} disabled={isSubmitting}>
                         {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                            <BadgeCheck className="mr-2 h-4 w-4" />
                         )}
                        {canAfford ? `Pay ₹${quote.finalPayable.toLocaleString('en-IN')} & Upgrade` : 'Recharge Wallet & Upgrade'}
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
