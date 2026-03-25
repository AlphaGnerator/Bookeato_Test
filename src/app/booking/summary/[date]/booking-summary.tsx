'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { isSameDay, format, parseISO, differenceInHours } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Utensils, Hash, Clock, AlertTriangle, BadgeCheck, Pencil, Ban, XCircle, IndianRupee, Sparkles, Wallet, Minus, Plus, Trash2, ArrowLeft, Lock, Loader2, ChevronDown, List, Calendar as CalendarIcon, Sunrise, Sun, Moon, MapPin, User as UserIcon, ChefHat } from 'lucide-react';
import { LoadingState } from "@/components/loading-state";
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Dish, DraftBookingItem, Ingredient } from '@/lib/types';
import { calculateTotalCookingTime } from '@/lib/timeEngine';
import { calculatePriceScenarios } from '@/lib/pricing-calculator';
import { useUser } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/app/login/login-form';
import { SignUpForm } from '@/app/signup/signup-form';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn, getLocationFromPincode } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';

const timeRanges = {
    Morning: ['08:00', '09:00', '10:00'],
    Afternoon: ['11:00', '12:00', '13:00', '14:00', '15:00'],
    Evening: ['16:00', '17:00', '18:00', '19:00', '20:00']
};

type TimeRangeKey = keyof typeof timeRanges;

