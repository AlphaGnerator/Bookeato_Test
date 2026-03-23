
'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarCheck, Coffee, Sun, Moon, PlusCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CookAvailability } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from '@/components/ui/input';


const MealIcon = ({ mealType, className }: { mealType: CookAvailability['mealType'], className?: string }) => {
    switch (mealType) {
        case 'Breakfast': return <Coffee className={className} />;
        case 'Lunch': return <Sun className={className} />;
        case 'Dinner': return <Moon className={className} />;
        default: return null;
    }
};

export function AvailabilityManager() {
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [viewDate, setViewDate] = useState<Date | undefined>(new Date());
  
  const availabilityCollectionRef = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
      return collection(firestore, 'cooks', firebaseUser.uid, 'availability');
    }
    return null;
  }, [firestore, firebaseUser]);
  
  const { data: allSlots, isLoading } = useCollection<CookAvailability>(availabilityCollectionRef);

  const handleDeleteSlot = async (slotId: string) => {
    if (!firestore || !firebaseUser) return;
    const slotDocRef = doc(firestore, 'cooks', firebaseUser.uid, 'availability', slotId);
    await deleteDocumentNonBlocking(slotDocRef);
    toast({
      title: 'Slot Deleted',
      description: 'Your availability has been updated.',
      variant: 'destructive',
    });
  };

  const slotsForSelectedDay = useMemo(() => {
    if (!viewDate || !allSlots) return { breakfast: [], lunch: [], dinner: [] };
    const dailySlots = allSlots.filter(slot => isSameDay(new Date(slot.startTime), viewDate));
    return {
      breakfast: dailySlots.filter(s => s.mealType === 'Breakfast').sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      lunch: dailySlots.filter(s => s.mealType === 'Lunch').sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      dinner: dailySlots.filter(s => s.mealType === 'Dinner').sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    }
  }, [viewDate, allSlots]);
  
  const availableDays = useMemo(() => allSlots?.map(slot => new Date(slot.startTime)) || [], [allSlots]);
  
  const totalSlotsToday = slotsForSelectedDay.breakfast.length + slotsForSelectedDay.lunch.length + slotsForSelectedDay.dinner.length;

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Skeleton className="h-[360px] md:col-span-1" />
      <div className="md:col-span-2 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  }

  const renderSlotList = (mealSlots: CookAvailability[], mealType: string) => {
      if (mealSlots.length === 0) return null;
      return (
          <div className="space-y-4">
               <h3 className="font-headline text-2xl flex items-center gap-2 text-muted-foreground">
                <MealIcon mealType={mealType as CookAvailability['mealType']} className="h-6 w-6" />
                {mealType}
                </h3>
              {mealSlots.map(slot => (
                <Card key={slot.id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1 lg:sticky lg:top-20">
        <CardHeader>
            <CardTitle>View Schedule</CardTitle>
            <CardDescription>Select a day to see your availability.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={viewDate}
            onSelect={setViewDate}
            className="p-3"
            modifiers={{
              available: availableDays
            }}
            modifiersClassNames={{
              available: 'border-2 border-primary/50 rounded-full',
            }}
            disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <h2 className="font-headline text-3xl">
            Availability for {viewDate ? format(viewDate, 'MMMM d, yyyy') : '...'}
            </h2>
            <AddAvailabilityDialog collectionRef={availabilityCollectionRef} />
        </div>
        {totalSlotsToday > 0 ? (
            <div className="space-y-8">
                {renderSlotList(slotsForSelectedDay.breakfast, 'Breakfast')}
                {renderSlotList(slotsForSelectedDay.lunch, 'Lunch')}
                {renderSlotList(slotsForSelectedDay.dinner, 'Dinner')}
            </div>
        ) : (
          <Alert>
            <CalendarCheck className="h-4 w-4" />
            <AlertTitle>No Slots Available</AlertTitle>
            <AlertDescription>
              You have not set any availability for this day. Click 'Add New Slot' to get started.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function AddAvailabilityDialog({ collectionRef }: { collectionRef: any }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner'>('Lunch');
    const [startTime, setStartTime] = useState('12:00');
    const [endTime, setEndTime] = useState('13:00');
    const [step, setStep] = useState<'date' | 'details'>('date');
    
    // Reset state when dialog opens
    React.useEffect(() => {
        if (open) {
            setStep('date');
            setSelectedDate(undefined);
        }
    }, [open]);

    const handleAddSlot = async () => {
        if (!collectionRef || !selectedDate) {
            toast({ title: "Error", description: "Please select a date first.", variant: "destructive" });
            return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startDate = new Date(selectedDate);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(selectedDate);
        endDate.setHours(endHour, endMinute, 0, 0);

        if (endDate <= startDate) {
            toast({ title: "Invalid Time", description: "End time must be after start time.", variant: "destructive" });
            return;
        }

        const newSlot: Omit<CookAvailability, 'id'> = {
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            mealType,
        };

        await addDocumentNonBlocking(collectionRef, newSlot);
        toast({ title: "Slot Added", description: "Your availability has been updated." });
        setOpen(false);
    }
    
    const handleDateSelect = (date?: Date) => {
        if(date) {
            setSelectedDate(date);
            setStep('details');
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Slot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                    <DialogTitle>Add Availability</DialogTitle>
                    <DialogDescription>
                        {step === 'date' 
                            ? "Pick a day from the calendar to add your availability." 
                            : `Set a time when you are available on ${selectedDate ? format(selectedDate, 'PPP') : ''}.`
                        }
                    </DialogDescription>
                </DialogHeader>
                {step === 'date' && (
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
                        className="p-3 self-center"
                    />
                )}
                {step === 'details' && (
                     <>
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Meal</Label>
                                <RadioGroup
                                    defaultValue="Lunch"
                                    onValueChange={(value: 'Breakfast' | 'Lunch' | 'Dinner') => setMealType(value)}
                                    className="col-span-3 flex items-center gap-4 mt-2"
                                    >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Breakfast" id="r1" />
                                        <Label htmlFor="r1">Breakfast</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Lunch" id="r2" />
                                        <Label htmlFor="r2">Lunch</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Dinner" id="r3" />
                                        <Label htmlFor="r3">Dinner</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="start-time" className="text-right">
                                Start Time
                                </Label>
                                <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="end-time" className="text-right">
                                End Time
                                </Label>
                                <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep('date')}>Back</Button>
                            <Button onClick={handleAddSlot}>Add Slot</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
