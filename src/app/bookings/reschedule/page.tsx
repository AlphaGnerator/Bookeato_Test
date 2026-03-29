'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Booking } from '@/lib/types';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO, addHours, isAfter, differenceInHours } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function RescheduleContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [success, setSuccess] = useState(false);

    const bookingRef = useDoc<Booking>(
        user && bookingId ? doc(firestore!, `customers/${user.uid}/bookings/${bookingId}`) : null
    );

    const booking = bookingRef.data;

    useEffect(() => {
        if (booking) {
            const bDate = new Date(booking.bookingDate);
            setNewDate(format(bDate, 'yyyy-MM-dd'));
            setNewTime(format(bDate, 'HH:mm'));
        }
    }, [booking]);

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Fetching booking details...</p>
            </div>
        );
    }

    const currentBookingDate = parseISO(booking.bookingDate);
    const hoursToBooking = differenceInHours(currentBookingDate, new Date());
    const isLocked = hoursToBooking < 6;

    const handleReschedule = async () => {
        if (!user || !bookingId || !newDate || !newTime || !firestore) return;
        
        const selectedDateTime = new Date(`${newDate}T${newTime}`);
        
        // Validation
        if (!isAfter(selectedDateTime, addHours(new Date(), 2))) {
            toast({
                variant: "destructive",
                title: "Invalid Time",
                description: "Please select a time at least 2 hours from now.",
            });
            return;
        }

        setIsUpdating(true);
        try {
            const bRef = doc(firestore, `customers/${user.uid}/bookings/${bookingId}`);
            await updateDoc(bRef, {
                bookingDate: selectedDateTime.toISOString(),
                rescheduledAt: serverTimestamp(),
            });

            setSuccess(true);
            toast({
                title: "Booking Rescheduled",
                description: `Successfully moved to ${format(selectedDateTime, 'PPP p')}`,
            });
        } catch (error) {
            console.error("Reschedule error:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not reschedule. Please try again.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto py-12 px-6 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-stone-900 tracking-tight">Time Updated!</h2>
                    <p className="text-stone-500 font-bold leading-relaxed">
                        We've notified your partner about the new schedule.
                    </p>
                </div>
                <Button 
                    variant="cta" 
                    size="lg" 
                    className="w-full h-14 rounded-2xl font-black"
                    onClick={() => router.push('/dashboard')}
                >
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-6 px-4 space-y-8">
            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="rounded-full h-10 w-10 p-0 text-stone-400"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="space-y-2">
                <h1 className="text-3xl font-black text-stone-900 tracking-tight">Reschedule</h1>
                <p className="text-stone-500 font-bold">Pick a new date and time for your service.</p>
            </div>

            {isLocked && (
                <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-black text-red-900 text-sm uppercase">Modification Locked</h4>
                        <p className="text-xs font-bold text-red-700/70 leading-relaxed">
                            Rescheduling is not permitted within 6 hours of the original booking time. 
                            Please contact support for emergencies.
                        </p>
                    </div>
                </div>
            )}

            <Card className={cn(
                "rounded-[2.5rem] border-stone-200 overflow-hidden shadow-xl shadow-stone-200/40",
                isLocked && "opacity-50 pointer-events-none grayscale"
            )}>
                <CardHeader className="bg-stone-50 p-8 border-b border-stone-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black text-stone-900">New Schedule</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Current: {format(currentBookingDate, 'PPP p')}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 pl-2">Select Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                                <Input 
                                    type="date" 
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold focus-visible:ring-stone-900"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 pl-2">Select Time</label>
                            <div className="relative group">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                                <Input 
                                    type="time" 
                                    className="pl-12 h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold focus-visible:ring-stone-900"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-orange-800 leading-tight">
                            Your assigned partner will be notified of this change instantly.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                    <Button 
                        variant="cta" 
                        size="lg" 
                        className="w-full h-14 rounded-2xl font-black text-lg"
                        onClick={handleReschedule}
                        disabled={isUpdating || !newDate || !newTime}
                    >
                        {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm New Schedule"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ReschedulePage() {
    return (
        <AppLayout pageTitle="Reschedule Booking">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Preparing reschedule...</p>
                </div>
            }>
                <RescheduleContent />
            </Suspense>
        </AppLayout>
    );
}