export function BookingSummary({ date }: { date: string }) {
  const { user, draftBookings, dishes, isInitialized, guestConfig, setGuestConfig, addOrUpdateDraftBooking, removeDraftBooking, checkBalance, executeUnifiedCheckout } = useCulinaryStore();
  const { user: firebaseUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const originalDraft = useMemo(() => {
    try {
        const targetDate = parseISO(date);
        return draftBookings.find(d => isSameDay(new Date(d.bookingDate), targetDate));
    } catch (e) {
        return undefined;
    }
  }, [draftBookings, date]);

  const items = useMemo(() => {
    if (!originalDraft?.items) return [];
    const uniqueItems: DraftBookingItem[] = [];
    const seenIds = new Set();
    for (const item of originalDraft.items) {
        if (!seenIds.has(item.dishId)) {
            uniqueItems.push(item);
            seenIds.add(item.dishId);
        }
    }
    return uniqueItems;
  }, [originalDraft]);

  const currentTimeSlot = useMemo(() => 
    originalDraft ? format(new Date(originalDraft.bookingDate), "HH:mm") : "12:00"
  , [originalDraft]);

  const [activeRange, setActiveRange] = useState<TimeRangeKey>(() => {
    if (timeRanges.Morning.includes(currentTimeSlot)) return 'Morning';
    if (timeRanges.Evening.includes(currentTimeSlot)) return 'Evening';
    return 'Afternoon';
  });

  const pincode = firebaseUser ? (user.pincode || '') : (guestConfig?.pincode || '');
  const [city, setCity] = useState(guestConfig?.city || '');
  const [state, setState] = useState(guestConfig?.state || '');

  useEffect(() => {
    if (pincode) {
      const location = getLocationFromPincode(pincode);
      if (!city && location.city) setCity(location.city);
      if (!state && location.state) setState(location.state);
    }
  }, [pincode, city, state]);

  useEffect(() => {
    if (timeRanges.Morning.includes(currentTimeSlot)) setActiveRange('Morning');
    else if (timeRanges.Evening.includes(currentTimeSlot)) setActiveRange('Evening');
    else setActiveRange('Afternoon');
  }, [currentTimeSlot]);

  const familySizeForCalc = useMemo(() => {
    if (firebaseUser) {
        const sub = user.subscription;
        const isSubscriber = sub && (sub.status === 'active' || sub.status === 'upcoming');
        if (isSubscriber && sub.config?.people) {
            return parseInt(sub.config.people.split(' ')[0], 10) || user.familySize || 1;
        }
        return user.familySize || 1;
    }
    return guestConfig?.familySize || 1;
  }, [user, guestConfig, firebaseUser]);

  const timeResult = useMemo(() => {
    if (isInitialized && items.length > 0 && user) {
      const hydratedDishes = items.map(item => {
        const dish = dishes.find(d => d.id === item.dishId);
        return dish ? { ...dish, qty: item.numberOfPortions } : null;
      }).filter((d): d is (Dish & { qty: number }) => d !== null);

      if (hydratedDishes.length === items.length) {
        return calculateTotalCookingTime(familySizeForCalc, hydratedDishes);
      }
    }
    return null;
  }, [items, dishes, isInitialized, user, familySizeForCalc]);
  
  const mealCategory = useMemo(() => {
    if (!originalDraft) return 'single';
    const mealType = originalDraft.mealType || 'Lunch';
    if (mealType.includes('All 3 meals')) return 'triple';
    if (mealType.includes('&')) return 'dual';
    return 'single' as 'single' | 'dual' | 'triple';
  }, [originalDraft]);

  const priceScenario = useMemo(() => {
    if (timeResult?.total_minutes && user && originalDraft) {
      const planType = user.subscription?.planId && (user.subscription.status === 'active' || user.subscription.status === 'upcoming') ? user.subscription.planId : 'day';
      
      return calculatePriceScenarios(
        timeResult.total_minutes,
        familySizeForCalc,
        planType,
        mealCategory
      );
    }
    return null;
  }, [timeResult, user, originalDraft, familySizeForCalc, mealCategory]);

  const getMealTypeFromTime = (isoDate: string): 'Breakfast' | 'Lunch' | 'Dinner' => {
    const hour = new Date(isoDate).getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    return 'Dinner';
  }

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate || !originalDraft) return;
    
    const currentTime = new Date(originalDraft.bookingDate);
    const updatedDate = new Date(newDate);
    updatedDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    
    addOrUpdateDraftBooking({
        ...originalDraft,
        bookingDate: updatedDate.toISOString()
    });
    
    if (!isSameDay(new Date(originalDraft.bookingDate), updatedDate)) {
        removeDraftBooking(originalDraft.bookingDate);
        router.push(`/booking/summary/${format(updatedDate, 'yyyy-MM-dd')}`);
    }
  }

  const handleTimeChange = (newTime: string) => {
    if (!originalDraft) return;
    const [hours, minutes] = newTime.split(':').map(Number);
    const updatedDate = new Date(originalDraft.bookingDate);
    updatedDate.setHours(hours, minutes, 0, 0);
    
    addOrUpdateDraftBooking({
        ...originalDraft,
        bookingDate: updatedDate.toISOString(),
        mealType: getMealTypeFromTime(updatedDate.toISOString())
    });
  }

  const handleRangeChange = (range: TimeRangeKey) => {
    setActiveRange(range);
    if (!timeRanges[range].includes(currentTimeSlot)) {
        handleTimeChange(timeRanges[range][0]);
    }
  }

  const handleUpdatePortions = (dishId: string, change: number) => {
    if (!originalDraft) return;
    
    const updatedItems = items.map(item => {
        if (item.dishId === dishId) {
            return { ...item, numberOfPortions: Math.max(0, item.numberOfPortions + change) };
        }
        return item;
    }).filter(item => item.numberOfPortions > 0);

    if (updatedItems.length > 0) {
        addOrUpdateDraftBooking({ ...originalDraft, items: updatedItems });
    } else {
        removeDraftBooking(originalDraft.bookingDate);
    }
  };

  const handleRemoveDish = (dishId: string) => {
    if (!originalDraft) return;
    const updatedItems = items.filter(item => item.dishId !== dishId);
    
    if (updatedItems.length > 0) {
        addOrUpdateDraftBooking({ ...originalDraft, items: updatedItems });
    } else {
        removeDraftBooking(originalDraft.bookingDate);
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!firebaseUser && guestConfig) {
          setGuestConfig({ ...guestConfig, address: e.target.value });
      }
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity(val);
    if (guestConfig) {
        setGuestConfig({ ...guestConfig, city: val, state });
    }
  }
  
  const isAddressMissing = !firebaseUser && (!guestConfig?.address || guestConfig.address.trim().length < 5);

  const handleConfirmAndProceed = async () => {
    if (!originalDraft || !priceScenario) return;

    if (!firebaseUser) {
        setIsAuthDialogOpen(true);
        return;
    }

    if (!hasSufficientBalance) {
        router.push(`/wallet?redirect=${window.location.pathname}&requiredAmount=${priceScenario.current_bill.amount - (user.walletBalance || 0)}`);
        return;
    }
    
    setIsSubmitting(true);
    try {
        const planType = user.subscription?.planId && (user.subscription.status === 'active' || user.subscription.status === 'upcoming') ? user.subscription.planId : 'day';
        
        const checkoutData = {
            type: planType,
            cost: priceScenario.current_bill.amount,
            configuration: {
                ...(user.subscription?.config || {
                    people: `${familySizeForCalc} people`,
                    meals: originalDraft.mealType,
                    diet: 'Veg',
                }),
                timeSlot: format(new Date(originalDraft.bookingDate), 'HH:mm'),
            },
            startDate: new Date(originalDraft.bookingDate)
        };

        await executeUnifiedCheckout(checkoutData, 0);
        toast({ title: "Booking Confirmed!", description: "Your cook has been requested." });
    } catch (error: any) {
        console.error("Checkout error:", error);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handleBackToMenu = () => {
    const params = new URLSearchParams(window.location.search);
    router.push(`/booking/menu?date=${date}&${params.toString()}`);
  }

  if (isLoading) {
     return <LoadingState fullPage type="processing" message="Crafting your session summary..." />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto pt-10 px-4">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cart is Empty</AlertTitle>
            <AlertDescription>
            You have removed all items for this date.
            </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/booking/menu')} className="w-full mt-6 h-12 touch-manipulation active:scale-95">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
        </Button>
      </div>
    );
  }
  
  const getDishData = (dishId: string) => {
      return dishes.find(d => d.id === dishId);
  }
  
  const hasSufficientBalance = priceScenario ? checkBalance(priceScenario.current_bill.amount) : false;
  const isOverTime = (timeResult?.total_minutes || 0) > (priceScenario?.plan_details?.plan_limit_minutes || 0);

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <div className="container mx-auto py-4 md:py-8 pb-32">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button onClick={handleBackToMenu} variant="ghost" className="text-muted-foreground hover:text-foreground h-9 px-2 touch-manipulation active:scale-95">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Logo className="scale-75 origin-left" />
                </div>
            </div>

            <header className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Checkout</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">Review your selections and schedule your visit.</p>
            </header>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-12 items-start">
                <div className="lg:col-span-7 space-y-6 md:space-y-8">
                    
                    <Card className="border-2 border-primary/10 shadow-none">
                        <CardHeader className="pb-3 pt-4 px-4">
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <MapPin className="h-5 w-5 text-primary" />
                                Service Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 pb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Area Pincode</Label>
                                    <div className="font-bold text-base md:text-lg flex items-center gap-2">
                                        {pincode || '--'}
                                        <Badge variant="outline" className="text-[9px] h-4 px-1">Verified</Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Household Size</Label>
                                    <p className="font-bold text-base md:text-lg">{familySizeForCalc} {familySizeForCalc > 1 ? 'people' : 'person'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">City</Label>
                                    {firebaseUser ? (
                                        <p className="font-bold text-base">{city || 'N/A'}</p>
                                    ) : (
                                        <Input 
                                            value={city}
                                            onChange={handleCityChange}
                                            placeholder="City"
                                            className="h-10 text-sm font-bold bg-white"
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">State (Auto)</Label>
                                    <Input 
                                        value={state}
                                        readOnly
                                        disabled
                                        className="h-10 text-sm font-bold bg-muted/50 cursor-not-allowed opacity-80"
                                    />
                                </div>
                            </div>

                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                                    Full Address <span className="text-destructive font-bold text-lg leading-none">*</span>
                                </Label>
                                {firebaseUser ? (
                                    <div className="p-3 bg-muted/30 rounded-md border text-sm leading-relaxed">
                                        {user.address || 'No address saved in profile.'}
                                        <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-xs font-bold" onClick={() => router.push('/profile')}>Change</Button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <Textarea 
                                            placeholder="Flat/House No, Building, Area, Landmark..." 
                                            className={cn(
                                                "bg-white min-h-[100px] text-sm transition-all duration-300 border-2",
                                                isAddressMissing 
                                                    ? "border-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-1 ring-primary/20" 
                                                    : "border-input focus:border-primary shadow-sm"
                                            )}
                                            value={guestConfig?.address || ''}
                                            onChange={handleAddressChange}
                                            required
                                        />
                                        {isAddressMissing && (
                                            <p className="text-[10px] font-bold text-primary mt-1.5 animate-pulse uppercase tracking-tight">
                                                Please fill your address to continue
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/10 shadow-none">
                        <CardHeader className="pb-3 pt-4 px-4">
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <Clock className="h-5 w-5 text-primary" />
                                Choose Slot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 px-4 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Select Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal h-11 text-sm touch-manipulation active:scale-95">
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                {originalDraft ? format(new Date(originalDraft.bookingDate), "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={originalDraft ? new Date(originalDraft.bookingDate) : undefined}
                                                onSelect={handleDateChange}
                                                disabled={(date) => date < new Date() || differenceInHours(date, new Date()) < 24}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Arrival Slot</Label>
                                    <Select value={currentTimeSlot} onValueChange={handleTimeChange}>
                                        <SelectTrigger className="w-full h-11 bg-muted/30 text-sm touch-manipulation active:scale-95">
                                            <SelectValue placeholder="Pick an arrival time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeRanges[activeRange].map(slot => (
                                                <SelectItem key={slot} value={slot}>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-semibold">{slot}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <Button 
                                    type="button"
                                    variant={activeRange === 'Morning' ? 'default' : 'outline'} 
                                    className={cn("flex-col h-14 md:h-16 gap-1 px-1 touch-manipulation active:scale-95", activeRange === 'Morning' && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary")}
                                    onClick={() => handleRangeChange('Morning')}
                                >
                                    <Sunrise className="h-4 w-4" />
                                    <span className="text-[9px] font-bold">MORNING</span>
                                </Button>
                                <Button 
                                    type="button"
                                    variant={activeRange === 'Afternoon' ? 'default' : 'outline'} 
                                    className={cn("flex-col h-14 md:h-16 gap-1 px-1 touch-manipulation active:scale-95", activeRange === 'Afternoon' && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary")}
                                    onClick={() => handleRangeChange('Afternoon')}
                                >
                                    <Sun className="h-4 w-4" />
                                    <span className="text-[9px] font-bold">AFTERNOON</span>
                                </Button>
                                <Button 
                                    type="button"
                                    variant={activeRange === 'Evening' ? 'default' : 'outline'} 
                                    className={cn("flex-col h-14 md:h-16 gap-1 px-1 touch-manipulation active:scale-95", activeRange === 'Evening' && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary")}
                                    onClick={() => handleRangeChange('Evening')}
                                >
                                    <Moon className="h-4 w-4" />
                                    <span className="text-[9px] font-bold">EVENING</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg md:text-xl font-bold font-headline flex items-center gap-2">
                                <Utensils className="h-5 w-5 text-primary" />
                                Selected Menu
                            </h2>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{items.length} items</Badge>
                        </div>
                        {items.map((item) => {
                            const dish = getDishData(item.dishId);
                            const dishTime = dish?.totalCookTimeMinutes || 0;
                            
                            const customerIngredients = (dish?.ingredients || []).filter(ing => 
                                ing.providedBy === 'Customer' && 
                                ing.name && 
                                !['ingredient_name', 'name', 'ingredient'].includes(ing.name.toLowerCase().trim())
                            );

                            return (
                            <Card key={item.dishId} className="overflow-hidden border-2 border-[#fde047]/50 shadow-none">
                                <div className="flex items-center p-3 gap-3 md:gap-4">
                                    <Image
                                        src={dish?.heroImageUrl || `https://picsum.photos/seed/${item.dishId}/100/100`}
                                        alt={item.dishName}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover w-16 h-16 md:w-20 md:h-20"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-sm md:text-base truncate">{item.dishName}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full touch-manipulation active:scale-95" onClick={() => handleUpdatePortions(item.dishId, -1)}>
                                                <Minus className="h-3.5 w-3.5" />
                                            </Button>
                                            <span className="font-bold text-base md:text-lg w-5 text-center">{item.numberOfPortions}</span>
                                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full touch-manipulation active:scale-95" onClick={() => handleUpdatePortions(item.dishId, 1)}>
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-base md:text-lg text-primary">{dishTime}m</p>
                                        <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive h-8 w-8 rounded-full touch-manipulation active:scale-95" onClick={() => handleRemoveDish(item.dishId)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                
                                {customerIngredients.length > 0 && (
                                    <Collapsible className="border-t">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" className="w-full flex items-center justify-between py-2 px-4 h-auto text-[10px] font-bold text-white hover:text-white/90 bg-orange-500 hover:bg-orange-600 rounded-none transition-colors uppercase tracking-widest touch-manipulation active:scale-[0.99]">
                                                <span className="flex items-center gap-2">
                                                    <List className="h-3 w-3" />
                                                    Ingredients to Provide
                                                </span>
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="p-4 bg-orange-50 border-t border-orange-100">
                                            <div className="space-y-2">
                                                {customerIngredients.map((ing, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs md:text-sm border-b border-dashed border-orange-200 pb-1.5 last:border-0 last:pb-0">
                                                        <span className="text-text-secondary">{ing.name}</span>
                                                        <span className="font-bold text-orange-800">
                                                            {(ing.quantity * item.numberOfPortions).toFixed(ing.quantity % 1 === 0 ? 0 : 1)} {ing.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </Card>
                        )})}
                    </div>
                </div>

                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 pb-10">
                    
                    <Card className="bg-primary/5 border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-white/50 border-b pb-4 pt-5 px-5">
                            <CardTitle className="text-xl md:text-2xl font-headline">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-5">
                            <div className={cn("p-4 rounded-lg text-center transition-colors border", isOverTime ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100")}>
                                <div className="flex justify-around items-center">
                                    <div className="space-y-0.5">
                                        <p className={cn("text-xl md:text-2xl font-bold leading-none", isOverTime ? "text-red-700" : "text-green-800")}>
                                            {timeResult?.total_minutes ?? 0}m
                                        </p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Estimated Time</p>
                                    </div>
                                    <div className="h-8 w-px bg-black/5"></div>
                                    <div className="space-y-0.5 opacity-80">
                                        <p className="text-sm md:text-base font-bold text-muted-foreground leading-none">
                                            {priceScenario?.plan_details?.plan_limit_minutes ?? '--'}m
                                        </p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight">Included Base</p>
                                    </div>
                                </div>
                                {isOverTime && (
                                    <div className="mt-3 pt-2 border-t border-red-200/50">
                                        <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider animate-pulse">
                                            Time Exceeded (+{priceScenario?.plan_details?.overage_minutes}m Overage)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-2 text-sm">
                                {priceScenario?.current_bill.breakdown.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-text-secondary text-xs">{item.label}</span>
                                        {item.originalAmount != null ? (
                                            <span className="font-bold text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                <span className="line-through text-red-400/70 mr-1.5 opacity-60">₹{item.originalAmount.toLocaleString('en-IN')}</span>
                                                FREE
                                            </span>
                                        ) : (
                                            <span className="font-bold text-gray-800">₹{item.amount.toLocaleString('en-IN')}</span>
                                        )}
                                    </div>
                                ))}
                                <Separator className="my-2 !mt-4 opacity-50" />
                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="font-bold text-base">Amount to pay</span>
                                    <span className="font-bold text-2xl text-primary tracking-tight">₹{priceScenario?.current_bill.amount.toLocaleString('en-IN') ?? 0}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 p-5">
                            <Button size="lg" className="w-full h-14 text-base md:text-lg font-bold shadow-lg touch-manipulation active:scale-95 transition-all" onClick={handleConfirmAndProceed} disabled={isSubmitting || items.length === 0 || isAddressMissing}>
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {!firebaseUser ? (
                                    <span className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Login to Pay ₹{priceScenario?.current_bill.amount.toLocaleString('en-IN') ?? '...'}
                                    </span>
                                ) : !hasSufficientBalance ? (
                                    <span className="flex items-center gap-2">
                                        <Wallet className="h-5 w-5" />
                                        Recharge & Pay
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <BadgeCheck className="h-5 w-5" />
                                        Confirm Booking
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-full shrink-0">
                            <BadgeCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-tight">Cancellation policy</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                                Free cancellation up to 24 hrs before the session. A nominal fee applies for late cancellations to support our home-cooks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-background">
                <DialogHeader className="text-center space-y-2">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                        <ChefHat className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold font-headline tracking-tight">Final Step!</DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Please log in or create an account to finalize your meal plan.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="login" className="w-full mt-8">
                    <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-lg">
                        <TabsTrigger value="login" className="rounded-md font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-md font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="pt-6 animate-in fade-in zoom-in-95 duration-200">
                        <LoginForm onSuccess={() => setIsAuthDialogOpen(false)} />
                    </TabsContent>
                    <TabsContent value="signup" className="pt-6 animate-in fade-in zoom-in-95 duration-200">
                        <SignUpForm onSuccess={() => setIsAuthDialogOpen(false)} />
                    </TabsContent>
                </Tabs>
            </div>
        </DialogContent>
    </Dialog>
  );
}
