
'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, arrayUnion, arrayRemove, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock } from 'lucide-react';
import type { PincodeAvailability } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Generate 24-hour format time strings from 07:00 to 21:00
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 7; i <= 21; i++) {
        const hour = i.toString().padStart(2, '0');
        slots.push(`${hour}:00`);
    }
    return slots;
};

const allSlots = generateTimeSlots();

export function PincodeAvailabilityManager() {
    const [pincode, setPincode] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const firestore = useFirestore();
    const { toast } = useToast();

    const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

    const availabilityRef = useMemoFirebase(() => {
        if (firestore && pincode.length >= 5 && dateString) {
            return doc(firestore, 'pincode_availability', pincode, 'dates', dateString);
        }
        return null;
    }, [firestore, pincode, dateString]);

    const { data: availability, isLoading, error } = useDoc<PincodeAvailability>(availabilityRef);

    const handleToggleSlot = async (slot: string, isAvailable: boolean) => {
        if (!availabilityRef) {
            toast({
                title: 'Error',
                description: 'Please enter a valid pincode and select a date.',
                variant: 'destructive'
            });
            return;
        }
        
        // If the slot is now AVAILABLE, we REMOVE it from the unavailable list.
        // If the slot is now UNAVAILABLE, we ADD it to the unavailable list.
        const operation = isAvailable ? arrayRemove(slot) : arrayUnion(slot);
        
        try {
            // Check if the document exists by checking for `availability` data from the hook
            const docExists = !!availability;

            if (!docExists) {
                // If the document doesn't exist, create it.
                // If the user is marking it available, the array is empty.
                // If they are marking it unavailable, the array contains the new slot.
                const initialData: PincodeAvailability = {
                    unavailableSlots: isAvailable ? [] : [slot]
                };
                await setDoc(availabilityRef, initialData);
            } else {
                // If the document exists, just update the array.
                await updateDoc(availabilityRef, { unavailableSlots: operation });
            }
             toast({
                title: 'Availability Updated',
                description: `Slot ${slot} on ${dateString} for pincode ${pincode} is now ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`
            });
        } catch (e: any) {
            console.error("Failed to update availability:", e);
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: availabilityRef.path,
                    operation: 'update',
                    requestResourceData: { unavailableSlots: operation }
                })
            )
            toast({
                title: 'Update Failed',
                description: "You may not have permissions to perform this action.",
                variant: 'destructive'
            });
        }
    };
    
    // A slot is unavailable if its time string is in the array.
    const isSlotUnavailable = (slot: string) => {
        return availability?.unavailableSlots?.includes(slot) ?? false;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Area</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                            id="pincode"
                            placeholder="Enter pincode..."
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            maxLength={6}
                        />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>2. Select Date</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                         <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="p-3"
                            disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Manage Slots for Pincode: <span className="text-primary">{pincode || '...'}</span>
                        </CardTitle>
                        <CardDescription>
                            Toggle slots on or off for {dateString ? format(new Date(dateString), 'PPP') : '...'}. An "on" switch means the slot is AVAILABLE.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!pincode || pincode.length < 5 ? (
                            <p className="text-muted-foreground text-center">Please enter a valid pincode to see slots.</p>
                        ) : isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {allSlots.map(slot => <Skeleton key={slot} className="h-16 w-full" />)}
                            </div>
                        ) : (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {allSlots.map(slot => {
                                    const isUnavailable = isSlotUnavailable(slot);
                                    const isAvailable = !isUnavailable;

                                    return (
                                        <div key={slot} className="flex flex-col items-center justify-center gap-2 p-3 border rounded-lg bg-secondary/30">
                                            <p className="font-mono font-semibold flex items-center gap-2"><Clock className="h-4 w-4" />{slot}</p>
                                            <Switch
                                                checked={isAvailable}
                                                onCheckedChange={(newCheckedState) => handleToggleSlot(slot, newCheckedState)}
                                                aria-label={`Toggle availability for ${slot}`}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
