
'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, addDays, differenceInHours, parseISO, isSameDay, setHours, setMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, CheckCircle, Calendar as CalendarIcon, ChefHat, Edit, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function SlotSelector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, bookings, draftBookings, submitAllDraftBookings, clearDraftsAndSubmitCurationRequest } = useCulinaryStore();
  const { toast } = useToast();
  
  const [curationMode, setCurationMode] = useState<'self' | 'expert'>('self');
  const plan = searchParams.get('plan') || 'day';
  
  const initialDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? parseISO(dateParam) : new Date();
  }, [searchParams]);

  const [startDate, setStartDate] = useState<Date | undefined>(initialDate);
  
  const { displayedDates, endDate, planRange } = useMemo(() => {
    if (!startDate) return { displayedDates: [], endDate: null, planRange: undefined };
    
    let planDays = 1;
    if (plan === 'weekly') planDays = 7;
    if (plan === 'monthly') planDays = 30;

    const displayDays = Math.min(planDays, 7);
    
    const dates = Array.from({ length: displayDays }, (_, i) => addDays(startDate, i));
    const finalDate = addDays(startDate, planDays - 1);
    
    const range = {
        from: startDate,
        to: finalDate
    };

    return { displayedDates: dates, endDate: finalDate, planRange: range };
  }, [startDate, plan]);

  const bookedDays = useMemo(() => {
    return (bookings || [])
      .filter(b => b.status !== 'cancelled')
      .map(b => new Date(b.bookingDate));
  }, [bookings]);


  const handleDateClick = (date: Date) => {
    if (curationMode === 'expert') return;

    const preferredTime = user.subscription?.config?.timeSlot || '12:00';
    const [hour, minute] = preferredTime.split(':').map(Number);
    const finalDate = setMinutes(setHours(date, hour), minute);

    const isAlreadyBooked = bookedDays.some(bookedDate => isSameDay(bookedDate, date));
    
    const dateString = finalDate.toISOString();
    const url = `/booking/menu?date=${dateString}`;

    if(isAlreadyBooked) {
        const hoursUntilBooking = differenceInHours(finalDate, new Date());
        if(hoursUntilBooking > 24) {
             router.push(url);
        } else {
             toast({
                title: "Booking Locked",
                description: "Bookings cannot be modified within 24 hours of the scheduled time.",
                variant: "default"
            });
        }
        return;
    }
    
    router.push(url);
  }


  const handleFinalSubmit = async () => {
    if (curationMode === 'expert' && startDate) {
        await clearDraftsAndSubmitCurationRequest(startDate.toISOString());
        toast({ title: "Request Submitted!", description: "An expert will curate your plan and get back to you shortly."});
    } else {
        if ((draftBookings || []).length === 0) {
            toast({ title: "No Bookings to Submit", description: "Please select a dish for at least one day.", variant: "destructive" });
            return;
        }
        await submitAllDraftBookings();
        toast({ title: "Bookings Submitted!", description: "Your requests have been sent. Check the dashboard for status."});
    }
  }

  const isSubmitDisabled = curationMode === 'self' && (draftBookings || []).length === 0;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">How would you like to plan your meals?</CardTitle>
        </CardHeader>
        <CardContent>
             <RadioGroup
                value={curationMode}
                onValueChange={(value: 'self' | 'expert') => setCurationMode(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <Label htmlFor="curation-expert" className={cn("flex flex-col p-4 rounded-lg border-2 transition-all cursor-pointer", curationMode === 'expert' ? "border-green-500 bg-green-50" : "border-border bg-card hover:bg-muted/50")}>
                    <RadioGroupItem value="expert" id="curation-expert" className="sr-only" />
                    <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className={cn("h-5 w-5", curationMode === 'expert' ? "text-green-600" : "text-primary")} />
                        <span className={cn("font-bold text-base", curationMode === 'expert' && "text-green-700")}>Let an expert curate my plan</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Save time and let our culinary experts design a balanced meal plan for you. Just submit your request and we'll handle the rest.</p>
                </Label>
                <Label htmlFor="curation-self" className={cn("flex flex-col p-4 rounded-lg border-2 transition-all cursor-pointer", curationMode === 'self' ? "border-green-500 bg-green-50" : "border-border bg-card hover:bg-muted/50")}>
                    <RadioGroupItem value="self" id="curation-self" className="sr-only"/>
                     <div className="flex items-center gap-2 mb-1.5">
                        <ChefHat className={cn("h-5 w-5", curationMode === 'self' ? "text-green-600" : "text-primary")} />
                        <span className={cn("font-bold text-base", curationMode === 'self' && "text-green-700")}>I'll choose my own dishes</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Take control and build your perfect meal plan. Browse our menu and select the dishes you'd like our cook to prepare.</p>
                </Label>
            </RadioGroup>
        </CardContent>
      </Card>
      
       <div className="flex flex-col sm:flex-row items-center gap-4">
        <h3 className="font-headline text-2xl whitespace-nowrap">
            {plan === 'day' ? 'Select Your Day' : 'Select Your Start Date'}
        </h3>
         <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal",
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
                    disabled={(date) =>
                        date < new Date(new Date().setDate(new Date().getDate() - 1)) ||
                        differenceInHours(date, new Date()) < 24
                    }
                    modifiers={{ 
                        booked: bookedDays,
                        inRange: planRange
                    }}
                    modifiersClassNames={{
                        booked: 'bg-blue-500/20 text-blue-800 rounded-full',
                        inRange: 'bg-green-500/20 text-green-800'
                    }}
                />
            </PopoverContent>
        </Popover>
         {plan !== 'day' && startDate && endDate && (
            <p className="text-sm text-muted-foreground">
                Plan for {format(startDate, "PPP")} to {format(endDate, "PPP")}
            </p>
         )}
      </div>

      {curationMode === 'self' && (
        <>
            <h3 className="font-headline text-2xl">Select Dishes for Each Day</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedDates.map((date, index) => {
                const draft = draftBookings.find(d => isSameDay(new Date(d.bookingDate), date));
                const bookingForDay = (bookings || []).find(b => isSameDay(new Date(b.bookingDate), date) && b.status !== 'cancelled');
                const isBooked = !!bookingForDay;
                const canEdit = isBooked && bookingForDay && differenceInHours(new Date(bookingForDay.bookingDate), new Date()) > 24;

                return (
                <Card 
                    key={index} 
                    className={cn(
                        "cursor-pointer hover:shadow-lg transition-all flex flex-col",
                        draft ? "border-2 border-primary bg-primary/5" : "bg-card",
                        isBooked && !canEdit && "bg-blue-500/10 border-blue-500/30 cursor-not-allowed",
                        isBooked && canEdit && "border-blue-500/30",
                    )}
                    onClick={() => handleDateClick(date)}
                >
                    <CardHeader>
                        <CardTitle className="text-xl">{format(date, 'EEE, MMM d')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-24 flex flex-col justify-center text-center flex-grow">
                        {isBooked && bookingForDay ? (
                            <div className="text-sm font-semibold text-blue-800">
                                <CheckCircle className="mx-auto h-6 w-6 mb-1"/>
                                <p>Already Booked</p>
                            </div>
                        ) : draft ? (
                            <div className="text-sm font-semibold">
                                <p className="truncate">{draft.items.length > 1 ? `${draft.items.length} dishes` : draft.items[0].dishName}</p>
                                <p className="text-xs text-muted-foreground">{draft.items.reduce((acc, i) => acc + i.numberOfPortions, 0)} portions</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Click to select dishes</p>
                        )}
                    </CardContent>
                    {isBooked && canEdit && (
                        <div className="p-3 border-t">
                            <Button variant="secondary" size="sm" className="w-full">
                                <Edit className="mr-2 h-4 w-4" /> Edit Dishes
                            </Button>
                        </div>
                    )}
                </Card>
                );
            })}
            </div>
        </>
      )}
      
      {curationMode === 'expert' && (
        <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Expert Curation Selected</AlertTitle>
            <AlertDescription>
                You're all set! Click the "Submit Request" button, and our experts will create a personalized meal plan for you based on your selected start date.
            </AlertDescription>
        </Alert>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        <Button 
            size="lg" 
            onClick={handleFinalSubmit} 
            disabled={isSubmitDisabled}
            className="shadow-2xl"
        >
            <CheckCircle className="mr-2"/>
            {curationMode === 'expert' ? 'Submit Curation Request' : `Confirm All (${(draftBookings || []).length}) Bookings`}
        </Button>
      </div>
    </div>
  );
}
