'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Utensils, Leaf, Clock, AlertTriangle, IndianRupee, Wallet, BadgeCheck, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type PeopleOption = '1 person' | '2 people' | '3 people' | '4 people' | '5-6 people' | '7-8 people';
type MealOption = 'Breakfast' | 'Lunch' | 'Dinner' | 'Breakfast & Lunch' | 'All 3 meals';
type DietOption = 'Veg' | 'Veg + Non-Veg';

const peopleOptions: PeopleOption[] = ['1 person', '2 people', '3 people', '4 people', '5-6 people', '7-8 people'];
const mealOptions: MealOption[] = ['Breakfast', 'Lunch', 'Dinner', 'Breakfast & Lunch', 'All 3 meals'];
const dietOptions: DietOption[] = ['Veg', 'Veg + Non-Veg'];

const breakfastSlots = ['08:00', '09:00', '10:00'];
const lunchSlots = ['11:00', '12:00', '13:00', '14:00', '15:00'];
const dinnerSlots = ['16:00', '17:00', '18:00', '19:00', '20:00'];


const planDetails: Record<string, { name: string, basePrice: number, days: number, baseTime: number }> = {
    day: { name: 'Daily Plan', basePrice: 200, days: 1, baseTime: 45 },
    weekly: { name: 'Weekly Plan', basePrice: 980, days: 7, baseTime: 60 },
    monthly: { name: 'Monthly Plan', basePrice: 3300, days: 30, baseTime: 75 },
}

const PRICING_CONSTANTS = {
  // Table 1: Standard Time Slots (in Minutes)
  // Logic: How long does it take to cook?
  // Maps: People Count -> Meal Type -> Minutes
  TIME_SLOTS: {
    '1': { single: 45, dual: 72, triple: 117 },
    '2': { single: 65, dual: 104, triple: 169 },
    '3': { single: 85, dual: 136, triple: 221 },
    '4': { single: 105, dual: 168, triple: 273 },
    '5': { single: 125, dual: 200, triple: 325 },
    '6': { single: 145, dual: 232, triple: 377 },
    '7': { single: 165, dual: 264, triple: 429 },
    '8': { single: 165, dual: 264, triple: 429 }
  },

  // Table 2: RPM (Rate Per Minute in INR)
  // Logic: Cost per minute varies by commitment (Monthly is cheaper)
  // Maps: People Count -> Plan Type -> Rate
  RPM: {
    '1': { daily: 4.4444, weekly: 3.1111, monthly: 2.4444 },
    '2': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '3': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '4': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '5': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '6': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '7': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '8': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 }
  }
};

const getGeneratedPrice = (planType: 'day' | 'weekly' | 'monthly', peopleCount: number, mealConfig: string) => {
    // 1. Normalize Inputs
    const pCount = Math.min(Math.max(peopleCount, 1), 8).toString() as keyof typeof PRICING_CONSTANTS.TIME_SLOTS;
    const type = planType.toLowerCase() as 'day' | 'weekly' | 'monthly';
    
    // 2. Determine Meal Category (Single, Dual, Triple)
    let mealCategory: 'single' | 'dual' | 'triple' = 'single';
    const config = mealConfig.toLowerCase();
    
    if (config.includes('all 3 meals')) {
        mealCategory = 'triple';
    } else if (config.includes('&')) {
        mealCategory = 'dual';
    }
  
    // 3. Fetch Variables from Constants
    const minutesRequired = PRICING_CONSTANTS.TIME_SLOTS[pCount][mealCategory];
    const ratePerMinute = PRICING_CONSTANTS.RPM[pCount][type];
  
    // 4. Determine Duration Multiplier
    let days = 1;
    if (type === 'weekly') days = 7;
    if (type === 'monthly') days = 30;
  
    // 5. The Formula
    const rawPrice = minutesRequired * ratePerMinute * days;
  
    console.log("Pricing Calc:", { mins: minutesRequired, rpm: ratePerMinute, days, total: rawPrice });
  
    return Math.round(rawPrice);
};


function ChoiceButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      type="button"
      className={cn(
        'h-auto py-3 px-5 text-base justify-center bg-white border-gray-300 text-text-secondary hover:bg-cta-bg hover:text-cta-text hover:border-cta-bg',
        isSelected && 'bg-[#fde047] text-black border-amber-400 hover:bg-[#fde047]/90 hover:text-black'
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function BookingStepper() {
  const { user, purchaseSubscription, checkBalance } = useCulinaryStore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [people, setPeople] = useState<PeopleOption | null>(null);
  const [meals, setMeals] = useState<MealOption | null>(null);
  const [diet, setDiet] = useState<DietOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [dinnerTimeSlot, setDinnerTimeSlot] = useState<string | null>(null);

  const plan = searchParams.get('plan') || 'day';
  const currentPlan = planDetails[plan] || planDetails.day;
  
  const planEndDate = startDate ? addDays(startDate, currentPlan.days - 1) : null;

  const { singleSlots, breakfastLunchSlots } = useMemo(() => {
    let slots: string[] = [];
    if (!meals) {
      return { singleSlots: [], breakfastLunchSlots: [] };
    }
    if (meals.includes('Breakfast')) slots.push(...breakfastSlots);
    if (meals.includes('Lunch')) slots.push(...lunchSlots);
    if (meals.includes('Dinner')) slots.push(...dinnerSlots);
    
    return {
      singleSlots: [...new Set(slots)].sort(),
      breakfastLunchSlots: [...new Set([...breakfastSlots, ...lunchSlots])].sort()
    };
  }, [meals]);


  // Reset time slot if meal selection changes and the current slot is no longer valid
  useEffect(() => {
    if (timeSlot && !singleSlots.includes(timeSlot) && meals !== 'All 3 meals') {
      setTimeSlot(null);
    }
     if (meals !== 'All 3 meals') {
      setDinnerTimeSlot(null);
    }
  }, [singleSlots, timeSlot, meals]);

  const totalPlanCost = useMemo(() => {
    if (!people || !meals) return currentPlan.basePrice;
    
    const peopleCount = parseInt(people.split(' ')[0], 10) || 1;
    
    return getGeneratedPrice(plan as 'day' | 'weekly' | 'monthly', peopleCount, meals);

  }, [people, meals, currentPlan, plan]);

  const hasSufficientBalance = checkBalance(totalPlanCost);
  const balanceDifference = totalPlanCost - (user.walletBalance || 0);

  const handlePurchase = async () => {
    if (!people || !meals || !diet || !startDate || !timeSlot) {
        toast({ title: 'Missing selections', description: 'Please complete all options, including date and time.', variant: 'destructive'});
        return;
    }
    if (meals === 'All 3 meals' && !dinnerTimeSlot) {
        toast({ title: 'Missing Dinner Slot', description: 'Please select a time for your dinner preparation.', variant: 'destructive'});
        return;
    }
    if (!hasSufficientBalance) {
        const params = new URLSearchParams(window.location.search);
        params.set('requiredAmount', balanceDifference.toString());
        router.push(`/wallet?${params.toString()}`);
        return;
    }
    
    setIsSubmitting(true);
    try {
        await purchaseSubscription({
            type: plan as 'weekly' | 'monthly',
            cost: totalPlanCost,
            configuration: { people, meals, diet, timeSlot, dinnerTimeSlot },
            startDate,
        });
        toast({
            title: 'Plan Activated!',
            description: `Your ${currentPlan.name} is now active.`,
        });
        router.push('/dashboard');
    } catch (error: any) {
        toast({
            title: 'Purchase Failed',
            description: error.message || 'Could not activate the plan.',
            variant: 'destructive'
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const isNextDisabled = !people || !meals || !diet || isSubmitting || (plan !== 'day' && (!timeSlot || (meals === 'All 3 meals' && !dinnerTimeSlot)));


  // For Daily plan, we don't purchase upfront, we just go to slots.
  if (plan === 'day') {
    const handleNext = () => {
        const params = new URLSearchParams();
        params.set('plan', plan);
        params.set('people', people || '');
        params.set('meals', meals || '');
        params.set('diet', diet || '');
        router.push(`/booking/menu?${params.toString()}`);
    };

    return (
        <Card className="max-w-3xl mx-auto">
             <CardHeader>
                <CardTitle className="font-headline text-3xl">Configure Your Daily Visit</CardTitle>
                <CardDescription>
                Tell us your preferences, and we'll help you find the perfect cook for today.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> How many people?</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {peopleOptions.map((option) => (
                        <ChoiceButton key={option} label={option} isSelected={people === option} onClick={() => setPeople(option)} />
                        ))}
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Utensils className="h-5 w-5 text-primary"/> How many meals?</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {mealOptions.map((option) => (
                        <ChoiceButton key={option} label={option} isSelected={meals === option} onClick={() => setMeals(option)} />
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Leaf className="h-5 w-5 text-primary"/> Veg/Non Veg?</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {dietOptions.map((option) => (
                        <ChoiceButton key={option} label={option} isSelected={diet === option} onClick={() => setDiet(option)} />
                        ))}
                    </div>
                </div>
            </CardContent>
             <CardFooter className="flex-col sm:flex-row items-center justify-end gap-4">
                <Button size="lg" disabled={!people || !meals || !diet} onClick={handleNext} className="w-full sm:w-auto">
                Next: Select Dishes <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
  }

  // UI for Weekly & Monthly plan purchase
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Confirm Your Meal Plan</CardTitle>
        <CardDescription>
          You're subscribing to the <span className="font-semibold text-primary">{currentPlan.name}</span>.
          Please confirm your household settings for this subscription period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> How many people are there at home?</h3>
                <p className="text-muted-foreground">This will be locked for the duration of the plan.</p>
            </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {peopleOptions.map((option) => (
              <ChoiceButton key={option} label={option} isSelected={people === option} onClick={() => setPeople(option)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Utensils className="h-5 w-5 text-primary"/> How many meals per day?</h3>
                <p className="text-muted-foreground">This setting will apply to all your bookings under this plan.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {mealOptions.map((option) => (
              <ChoiceButton key={option} label={option} isSelected={meals === option} onClick={() => setMeals(option)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
             <div className="space-y-1">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Leaf className="h-5 w-5 text-primary"/> Veg/Non Veg?</h3>
                 <p className="text-muted-foreground">Your preference for this subscription period.</p>
            </div>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map((option) => (
              <ChoiceButton key={option} label={option} isSelected={diet === option} onClick={() => setDiet(option)} />
            ))}
          </div>
        </div>

        {diet === 'Veg + Non-Veg' && (
            <Alert variant="destructive" className="bg-amber-500/5 border-amber-500/20 text-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Non-Veg Selection</AlertTitle>
                <AlertDescription className="text-amber-700">
                    Note: Complex meat dishes may require additional time overage. Final cost will be confirmed after dish selection.
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary"/> Plan Start Date</h3>
                 <p className="text-muted-foreground">Choose when you want your subscription to begin.</p>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                    />
                </PopoverContent>
            </Popover>
            {startDate && planEndDate && (
                <p className="text-sm font-semibold text-muted-foreground">
                    Plan will be valid from {format(startDate, "MMM d, yyyy")} to {format(planEndDate, "MMM d, yyyy")}.
                </p>
            )}
        </div>

         {startDate && meals && (
            meals === 'All 3 meals' ? (
                <div className="space-y-8">
                     <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Breakfast & Lunch Slot</h3>
                            <p className="text-muted-foreground">Select a time for your morning/afternoon cook.</p>
                        </div>
                         <RadioGroup
                            value={timeSlot || ''}
                            onValueChange={(value: string) => setTimeSlot(value)}
                            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                        >
                            {breakfastLunchSlots.map(slot => (
                                <Label key={slot} htmlFor={`slot-main-${slot}`} className={cn(
                                    "flex items-center justify-center p-3 rounded-md border-2 transition-all cursor-pointer",
                                    timeSlot === slot ? "bg-amber-300 text-black border-amber-400" : "bg-white border-gray-300"
                                )}>
                                    <RadioGroupItem value={slot} id={`slot-main-${slot}`} className="sr-only" />
                                    <span>{slot}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                     <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Dinner Slot</h3>
                            <p className="text-muted-foreground">Select a time for your evening cook.</p>
                        </div>
                         <RadioGroup
                            value={dinnerTimeSlot || ''}
                            onValueChange={(value: string) => setDinnerTimeSlot(value)}
                            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                        >
                            {dinnerSlots.map(slot => (
                                <Label key={slot} htmlFor={`slot-dinner-${slot}`} className={cn(
                                    "flex items-center justify-center p-3 rounded-md border-2 transition-all cursor-pointer",
                                    dinnerTimeSlot === slot ? "bg-amber-300 text-black border-amber-400" : "bg-white border-gray-300"
                                )}>
                                    <RadioGroupItem value={slot} id={`slot-dinner-${slot}`} className="sr-only" />
                                    <span>{slot}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Preferred Time Slot</h3>
                        <p className="text-muted-foreground">This will be your default daily booking time.</p>
                    </div>
                    <RadioGroup
                        value={timeSlot || ''}
                        onValueChange={(value: string) => setTimeSlot(value)}
                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                    >
                        {singleSlots.map(slot => (
                            <Label key={slot} htmlFor={`slot-${slot}`} className={cn(
                                "flex items-center justify-center p-3 rounded-md border-2 transition-all cursor-pointer",
                                timeSlot === slot ? "bg-amber-300 text-black border-amber-400" : "bg-white border-gray-300"
                            )}>
                                <RadioGroupItem value={slot} id={`slot-${slot}`} className="sr-only" />
                                <span>{slot}</span>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
            )
        )}
      </CardContent>
       <CardFooter className="bg-muted/50 p-4 border-t flex flex-col items-stretch gap-2">
           <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4"/> Wallet Balance</span>
                <span className="font-semibold">₹{(user.walletBalance || 0).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Plan Cost</span>
                <span className="text-primary">₹{totalPlanCost.toLocaleString('en-IN')}</span>
           </div>
           {hasSufficientBalance ? (
                <Button size="lg" disabled={isNextDisabled} onClick={handlePurchase} className="w-full mt-2">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                    Pay ₹{totalPlanCost.toLocaleString('en-IN')} & Activate Plan
                </Button>
           ) : (
                <div className="text-center space-y-2 mt-2">
                    <p className="text-destructive text-sm font-semibold">Insufficient Balance (Short by ₹{balanceDifference.toLocaleString('en-IN')})</p>
                    <Button size="lg" disabled={isNextDisabled} onClick={handlePurchase} className="w-full">
                        <Wallet className="mr-2 h-4 w-4" />
                        Recharge Wallet
                    </Button>
                </div>
           )}
      </CardFooter>
    </Card>
  );
}
