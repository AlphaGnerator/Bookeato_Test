'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Utensils, Leaf, Clock, AlertTriangle, IndianRupee, Wallet, BadgeCheck, Loader2, Calendar as CalendarIcon, Sparkles, PartyPopper } from 'lucide-react';
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
    party: { name: 'Party Order', basePrice: 100, days: 1, baseTime: 45 },
}

const mealPhotos: Record<MealOption, string> = {
  'Breakfast': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop',
  'Lunch': 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=600&auto=format&fit=crop',
  'Dinner': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=600&auto=format&fit=crop',
  'Breakfast & Lunch': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop',
  'All 3 meals': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=600&auto=format&fit=crop',
};

const PRICING_CONSTANTS = {
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

const getGeneratedPrice = (planType: string, peopleCount: number, mealConfig: string) => {
    const pCount = Math.min(Math.max(peopleCount, 1), 8).toString() as keyof typeof PRICING_CONSTANTS.TIME_SLOTS;
    const type = (planType === 'day' ? 'daily' : planType === 'party' ? 'daily' : planType.toLowerCase()) as 'daily' | 'weekly' | 'monthly';
    
    let mealCategory: 'single' | 'dual' | 'triple' = 'single';
    const config = mealConfig.toLowerCase();
    
    if (config.includes('all 3 meals')) {
        mealCategory = 'triple';
    } else if (config.includes('&')) {
        mealCategory = 'dual';
    }
  
    const minutesRequired = PRICING_CONSTANTS.TIME_SLOTS[pCount][mealCategory];
    const ratePerMinute = PRICING_CONSTANTS.RPM[pCount][type];
  
    let days = 1;
    if (type === 'weekly') days = 7;
    if (type === 'monthly') days = 30;
  
    const rawPrice = minutesRequired * ratePerMinute * days;
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
  const [selectedPopularPlan, setSelectedPopularPlan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [dinnerTimeSlot, setDinnerTimeSlot] = useState<string | null>(null);

  const [plan, setPlan] = useState<'day' | 'weekly' | 'monthly'>(() => (searchParams.get('plan') as any) || 'day');
  const currentPlan = planDetails[plan] || planDetails.day;
  
  const planEndDate = startDate ? addDays(startDate, currentPlan.days - 1) : null;

  const availableMealOptions = useMemo(() => {
    if (plan === 'day') {
      return ['Breakfast', 'Lunch', 'Dinner'] as MealOption[];
    }
    return mealOptions;
  }, [plan]);

  useEffect(() => {
    if (plan === 'day' && (meals === 'Breakfast & Lunch' || meals === 'All 3 meals')) {
      setMeals(null);
    }
  }, [plan, meals]);

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
  
  const isNextDisabled = !people || !meals || !diet || isSubmitting || 
    (plan !== 'day' && (!timeSlot || (meals === 'All 3 meals' && !dinnerTimeSlot))) ||
    (plan === 'day' && !timeSlot);

  const handleNext = () => {
      const params = new URLSearchParams();
      params.set('plan', plan);
      params.set('people', people || '');
      params.set('meals', meals || '');
      params.set('diet', diet || '');
      if (plan === 'day') {
          params.set('date', startDate ? format(startDate, 'yyyy-MM-dd') : '');
          params.set('timeSlot', timeSlot || '');
      }
      router.push(`/booking/menu?${params.toString()}`);
  };

  return (
    <Card id="booking-stepper" className="max-w-3xl mx-auto border-4 border-stone-100 shadow-xl shadow-stone-200/50 rounded-[2rem] overflow-hidden bg-white scroll-mt-24">
      <CardHeader className="bg-stone-50/50 border-b border-stone-100 pb-6">
        <CardTitle className="font-black text-3xl text-stone-900">
          {plan === 'day' ? 'Configure Your Daily Visit' : 'Confirm Your Meal Plan'}
        </CardTitle>
        <CardDescription className="text-stone-500 font-medium">
          {plan === 'day' 
            ? "Tell us your preferences, and we'll help you find the perfect cook for today."
            : `You're subscribing to the ${currentPlan.name}. Please confirm your household settings for this subscription period.`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-10 pt-8">
        {/* 1. Plan Selector */}
        <div className="space-y-4">
          <div className="space-y-1 flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <CalendarIcon className="h-5 w-5 text-[#3bc166]"/> Select Plan
            </h3>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <PartyPopper className="w-3 h-3 text-orange-500" /> Need Bulk Catering? Choose Party Order
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-100 p-1.5 rounded-2xl">
            {[
              { id: 'day', label: 'One time visit' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'party', label: 'Party Order 🎉' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === 'party') {
                    router.push('/live');
                  } else {
                    setPlan(opt.id as any);
                  }
                }}
                className={cn(
                  "py-3 px-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1",
                  opt.id === 'party'
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 shadow-md hover:from-orange-400 hover:to-amber-400 font-black animate-pulse"
                    : plan === opt.id 
                    ? "bg-[#3bc166] text-white shadow-md shadow-emerald-100 scale-[1.01]" 
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. People Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <Users className="h-5 w-5 text-[#3bc166]"/> 
              {plan === 'day' ? 'How many people?' : 'How many people are there at home?'}
            </h3>
            {plan !== 'day' && <p className="text-stone-400 text-xs font-semibold">This will be locked for the duration of the plan.</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {peopleOptions.map((option) => (
              <ChoiceButton key={option} label={option} isSelected={people === option} onClick={() => setPeople(option)} />
            ))}
          </div>
        </div>

        {/* 3. Diet Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <Leaf className="h-5 w-5 text-[#3bc166]"/> Veg/Non Veg?
            </h3>
            {plan !== 'day' && <p className="text-stone-400 text-xs font-semibold">Your preference for this subscription period.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map((option) => (
              <ChoiceButton key={option} label={option} isSelected={diet === option} onClick={() => setDiet(option)} />
            ))}
          </div>
        </div>

        {diet === 'Veg + Non-Veg' && plan !== 'day' && (
          <Alert variant="destructive" className="bg-amber-500/5 border-amber-500/20 text-amber-700 rounded-2xl p-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold">Non-Veg Selection</AlertTitle>
            <AlertDescription className="text-amber-700">
              Note: Complex meat dishes may require additional time overage. Final cost will be confirmed after dish selection.
            </AlertDescription>
          </Alert>
        )}

        {/* 4. Meals Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
              <Utensils className="h-5 w-5 text-[#3bc166]"/> Meals
            </h3>
            {plan !== 'day' && <p className="text-stone-400 text-xs font-semibold">This setting will apply to all your bookings under this plan.</p>}
          </div>
          <div className={cn(
            "grid gap-2 sm:gap-4",
            plan === 'day' ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-3 lg:grid-cols-5"
          )}>
            {availableMealOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMeals(option)}
                className={cn(
                  "relative overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-300 flex flex-col items-center group h-24 sm:h-36 w-full shadow-sm",
                  meals === option 
                    ? "border-amber-400 bg-amber-50 scale-[1.02] shadow-md shadow-amber-100" 
                    : "border-stone-100 bg-white hover:border-stone-200"
                )}
              >
                <div className="relative w-full flex-1 overflow-hidden bg-stone-100">
                  <Image 
                    src={mealPhotos[option]} 
                    alt={option} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-1.5 sm:bottom-3 inset-x-0 text-center px-1 sm:px-2">
                  <span className="text-[11px] sm:text-sm font-black text-white drop-shadow-md leading-tight block">{option}</span>
                </div>
                {meals === option && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-400 text-black p-0.5 rounded-full shadow-md">
                    <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Date & Time Slots */}
        <>
          <div className="space-y-4 pt-6 border-t border-stone-100">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
                <CalendarIcon className="h-5 w-5 text-[#3bc166]"/> {plan === 'day' ? 'Date' : 'Plan Start Date'}
              </h3>
              <p className="text-stone-400 text-xs font-semibold">{plan === 'day' ? 'Choose when you want the cook to visit.' : 'Choose when you want your subscription to begin.'}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-semibold h-12 rounded-xl border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Selection */}
          {meals && (
            <div className="space-y-6 pt-6 border-t border-stone-100">
              <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
                <Clock className="h-5 w-5 text-[#3bc166]" /> Preferred Cooking Time
              </h3>
              {meals === 'All 3 meals' ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-stone-600 text-xs uppercase tracking-widest">Breakfast & Lunch Preparation</Label>
                    <RadioGroup value={timeSlot || ''} onValueChange={setTimeSlot} className="grid grid-cols-3 gap-2">
                      {breakfastLunchSlots.map((slot) => (
                        <div key={slot}>
                          <RadioGroupItem value={slot} id={`bl-${slot}`} className="sr-only" />
                          <Label
                            htmlFor={`bl-${slot}`}
                            className={cn(
                              "flex items-center justify-center h-11 border-2 rounded-xl font-bold text-sm cursor-pointer transition-all",
                              timeSlot === slot 
                                ? "border-amber-400 bg-amber-50 text-amber-900" 
                                : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100"
                            )}
                          >
                              {slot}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-stone-600 text-xs uppercase tracking-widest">Dinner Preparation</Label>
                    <RadioGroup value={dinnerTimeSlot || ''} onValueChange={setDinnerTimeSlot} className="grid grid-cols-3 gap-2">
                      {dinnerSlots.map((slot) => (
                        <div key={slot}>
                          <RadioGroupItem value={slot} id={`d-${slot}`} className="sr-only" />
                          <Label
                            htmlFor={`d-${slot}`}
                            className={cn(
                              "flex items-center justify-center h-11 border-2 rounded-xl font-bold text-sm cursor-pointer transition-all",
                              dinnerTimeSlot === slot 
                                ? "border-amber-400 bg-amber-50 text-amber-900" 
                                : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100"
                            )}
                          >
                            {slot}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="font-bold text-stone-600 text-xs uppercase tracking-widest">Select Cooking Time</Label>
                  <RadioGroup value={timeSlot || ''} onValueChange={setTimeSlot} className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {singleSlots.map((slot) => (
                      <div key={slot}>
                        <RadioGroupItem value={slot} id={`slot-${slot}`} className="sr-only" />
                        <Label
                          htmlFor={`slot-${slot}`}
                          className={cn(
                            "flex items-center justify-center h-11 border-2 rounded-xl font-bold text-sm cursor-pointer transition-all",
                            timeSlot === slot 
                              ? "border-amber-400 bg-amber-50 text-amber-900" 
                              : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100"
                          )}
                        >
                          {slot}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
        </>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-4 border-t border-stone-100 pt-6 bg-stone-50/30">
        {plan === 'day' ? (
          <div className="flex justify-end">
            <Button size="lg" disabled={isNextDisabled} onClick={handleNext} className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold bg-[#3bc166] text-white hover:bg-[#3bc166]/90 transition-colors shadow-md shadow-emerald-100">
              Next: Select Dishes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center text-sm font-semibold text-stone-600">
              <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-[#3bc166]"/> Wallet Balance</span>
              <span className="font-bold text-stone-800">₹{(user.walletBalance || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center font-black text-xl text-stone-900">
              <span>Total Plan Cost</span>
              <span className="text-[#3bc166]">₹{totalPlanCost.toLocaleString('en-IN')}</span>
            </div>
            {hasSufficientBalance ? (
              <Button size="lg" disabled={isNextDisabled} onClick={handlePurchase} className="w-full h-12 rounded-xl font-black bg-[#3bc166] text-white hover:bg-[#3bc166]/90 shadow-md shadow-emerald-100 transition-all">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    Confirm & Activate Plan <BadgeCheck className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center space-y-2 mt-2 w-full">
                <p className="text-red-500 text-sm font-black uppercase tracking-wider">Insufficient Balance (Short by ₹{balanceDifference.toLocaleString('en-IN')})</p>
                <Button size="lg" disabled={isNextDisabled} onClick={handlePurchase} className="w-full h-12 rounded-xl font-black bg-amber-400 hover:bg-amber-500 text-stone-900 shadow-md shadow-amber-100 transition-all">
                  <Wallet className="mr-2 h-4 w-4" />
                  Recharge Wallet
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
