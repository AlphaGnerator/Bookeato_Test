
'use client';

import { useMemo, useState } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, BadgePercent, Calendar, XCircle, MoreVertical, Ban, RefreshCcw, Loader2, Users, Utensils, Leaf } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO, format, isFuture, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export function PlanStatusCard() {
    const { user, cancelCurrentPlan } = useCulinaryStore();
    const router = useRouter();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = useState(false);
    
    const currentSub = user.subscription;
    const planState = useMemo(() => {
        if (!currentSub || currentSub.status === 'none') return 'NO_PLAN';
        if (currentSub.status === 'cancelled') return 'CANCELLED';
        if (currentSub.status === 'expired') return 'EXPIRED';

        const today = new Date();
        const startDate = parseISO(currentSub.startDate);
        const expiryDate = parseISO(currentSub.expiryDate);
        
        if (isPast(expiryDate)) return 'EXPIRED';
        if (isFuture(startDate)) return 'UPCOMING';
        
        return 'ACTIVE';
    }, [currentSub]);


    const locationDisplay = user.pincode || '...';

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await cancelCurrentPlan();
            toast({
                title: "Plan Cancelled",
                description: "Your subscription has been successfully cancelled."
            });
        } catch (e: any) {
            toast({
                title: "Cancellation Failed",
                description: e.message || "Could not cancel your plan.",
                variant: "destructive"
            });
        } finally {
            setIsCancelling(false);
        }
    }


    // State A: NO_PLAN
    if (planState === 'NO_PLAN') {
        return (
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Standard Account</span>
                        <BadgePercent className="h-6 w-6 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>You are currently on a pay-per-visit basis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-center">
                    <p className="font-semibold text-lg text-primary">Save up to 40% on every meal!</p>
                     <Button asChild variant="cta" size="lg" className="w-full sm:w-auto">
                        <Link href="/pricing">View Membership Plans</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (planState === 'EXPIRED' || planState === 'CANCELLED') {
        return (
             <Card className="bg-destructive/10 border-destructive/20 text-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Plan {planState === 'EXPIRED' ? 'Expired' : 'Cancelled'}</span>
                        <XCircle className="h-6 w-6" />
                    </CardTitle>
                    <CardDescription className="text-destructive/80">
                        Your previous plan is no longer active.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="cta" className="w-full">
                        <Link href="/pricing">Renew Your Plan</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const startDate = parseISO(user.subscription!.startDate);
    const expiryDate = parseISO(user.subscription!.expiryDate);
    const planTypeDisplayName = user.subscription!.planId === 'weekly' ? 'Weekly Subscription' : 'Monthly Peace Plan';


    // State: UPCOMING
    if (planState === 'UPCOMING') {
        const daysUntilStart = differenceInDays(startDate, new Date());
        return (
            <AlertDialog>
                 <Card className="bg-gradient-to-tr from-cyan-400 to-blue-500 text-white border-blue-500 transition-all hover:shadow-lg">
                    <Link href="/plan-details">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{planTypeDisplayName}</span>
                                <Calendar className="h-6 w-6" />
                            </CardTitle>
                            <CardDescription className="text-white/80">Your plan for {locationDisplay} is scheduled to begin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">Starts in {daysUntilStart} day{daysUntilStart > 1 ? 's' : ''}</p>
                                <p className="font-semibold">On {format(startDate, "EEE, MMM d")}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-white/20">
                                <div className="p-1">
                                    <Users className="h-5 w-5 mx-auto mb-1 text-white/80" />
                                    <p className="font-bold text-white text-sm truncate">{user.subscription?.config.people}</p>
                                </div>
                                <div className="p-1">
                                    <Utensils className="h-5 w-5 mx-auto mb-1 text-white/80" />
                                    <p className="font-bold text-white text-sm truncate">{user.subscription?.config.meals}</p>
                                </div>
                                <div className="p-1">
                                    <Leaf className="h-5 w-5 mx-auto mb-1 text-white/80" />
                                    <p className="font-bold text-white text-sm truncate">{user.subscription?.config.diet}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                     <CardFooter className="p-4 pt-0">
                         <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10 text-xs">
                                Cancel Plan
                            </Button>
                        </AlertDialogTrigger>
                    </CardFooter>
                </Card>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Upcoming Plan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This plan has not started yet. If you cancel now, you will receive a full refund of
                        <span className="font-bold"> ₹{(user.subscription?.cost || 0).toLocaleString('en-IN')} </span>
                        to your wallet. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Yes, Cancel & Refund
                      </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }
    
    // State: ACTIVE
    const totalDaysInPlan = differenceInDays(expiryDate, startDate) + 1;
    const daysElapsed = differenceInDays(new Date(), startDate);
    const progress = (daysElapsed / totalDaysInPlan) * 100;
    const isEndingSoon = differenceInDays(expiryDate, new Date()) < 3;


    return (
        <AlertDialog>
             <Card className="bg-gradient-to-tr from-amber-400 to-yellow-300 text-yellow-900 border-amber-500 transition-all hover:shadow-lg">
                <CardHeader className="cursor-pointer" onClick={() => router.push('/plan-details')}>
                    
                        <CardTitle className="flex items-center justify-between">
                            <span>{planTypeDisplayName}</span>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-900 text-white">Active</Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-900 hover:bg-white/20">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                                <Ban className="mr-2 h-4 w-4" />
                                                <span>Cancel Plan</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardTitle>
                        <CardDescription className="text-yellow-800/80">
                            Active for {locationDisplay} until {format(expiryDate, "MMM d, yyyy")}.
                        </CardDescription>
                    
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/20 p-2 rounded-md">
                            <Users className="h-5 w-5 mx-auto mb-1 text-yellow-800" />
                            <p className="font-bold text-yellow-900 text-sm truncate">{user.subscription?.config.people}</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-md">
                            <Utensils className="h-5 w-5 mx-auto mb-1 text-yellow-800" />
                            <p className="font-bold text-yellow-900 text-sm truncate">{user.subscription?.config.meals}</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-md">
                            <Leaf className="h-5 w-5 mx-auto mb-1 text-yellow-800" />
                            <p className="font-bold text-yellow-900 text-sm truncate">{user.subscription?.config.diet}</p>
                        </div>
                    </div>
                     <div>
                        <div className="flex justify-between text-sm font-medium text-yellow-900/90 mb-1">
                            <span>Day {daysElapsed + 1} of {totalDaysInPlan}</span>
                        </div>
                        <Progress value={progress} className="h-2 [&>div]:bg-yellow-900 bg-white/50" />
                    </div>
                     <Button 
                        asChild 
                        variant="secondaryCta" 
                        className="w-full bg-white/30 text-yellow-900 border-yellow-800/50 hover:bg-white/50"
                    >
                        {user.subscription?.planId === 'weekly' ? (
                            <Link href="/pricing/upgrade">
                                <Sparkles className="mr-2 h-4 w-4"/>Upgrade to Monthly
                            </Link>
                        ) : (
                             <Link href="/plan-details">
                                {isEndingSoon ? <><RefreshCcw className="mr-2 h-4 w-4"/>Renew Plan</> : <><Sparkles className="mr-2 h-4 w-4"/>View Plan Details</>}
                            </Link>
                        )}
                    </Button>
                </CardContent>
            </Card>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Active Plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This plan is already active and is non-refundable. Cancelling now will prevent future renewals but will not issue a refund for the current period. Are you sure you want to proceed?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">
                         {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Yes, Cancel Plan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
