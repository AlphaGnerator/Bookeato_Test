'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, Calendar as CalendarIcon, Clock, Check, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Wallet, AlertCircle, ShoppingCart } from 'lucide-react';

export function MaidCheckoutSchedule({ onBack }: { onBack?: () => void }) {
  const { user } = useCulinaryStore();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [estimate, setEstimate] = useState<{ totalTime: number, slotLabel: string, price: string, chores?: any[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Attempt to pull data from previous steps
    const step2DataRaw = typeof window !== 'undefined' ? localStorage.getItem('bookeato_maid_checkout_step2') : null;
    const estimateRaw = typeof window !== 'undefined' ? localStorage.getItem('bookeato_maid_estimate') : null;
    
    if (estimateRaw) {
      try {
        setEstimate(JSON.parse(estimateRaw));
      } catch (e) {}
    }

    if (step2DataRaw) {
      try {
        const step2Data = JSON.parse(step2DataRaw);
        const est = estimateRaw ? JSON.parse(estimateRaw) : null;
        setSummaryData({
          time: est ? `Est. ${est.totalTime} mins` : 'Est. 60 mins',
          price: est ? est.price : '₹200',
          society: step2Data.society || 'N/A',
          flat: step2Data.flat || 'N/A',
          phone: step2Data.phone,
          pincode: step2Data.pincode
        });
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, []);

  const generateDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push({
            fullDate: d,
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate().toString()
        });
    }
    return dates;
  };

  const dates = generateDates();

  const costStr = summaryData?.price || '₹0';
  const costNum = parseInt(costStr.replace(/\D/g, '')) || 0;
  const walletBalance = user.walletBalance || 0;
  const canAfford = walletBalance >= costNum;

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !firestore) return;

    if (!canAfford && user.id !== 'guest') {
        toast({
            title: "Insufficient Balance",
            description: `You need ₹${costNum - walletBalance} more to book this service.`,
            variant: "destructive"
        });
        router.push(`/wallet?redirect=/booking/maid&requiredAmount=${costNum - walletBalance}`);
        return;
    }

    setIsSubmitting(true);
    try {
        const payload: any = {
            service: 'Maid - A-La-Carte',
            type: 'maid',
            items: estimate?.chores || [],
            totalCost: costNum,
            totalTime: estimate?.totalTime || 0,
            bookingDate: selectedDate.toISOString(),
            mealType: selectedTime.includes('AM') ? 'Breakfast' : (parseInt(selectedTime) < 4 ? 'Lunch' : 'Dinner'),
            time: selectedTime,
            status: 'pending',
            createdAt: serverTimestamp(),
            // Denormalized data for convenience
            customerName: user.name || 'Anonymous',
            customerContact: summaryData?.phone || user.contactNumber || '',
            customerAddress: `${summaryData?.flat || ''}, ${summaryData?.society || ''}`.trim() || user.address || '',
            customerId: user.id
        };

        // If user is logged in, save to Firestore
        if (user.id !== 'guest') {
            const bookingsRef = collection(firestore, 'customers', user.id as string, 'bookings');
            await addDoc(bookingsRef, payload);
            
            // Deduct from wallet (assuming store has this or we do it manually in a real app)
            // For now, we'll just show success
            
            toast({
                title: "Booking Confirmed!",
                description: "Your maid booking has been placed and is now being assigned.",
            });
            
            router.push('/dashboard');
        } else {
            // Guest logic
            localStorage.setItem('bookeato_pending_maid_booking', JSON.stringify(payload));
            window.location.href = '/signup?intent=maid_booking';
        }
    } catch (error: any) {
        console.error("Booking failed:", error);
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "Something went wrong while saving your booking. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const timeGroups = {
      'Morning': ['08:00 AM', '09:00 AM', '10:00 AM'],
      'Afternoon': ['12:00 PM', '02:00 PM', '04:00 PM'],
      'Evening': ['05:00 PM', '06:00 PM'],
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white min-h-[600px] flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-stone-100 relative pb-28">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 text-stone-400 hover:text-stone-800 font-bold p-2 transition-colors flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-stone-100 shadow-sm rounded-xl active:scale-95 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> 
          <span className="text-sm">Back</span>
        </button>
      )}
      
      {/* 1. Top Progress Bar */}
      <div className="px-6 sm:px-8 py-5 border-b border-stone-100 bg-stone-50/80 pl-20 sm:pl-24">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wide">
          <div className="flex items-center gap-2 text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-100 flex-shrink-0" />
            <span className="hidden sm:inline line-through decoration-stone-300">1. Estimate</span>
            <span className="sm:hidden line-through decoration-stone-300">1. Est</span>
          </div>
          <div className="h-0.5 w-4 sm:w-8 bg-green-200 rounded-full"></div>
          <div className="flex items-center gap-2 text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-100 flex-shrink-0" />
            <span className="hidden sm:inline line-through decoration-stone-300">2. Details</span>
            <span className="sm:hidden line-through decoration-stone-300">2. Det</span>
          </div>
          <div className="h-0.5 w-4 sm:w-8 bg-stone-200 rounded-full"></div>
          <div className="flex items-center gap-2 text-stone-900 border-b-[3px] border-stone-900 pb-1 -mb-1">
            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
            <span className="hidden sm:inline">3. Schedule</span>
            <span className="sm:hidden">3. Sched</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-10 flex-1">
        
        {/* 2. Date & Time Selector */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
            When do you need the professional?
          </h2>

          <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wide text-stone-500 uppercase flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Select Date
              </h3>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-16 rounded-2xl border-2 justify-start text-left font-black text-lg px-6",
                      !selectedDate && "text-stone-400",
                      selectedDate ? "border-green-500 bg-green-50 text-green-800" : "border-stone-100 text-stone-900"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-6 w-6" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date for service</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[2rem] border-stone-100 shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date) => setSelectedDate(date || null)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="rounded-[2.5rem]"
                  />
                </PopoverContent>
              </Popover>
          </div>

          <div className="space-y-6">
              <h3 className="text-sm font-bold tracking-wide text-stone-500 uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time Slots
              </h3>
              
              <div className="space-y-5">
                  {(Object.keys(timeGroups) as Array<keyof typeof timeGroups>).map(group => (
                      <div key={group} className="space-y-3">
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">{group}</h4>
                          <div className="flex flex-wrap gap-3">
                              {timeGroups[group].map(time => (
                                  <button
                                      key={time}
                                      onClick={() => setSelectedTime(time)}
                                      className={cn(
                                          "px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all touch-manipulation",
                                          selectedTime === time 
                                            ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20" 
                                            : "bg-white border-stone-100 text-stone-700 hover:border-stone-300"
                                      )}
                                  >
                                      {time}
                                  </button>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* 3. Order Summary Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100 space-y-4">
            <h3 className="font-bold text-stone-900 border-b border-stone-100 pb-3">Review Details</h3>
            
            <div className="space-y-2 text-sm font-medium pt-1">
                <div className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500">Service:</span>
                    <span className="text-stone-800 font-bold">Maid - A-La-Carte</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500">Estimate:</span>
                    <span className="text-stone-800">{summaryData?.time || '1.0 Hrs'} <span className="text-stone-300 px-1">•</span> <span className="text-green-600 font-bold text-base">{summaryData?.price || '₹149'}</span></span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500">Location:</span>
                    <span className="text-stone-800 text-right max-w-[150px] sm:max-w-[200px] truncate">{summaryData?.flat ? `${summaryData.flat}, ${summaryData.society}` : 'My Home Avatar, Flat 402'}</span>
                </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-stone-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Wallet Balance</span>
                    <span className={cn(canAfford ? "text-green-600" : "text-red-600")}>
                        ₹{walletBalance.toLocaleString()}
                    </span>
                </div>
                {!canAfford && (
                    <div className="bg-red-50 text-[10px] p-2 rounded-lg text-red-700 flex items-center gap-2 font-bold animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        Insufficient balance. Top up ₹{costNum - walletBalance} to proceed.
                    </div>
                )}
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-4 text-xs font-bold text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                30-Day No Disruption Guarantee Available Post-Trial
            </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6 py-5 flex items-center justify-end z-10 transition-transform">
        <button 
          type="button"
          onClick={handleConfirmBooking}
          disabled={!selectedDate || !selectedTime || isSubmitting}
          className={cn(
            "text-white text-sm sm:text-base font-black py-4 px-8 sm:px-10 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-2",
            canAfford ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" : "bg-stone-900 hover:bg-stone-800 shadow-stone-950/20"
          )}
        >
          {isSubmitting ? 'Processing...' : (
            canAfford ? (
                <>Place Booking <ShoppingCart className="w-4 h-4" /></>
            ) : (
                <>Top up & Book <Wallet className="w-4 h-4" /></>
            )
          )}
        </button>
      </div>
    </div>
  );
}
