
'use client';

import { useMemo, useState } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, BadgePercent, Calendar, XCircle, Users, Utensils, Check, IndianRupee, Hash, Leaf, Ban, RefreshCcw, Loader2, Hourglass, Edit, PlusCircle, ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseISO, format, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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

function PlanSkeleton() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

function DetailItem({ icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) {
    const Icon = icon;
    return (
        <div className="p-4 rounded-lg bg-background flex flex-col items-center justify-center text-center">
            <Icon className="h-7 w-7 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-lg">{value}</p>
        </div>
    )
}


export function PlanDetailsView() {
    const router = useRouter();
    const { user, isInitialized, cancelCurrentPlan, requestPlanModification } = useCulinaryStore();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    
    const sub = user.subscription;

    if (!isInitialized) {
        return <PlanSkeleton />;
    }
    
    if (!sub || sub.status === 'none' || sub.status === 'cancelled' || sub.status === 'expired') {
        return (
            <Card className="max-w-3xl mx-auto text-center">
                <CardHeader>
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <CardTitle>No Active Plan</CardTitle>
                    <CardDescription>You do not currently have an active subscription.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/pricing">Explore Plans</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
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
    };
    
    const handleRequestModification = async () => {
        setIsRequesting(true);
        try {
            await requestPlanModification();
             toast({
                title: "Request Submitted",
                description: "Your plan modification request has been sent to the admin for approval."
            });
        } catch (e: any) {
             toast({
                title: "Request Failed",
                description: e.message || "Could not submit your request.",
                variant: "destructive"
            });
        } finally {
            setIsRequesting(false);
        }
    }

    const startDate = parseISO(sub.startDate);
    const expiryDate = parseISO(sub.expiryDate);
    const planTypeDisplayName = sub.planId.charAt(0).toUpperCase() + sub.planId.slice(1);
    const isRefundable = isFuture(startDate);

    const statusBadge = {
        active: <Badge className="bg-green-600 text-white">Active</Badge>,
        upcoming: <Badge className="bg-blue-500 text-white">Upcoming</Badge>,
    }

    return (
        <AlertDialog>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm flex-shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-headline text-4xl">Your Plan Details</h1>
                        <p className="text-muted-foreground mt-1">A read-only overview of your current subscription.</p>
                    </div>
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{planTypeDisplayName} Subscription</CardTitle>
                                <CardDescription>Status: {statusBadge[sub.status as keyof typeof statusBadge] || <Badge variant="secondary">{sub.status}</Badge>}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">₹{sub.cost.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-muted-foreground">Amount Paid</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm p-3 rounded-md bg-muted">
                            <Calendar className="h-4 w-4" />
                            <span>Valid from <strong>{format(startDate, 'MMM d, yyyy')}</strong> to <strong>{format(expiryDate, 'MMM d, yyyy')}</strong></span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Plan Configuration</CardTitle>
                        <CardDescription>These are the locked-in settings for the duration of your plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem icon={Users} label="Household Size" value={sub.config.people} />
                        <DetailItem icon={Utensils} label="Meal Service" value={sub.config.meals} />
                        <DetailItem icon={Leaf} label="Dietary Type" value={sub.config.diet} />
                        {sub.totalVisits && (
                             <DetailItem 
                                icon={BarChart3} 
                                label="Consumption" 
                                value={`${sub.usedVisits || 0} / ${sub.totalVisits} Sessions`} 
                            />
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Management</CardTitle>
                        <CardDescription>Actions for your subscription.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Ban className="mr-2 h-4 w-4" /> Cancel Plan
                                </Button>
                            </AlertDialogTrigger>
                            
                            {sub.modificationStatus === 'requested' ? (
                                <Button variant="outline" disabled className="w-full">
                                    <Hourglass className="mr-2 h-4 w-4 animate-spin" /> Modification Requested
                                </Button>
                            ) : sub.modificationStatus === 'approved' ? (
                                <Button className="w-full" variant="secondary">
                                    <Check className="mr-2 h-4 w-4" /> Edit Your Plan
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full" onClick={handleRequestModification} disabled={isRequesting}>
                                    {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                                    Request Modification
                                </Button>
                            )}
                        </div>
                        <Separator />
                        <Button asChild className="w-full">
                          <Link href="/pricing">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Plan
                          </Link>
                        </Button>
                    </CardContent>
                </Card>

            </div>
            
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isRefundable ? (
                            <>
                                This plan has not started yet. If you cancel now, you will receive a full refund of
                                <span className="font-bold"> ₹{sub.cost.toLocaleString('en-IN')} </span>
                                to your wallet.
                            </>
                        ) : (
                            "This plan is already active and is non-refundable. Cancelling now will prevent future renewals but will not issue a refund for the current period."
                        )}
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
