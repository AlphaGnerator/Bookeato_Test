'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, Calendar as CalendarIcon, Clock, Check, CalendarDays, MapPin, Wallet, AlertCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function MaidCheckoutSchedule({ onBack }: { onBack?: () => void }) {
  const { user } = useCulinaryStore();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>('09:00 AM');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [society, setSociety] = useState('');
  const [flat, setFlat] = useState('');

  const [estimate, setEstimate] = useState<{ 
    totalTime: number; 
    slotLabel: string; 
    price: string; 
    chores?: any[];
    isMonthly?: boolean;
    bookedHours?: number | null;
    recommendedHours?: number | null;
    selectedDate?: string;
    selectedTimeSlot?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.id && user.id !== 'guest') {
      if (user.contactNumber) setPhoneNumber(user.contactNumber.replace('+91', ''));
      if (user.pincode) setPincode(user.pincode);
      if (user.address) {
        if (user.address.includes(',')) {
          const parts = user.address.split(',');
          setSociety(parts[0].trim());
          setFlat(parts.slice(1).join(',').trim());
        } else {
          setSociety(user.address);
        }
      }
    }

    const estimateRaw = typeof window !== 'undefined' ? localStorage.getItem('bookeato_maid_estimate') : null;
    if (estimateRaw) {
      try {
        const est = JSON.parse(estimateRaw);
        setEstimate(est);
        if (est.selectedDate) {
          setSelectedDate(new Date(est.selectedDate));
        }
        if (est.selectedTimeSlot) {
          setSelectedTime(est.selectedTimeSlot);
        }
      } catch (e) {}
    }
  }, [user]);

  const costStr = estimate?.price || '₹200';
  const costNum = parseInt(costStr.replace(/\D/g, '')) || 0;
  const walletBalance = user.walletBalance || 0;
  const canAfford = walletBalance >= costNum;

  const isAddressValid = (phoneNumber.length >= 10 || !!user.contactNumber) && (pincode.length === 6 || !!user.pincode);

  const getEndDate = (startDate: Date | null) => {
    if (!startDate) return null;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    return endDate;
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !firestore) return;

    if (!canAfford && user.id && user.id !== 'guest') {
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
        const fullAddress = `${flat ? flat + ', ' : ''}${society}`.trim() || user.address || 'Address provided at booking';
        
        const payload: any = {
            service: estimate?.isMonthly ? 'Maid - Monthly Plan' : 'Maid - Service Visit',
            type: estimate?.isMonthly ? 'maid_monthly' : 'maid',
            items: estimate?.chores || [],
            totalCost: costNum,
            totalTime: estimate?.totalTime || 0,
            bookingDate: selectedDate.toISOString(),
            mealType: selectedTime.includes('AM') ? 'Breakfast' : (parseInt(selectedTime) < 4 ? 'Lunch' : 'Dinner'),
            time: selectedTime,
            status: 'pending',
            createdAt: serverTimestamp(),
            customerName: user.name || 'Customer',
            customerContact: phoneNumber ? "+91" + phoneNumber : (user.contactNumber || ''),
            customerAddress: fullAddress,
            pincode: pincode || user.pincode || '',
            customerId: user.id || 'guest',
            ...(estimate?.isMonthly && {
              startDate: selectedDate.toISOString(),
              endDate: getEndDate(selectedDate)!.toISOString()
            })
        };

        if (user.id && user.id !== 'guest') {
            const bookingsRef = collection(firestore, 'customers', user.id as string, 'bookings');
            await addDoc(bookingsRef, payload);
            
            toast({
                title: "Booking Confirmed!",
                description: "Your maid request has been placed and is assigned to a top-rated professional.",
            });
            
            router.push('/dashboard');
        } else {
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

  return (
    <div className="w-full max-w-2xl mx-auto bg-white min-h-[600px] flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-stone-100 relative pb-28">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 text-stone-400 hover:text-stone-800 font-bold p-2 transition-colors flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-stone-100 shadow-sm rounded-xl active:scale-95 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> 
          <span className="text-sm">Back to Chores</span>
        </button>
      )}
      
      {/* Top Progress Bar */}
      <div className="px-6 sm:px-8 py-5 border-b border-stone-100 bg-stone-50/80 pl-24 sm:pl-28">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wide">
          <div className="flex items-center gap-2 text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-100 flex-shrink-0" />
            <span>1. Chores & Schedule</span>
          </div>
          <div className="h-0.5 w-6 sm:w-12 bg-green-300 rounded-full"></div>
          <div className="flex items-center gap-2 text-stone-900 border-b-[3px] border-stone-900 pb-1 -mb-1">
            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
            <span>2. Address & Payment</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8 flex-1">
        
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
            Final Step: Address & Checkout
          </h2>
          <p className="text-stone-500 font-medium text-sm">
            Review your selected visit time, enter your service location, and confirm booking.
          </p>
        </div>

        {/* Selected Schedule Summary Card */}
        <div className="bg-green-50/60 border border-green-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 text-white rounded-xl shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 block">Selected Arrival Slot</span>
              <span className="font-extrabold text-stone-900 text-base">
                {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : 'Tomorrow'} at {selectedTime || '09:00 AM'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onBack}
            className="text-xs font-bold text-green-700 hover:text-green-800 underline self-start sm:self-center"
          >
            Change Time
          </button>
        </div>

        {/* Address Inputs Section */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" /> Service Location Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">Phone Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-stone-400 font-bold text-sm">+91</span>
                <input 
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="99999 99999"
                  className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-green-500 outline-none text-sm font-bold text-stone-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">Area Pincode</label>
              <input 
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 560001"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-green-500 outline-none text-sm font-bold text-stone-900 tracking-wider"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">Society / Building Name</label>
              <input 
                type="text"
                value={society}
                onChange={(e) => setSociety(e.target.value)}
                placeholder="e.g. Prestige Lakeside"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-green-500 outline-none text-sm font-bold text-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">Flat / House Number</label>
              <input 
                type="text"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="e.g. Flat 402, Tower B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-green-500 outline-none text-sm font-bold text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Order Summary & Wallet Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center justify-between">
              <span>Payment Summary</span>
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-0.5 rounded-full">Guaranteed Quality</span>
            </h3>
            
            <div className="space-y-2 text-sm font-medium">
                <div className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500">Service Plan:</span>
                    <span className="text-stone-800 font-bold">{estimate?.isMonthly ? 'Maid - Monthly Plan' : 'Maid - On Demand'}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500">Estimated Duration:</span>
                    <span className="text-stone-800 font-bold">{estimate?.totalTime ?? 60} mins</span>
                </div>
                {estimate?.chores && estimate.chores.length > 0 && (
                  <div className="py-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Selected Chores:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {estimate.chores.map((c: any, i: number) => (
                        <span key={i} className="text-[11px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                          ✓ {c.choreName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <span className="text-base font-extrabold text-stone-900">Total Price:</span>
                    <span className="text-2xl font-black text-green-600">{costStr}</span>
                </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-stone-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Wallet Balance</span>
                    <span className={cn(canAfford ? "text-green-600" : "text-red-600")}>
                        ₹{walletBalance.toLocaleString()}
                    </span>
                </div>
                {!canAfford && (
                    <div className="bg-red-50 text-[10px] p-2 rounded-lg text-red-700 flex items-center gap-2 font-bold animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Insufficient balance. Top up ₹{costNum - walletBalance} to proceed.
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* Bottom Sticky Payment CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6 py-5 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Payable</span>
          <span className="text-xl font-black text-stone-900">{costStr}</span>
        </div>
        <button 
          type="button"
          onClick={handleConfirmBooking}
          disabled={!selectedDate || !selectedTime || isSubmitting || !isAddressValid}
          className={cn(
            "text-white text-sm sm:text-base font-black py-3.5 px-8 sm:px-10 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
            canAfford ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" : "bg-stone-900 hover:bg-stone-800 shadow-stone-950/20"
          )}
        >
          {isSubmitting ? 'Processing...' : (
            canAfford ? (
                <>Confirm & Place Booking <ShoppingCart className="w-4 h-4" /></>
            ) : (
                <>Top Up Wallet & Book <Wallet className="w-4 h-4" /></>
            )
          )}
        </button>
      </div>
    </div>
  );
}
