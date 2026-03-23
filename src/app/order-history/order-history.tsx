

'use client';

import { useMemo } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Booking, Transaction } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, BadgeCheck, Hourglass, XCircle, Ban, BookOpen, Calendar, PieChart, Wallet, Award, ArrowUpCircle, ArrowDownCircle, Utensils } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

type MergedHistoryItem = (Booking & { itemType: 'booking' }) | (Transaction & { itemType: 'transaction' });

function PlanProgressCard() {
    const { bookings } = useCulinaryStore();
    
    const planDetails = useMemo(() => {
        const activeBookings = (bookings || [])
            .filter(b => b.status !== 'cancelled')
            .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
        
        if (activeBookings.length === 0) return null;

        const startDate = new Date(activeBookings[0].bookingDate);
        const endDate = new Date(activeBookings[activeBookings.length - 1].bookingDate);
        
        const duration = differenceInDays(endDate, startDate) + 1;
        
        let planType = 'Daily';
        if (duration >= 28) planType = 'Monthly';
        else if (duration >= 7) planType = 'Weekly';

        const totalDaysInPlan = planType === 'Monthly' ? 30 : planType === 'Weekly' ? 7 : 1;
        
        const uniqueDaysBooked = new Set(activeBookings.map(b => format(new Date(b.bookingDate), 'yyyy-MM-dd'))).size;
        
        const progress = Math.min((uniqueDaysBooked / totalDaysInPlan) * 100, 100);

        return {
            planType,
            daysUsed: uniqueDaysBooked,
            totalDays: totalDaysInPlan,
            progress
        };

    }, [bookings]);

    if (!planDetails) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-primary" />
                    Plan Progress
                </CardTitle>
                <CardDescription>Your current {planDetails.planType} plan usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={planDetails.progress} />
                <div className="text-sm text-muted-foreground">
                    You have used <strong>{planDetails.daysUsed}</strong> of <strong>{planDetails.totalDays}</strong> days in your plan.
                </div>
            </CardContent>
        </Card>
    );
}

function HistoryItemCard({ item }: { item: MergedHistoryItem }) {
    console.log("Rendering History Item:", { type: item.itemType, cost: (item as any).totalCost, id: item.id });
    
    if (item.itemType === 'booking') {
        const statusVariant = {
            pending: 'accent',
            confirmed: 'default',
            completed: 'default',
            cancelled: 'destructive'
        } as const;

        const statusIcon = {
            pending: <Hourglass className="mr-2 h-4 w-4"/>,
            confirmed: <BadgeCheck className="mr-2 h-4 w-4"/>,
            completed: <BadgeCheck className="mr-2 h-4 w-4" />,
            cancelled: <XCircle className="mr-2 h-4 w-4"/>
        };

        const cost = item.totalCost;
        const costDisplay = cost !== undefined && cost > 0
            ? `- ₹${cost.toLocaleString('en-IN')}`
            : '-';
        const costColor = cost !== undefined && cost > 0
            ? 'text-destructive'
            : 'text-muted-foreground';


        return (
             <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Utensils className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-lg">{format(new Date(item.bookingDate), "EEE, MMM d, yyyy 'at' p")}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                            {item.items && item.items.length > 0
                                ? item.items.map(dish => dish.dishName).join(', ')
                                : 'No dishes selected.'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Paid via Wallet</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={`font-bold text-lg ${costColor}`}>{costDisplay}</div>
                    <Badge variant={statusVariant[item.status] || 'secondary'} className="capitalize mt-1">
                        {statusIcon[item.status]}
                        {item.status}
                    </Badge>
                </div>
            </div>
        );
    }

    if (item.itemType === 'transaction') {
         const isCredit = item.type === 'recharge' || item.type === 'refund';
        const amountColor = isCredit ? 'text-green-600' : 'text-destructive';
        const amountPrefix = isCredit ? '+ ' : '- ';

        const transactionIcon = {
            subscription_purchase: <Award className="h-5 w-5 text-primary" />,
            plan_upgrade: <Award className="h-5 w-5 text-amber-500" />,
            recharge: <Wallet className="h-5 w-5 text-green-600" />,
            refund: <Wallet className="h-5 w-5 text-blue-500" />,
            booking_payment: <BookOpen className="h-5 w-5 text-primary" />
        };
        
        const transactionDate = item.date?.seconds 
            ? new Date(item.date.seconds * 1000) 
            : new Date();


        return (
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {transactionIcon[item.type]}
                    <div>
                        <h3 className="font-semibold text-lg">{item.details.description}</h3>
                        <p className="text-sm text-muted-foreground">{format(transactionDate, "EEE, MMM d, yyyy 'at' p")}</p>
                    </div>
                </div>
                <div className={`font-bold text-lg ${amountColor}`}>
                    {amountPrefix}₹{item.amount.toLocaleString('en-IN')}
                </div>
            </div>
        );
    }
    
    return null;
}

export function OrderHistory() {
  const { bookings, isInitialized: isStoreInitialized } = useCulinaryStore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const transactionsRef = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
      return collection(firestore, 'customers', firebaseUser.uid, 'transactions');
    }
    return null;
  }, [firestore, firebaseUser]);

  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsRef);

  const mergedHistory = useMemo(() => {
    if (!bookings || !transactions) return [];

    const typedBookings: MergedHistoryItem[] = bookings.map(b => ({ ...b, itemType: 'booking' }));
    const typedTransactions: MergedHistoryItem[] = transactions.map(t => ({ ...t, itemType: 'transaction' }));

    return [...typedBookings, ...typedTransactions].sort((a, b) => {
        const dateA = a.itemType === 'booking' ? new Date(a.bookingDate) : a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date();
        const dateB = b.itemType === 'booking' ? new Date(b.bookingDate) : b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date();
        return dateB.getTime() - dateA.getTime();
    });
  }, [bookings, transactions]);
  
  const isInitialized = isStoreInitialized && !areTransactionsLoading && !isUserLoading;

  if (!isInitialized) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <PlanProgressCard />
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Transaction History
                </CardTitle>
                <CardDescription>A complete log of all your bookings, plan purchases, and wallet activity.</CardDescription>
            </CardHeader>
            <CardContent>
                {mergedHistory.length > 0 ? (
                <div className="space-y-4">
                    {mergedHistory.map((item, index) => (
                    <div key={`${item.itemType}-${item.id}-${index}`}>
                        <HistoryItemCard item={item} />
                         {index < mergedHistory.length - 1 && <Separator className="my-4" />}
                    </div>
                    ))}
                </div>
                ) : (
                <Alert>
                    <Ban className="h-4 w-4" />
                    <AlertTitle>No History Found</AlertTitle>
                    <AlertDescription>
                    You haven't made any transactions yet. Once you do, they will appear here.
                    </AlertDescription>
                </Alert>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
