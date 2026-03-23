'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Hash, Clock, AlertTriangle, BadgeCheck, ArrowLeft, Lock, Star, ShoppingBasket, Loader2, User as UserIcon, Wallet, MapPin, Minus, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { calculateTotalCookingTime } from '@/lib/timeEngine';
import { calculatePriceScenarios } from '@/lib/pricing-calculator';
import { type PriceScenario, type BillBreakdownItem } from '@/lib/pricing.types';
import type { Dish, DraftBooking, DraftBookingItem } from '@/lib/types';
import { getGeneratedPrice } from '@/lib/subscription-calculator-client';
import { Progress } from '@/components/ui/progress';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LoginForm } from '@/app/login/login-form';
import { SignUpForm } from '@/app/signup/signup-form';

interface Plan {
    id: 'day' | 'weekly' | 'monthly';
    name: string;
    description: string;
    cost: number;
    savings?: string;
    perDayCost?: number;
    breakdown?: BillBreakdownItem[];
}

// --- Sub-Components for Checkout Page ---

function BookingDetailsCard({ 
    draft, 
    guestConfig,
    onPortionChange
}: { 
    draft: DraftBooking, 
    guestConfig: { pincode: string; familySize: number },
    onPortionChange: (dishId: string, delta: number) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Pincode</p>
                            <p className="font-semibold">{guestConfig.pincode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Family Size</p>
                            <p className="font-semibold">{guestConfig.familySize} {guestConfig.familySize > 1 ? 'people' : 'person'}</p>
                        </div>
                    </div>
                </div>
                <p className="text-sm font-medium">
                    For: {format(new Date(draft.bookingDate), 'PPP, p')}
                </p>
                <Separator />
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Selected Dishes:</h4>
                    <ul className="space-y-3">
                        {draft.items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate pr-4">{item.dishName}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => onPortionChange(item.dishId, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-4 text-center font-bold">{item.numberOfPortions}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => onPortionChange(item.dishId, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

function PricingDetailsCard({ timeResult, priceScenario }: { timeResult: { total_minutes: number }, priceScenario: PriceScenario }) {
    if (!timeResult || !priceScenario) {
        return <Skeleton className="h-56 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Time & Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-center bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Estimated Cooking Time</p>
                    <p className="text-4xl font-bold">{timeResult.total_minutes} <span className="text-xl font-medium">mins</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">Portion scaling applied: each extra portion adds a fraction of cooking time.</p>
                </div>
                <div className="space-y-2 pt-2 text-sm">
                    {priceScenario.current_bill.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                    <Separator className="my-2 !mt-3" />
                    <div className="flex justify-between items-center font-bold text-lg pt-1">
                        <span>Total for this visit</span>
                        <span>₹{priceScenario.current_bill.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                    {`Your base session covers up to ${priceScenario.plan_details?.plan_limit_minutes || 'standard'} minutes based on your selection. Any additional time is charged as overage.`}
                </p>
            </CardContent>
        </Card>
    )
}

function PlanSelectionCard({ planOptions, selectedPlan, onSelectPlan }: { planOptions: Plan[], selectedPlan: Plan['id'], onSelectPlan: (planId: Plan['id']) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Plan</CardTitle>
        <CardDescription>Select a plan to get the best value for your booking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {planOptions.map(plan => (
          <Card
            key={plan.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedPlan === plan.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
            )}
            onClick={() => onSelectPlan(plan.id)}
          >
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold">{plan.name}</h4>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <p className="text-xl font-bold whitespace-nowrap">₹{plan.cost.toLocaleString()}</p>
                </div>
                {(plan.savings || plan.perDayCost) && (
                    <div className="flex items-center gap-2 mt-2">
                        {plan.savings && <Badge variant="destructive">{plan.savings}</Badge>}
                        {plan.perDayCost && <Badge variant="outline">~₹{plan.perDayCost.toLocaleString()}/day</Badge>}
                    </div>
                )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

// --- Main Page Component ---

export default function UnifiedCheckoutPage() {
    const { 
        guestConfig, 
        draftBookings, 
        dishes, 
        user: appUser,
        isInitialized,
        executeUnifiedCheckout,
        addOrUpdateDraftBooking,
        removeDraftBooking
    } = useCulinaryStore();

    const { user } = useUser();
    const router = useRouter();

    const [selectedPlan, setSelectedPlan] = useState<'day' | 'weekly' | 'monthly'>('day');
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentDraft = useMemo(() => draftBookings?.[0], [draftBookings]);

    const handlePortionChange = (dishId: string, delta: number) => {
        if (!currentDraft) return;
        
        const updatedItems = currentDraft.items.map(item => {
            if (item.dishId === dishId) {
                return { ...item, numberOfPortions: item.numberOfPortions + delta };
            }
            return item;
        }).filter(item => item.numberOfPortions > 0);

        if (updatedItems.length === 0) {
            removeDraftBooking(currentDraft.bookingDate);
        } else {
            addOrUpdateDraftBooking({ ...currentDraft, items: updatedItems });
        }
    };
    
    const selectedDishes = useMemo(() => {
        if (!currentDraft || !dishes) return [];
        return currentDraft.items.map(item => {
            const dish = dishes.find(d => d.id === item.dishId);
            return dish ? { ...dish, qty: item.numberOfPortions } : null;
        }).filter((d): d is (Dish & { qty: number }) => d !== null);
    }, [currentDraft, dishes]);
    
    const familySize = user ? appUser.familySize : guestConfig?.familySize || 1;
    
    const mealCategory = useMemo(() => {
        if (!currentDraft) return 'single';
        const mealType = currentDraft.mealType || '';
        if (mealType.includes('All 3 meals')) return 'triple';
        if (mealType.includes('&')) return 'dual';
        return 'single' as 'single' | 'dual' | 'triple';
    }, [currentDraft]);

    const timeResult = useMemo(() => {
        if (selectedDishes.length > 0 && familySize) {
            return calculateTotalCookingTime(familySize, selectedDishes);
        }
        return null;
    }, [selectedDishes, familySize]);
    
    const priceScenario = useMemo(() => {
        if (timeResult?.total_minutes && isInitialized) {
            return calculatePriceScenarios(timeResult.total_minutes, familySize, selectedPlan, mealCategory);
        }
        return null;
    }, [timeResult, isInitialized, familySize, selectedPlan, mealCategory]);

    const planOptions: Plan[] = useMemo(() => {
        if (!familySize || !mealCategory) return [];

        const baseDailyCost = getGeneratedPrice('day', familySize, mealCategory);
        const weeklyCost = getGeneratedPrice('weekly', familySize, mealCategory);
        const monthlyCost = getGeneratedPrice('monthly', familySize, mealCategory);
        
        const weeklySavings = baseDailyCost > 0 ? Math.round(((baseDailyCost * 7 - weeklyCost) / (baseDailyCost * 7)) * 100) : 0;
        const monthlySavings = baseDailyCost > 0 ? Math.round(((baseDailyCost * 30 - monthlyCost) / (baseDailyCost * 30)) * 100) : 0;

        return [
            { id: 'day', name: 'Single Day Visit', description: 'Pay for just this one session.', cost: priceScenario?.current_bill.amount || baseDailyCost },
            { id: 'weekly', name: 'Weekly Plan', description: 'Commit for a week and save.', cost: weeklyCost, savings: `Save ~${weeklySavings}%`, perDayCost: Math.round(weeklyCost / 7) },
            { id: 'monthly', name: 'Monthly Plan', description: 'Best value for regular service.', cost: monthlyCost, savings: `Save ~${monthlySavings}%`, perDayCost: Math.round(monthlyCost / 30) },
        ]
    }, [familySize, mealCategory, priceScenario]);

    const totalPlanCost = planOptions.find(p => p.id === selectedPlan)?.cost || 0;
    const walletBalance = appUser.walletBalance || 0;
    const balanceDifference = totalPlanCost - walletBalance;
    const canAfford = balanceDifference <= 0;
    const requiredRecharge = canAfford ? 0 : balanceDifference;

    useEffect(() => {
        if (user) {
            setIsAuthDialogOpen(false);
        }
    }, [user]);
    
    const handleConfirmBooking = async () => {
        if (!currentDraft) return;

        if (!user) {
            setIsAuthDialogOpen(true);
            return;
        }
        
        if (!canAfford) {
            router.push(`/wallet?redirect=/booking/checkout&requiredAmount=${requiredRecharge}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const planToPurchase = {
                type: selectedPlan,
                cost: totalPlanCost,
                configuration: {
                    people: `${familySize} ${familySize > 1 ? 'people' : 'person'}`,
                    meals: currentDraft.mealType,
                    diet: 'Veg', // Placeholder
                    timeSlot: format(new Date(currentDraft.bookingDate), 'HH:mm'),
                },
                startDate: new Date(currentDraft.bookingDate),
            };
            await executeUnifiedCheckout(planToPurchase, 0); // No recharge needed here
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Checkout failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (!isInitialized) {
        return (
             <div className="max-w-xl mx-auto pt-6 pb-32 px-4 space-y-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-8 w-48 mt-4" />
                <Skeleton className="h-40 w-full mt-8" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }
    
    if (!currentDraft || !guestConfig) {
        return (
            <div className="max-w-xl mx-auto pt-6 pb-32 px-4 space-y-6 text-center">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Missing Booking Details</AlertTitle>
                    <AlertDescription>
                        We couldn't find your dish selections or location details.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/booking/menu')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Menu
                </Button>
            </div>
        );
    }

    return (
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <div className="max-w-xl mx-auto pt-6 pb-32 px-4 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/booking/menu')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
            </Button>
            
            <header className="space-y-1">
                <h1 className="text-3xl font-bold font-headline">Review & Pay</h1>
                <p className="text-muted-foreground">Please confirm the details of your cooking session.</p>
            </header>
            
            <div className="space-y-6">
                <BookingDetailsCard 
                    draft={currentDraft} 
                    guestConfig={guestConfig} 
                    onPortionChange={handlePortionChange}
                />
                {timeResult && priceScenario && (
                    <PricingDetailsCard timeResult={timeResult} priceScenario={priceScenario} />
                )}
                <PlanSelectionCard 
                    planOptions={planOptions}
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                />
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t z-50">
                <div className="max-w-xl mx-auto flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Payable</p>
                        <p className="text-2xl font-bold">₹{totalPlanCost.toLocaleString('en-IN')}</p>
                    </div>
                     <Button size="lg" onClick={handleConfirmBooking} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {!user ? (
                            <>
                                <Lock className="mr-2 h-4 w-4" /> Login to Continue
                            </>
                        ) : !canAfford ? (
                           <>
                                <Wallet className="mr-2 h-4 w-4" />
                                Add ₹{requiredRecharge.toLocaleString('en-IN')} & Continue
                           </>
                        ) : (
                           <>
                                <BadgeCheck className="mr-2 h-5 w-5" />
                                Pay & Confirm
                           </>
                        )}
                    </Button>
                </div>
            </div>
        </div>

        <DialogContent>
            <DialogHeader>
                <DialogTitle>Almost there!</DialogTitle>
                <DialogDescription>
                    Log in or create an account to finalize your booking.
                </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="login" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="pt-4">
                    <LoginForm onSuccess={() => setIsAuthDialogOpen(false)} />
                </TabsContent>
                <TabsContent value="signup" className="pt-4">
                    <SignUpForm onSuccess={() => setIsAuthDialogOpen(false)} />
                </TabsContent>
            </Tabs>
        </DialogContent>
      </Dialog>
    );
}
