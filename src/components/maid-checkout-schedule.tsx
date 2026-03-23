'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';

export function MaidCheckoutSchedule({ onBack }: { onBack?: () => void }) {
  const { user } = useCulinaryStore();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    // Attempt to pull data from previous steps
    const step2DataRaw = typeof window !== 'undefined' ? localStorage.getItem('bookeato_maid_checkout_step2') : null;
    if (step2DataRaw) {
      try {
        const step2Data = JSON.parse(step2DataRaw);
        setSummaryData({
          time: 'Est. 120 mins', // Mocking this since Step 1 wasn't literally passed in this demo, but in real app it naturally would be.
          price: '₹400',
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

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;

    const payload = {
      service: 'Maid - A-La-Carte',
      chores: ['Sweeping', 'Utensils'], // Mocked for now
      totalTime: summaryData?.time || 'N/A',
      price: summaryData?.price || 'N/A',
      phone: summaryData?.phone || 'N/A',
      address: `${summaryData?.flat || ''}, ${summaryData?.society || ''}`,
      date: selectedDate.toISOString(),
      timeslot: selectedTime,
    };

    localStorage.setItem('bookeato_pending_maid_booking', JSON.stringify(payload));
    
    // Redirect seamlessly based on login status
    if (user.id !== 'guest') {
        router.push('/dashboard');
    } else {
        window.location.href = '/signup?intent=maid_booking';
    }
  };

  const timeGroups = {
      'Morning': ['08:00 AM', '09:00 AM', '10:00 AM'],
      'Afternoon': ['12:00 PM', '02:00 PM', '04:00 PM'],
      'Evening': ['05:00 PM', '06:00 PM'],
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white min-h-[600px] flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-stone-100 relative pb-28">
      
      {/* 1. Top Progress Bar */}
      <div className="px-6 sm:px-8 py-5 border-b border-stone-100 bg-stone-50/80">
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
                  <CalendarIcon className="w-4 h-4" /> Pick a Date
              </h3>
              
              {/* Horizontal Date Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
                  {dates.map((d, i) => {
                      const isSelected = selectedDate?.toDateString() === d.fullDate.toDateString();
                      return (
                          <button
                              key={i}
                              onClick={() => setSelectedDate(d.fullDate)}
                              className={cn(
                                  "flex flex-col items-center justify-center min-w-[70px] h-[85px] rounded-2xl border-2 transition-all flex-shrink-0 touch-manipulation",
                                  isSelected 
                                    ? "bg-green-50 border-green-500 shadow-md shadow-green-500/10 text-green-800" 
                                    : "bg-white border-stone-100 text-stone-500 hover:border-stone-300"
                              )}
                          >
                              <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{d.day}</span>
                              <span className={cn("text-xl font-black", isSelected ? "text-green-700" : "text-stone-800")}>{d.date}</span>
                          </button>
                      );
                  })}
              </div>
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

            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-4 text-xs font-bold text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                30-Day No Disruption Guarantee Available Post-Trial
            </div>
        </div>

      </div>

      {/* 5. Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6 py-5 flex items-center justify-between z-10 transition-transform">
        <button type="button" onClick={onBack} className="text-stone-400 hover:text-stone-700 font-bold text-sm sm:text-base flex items-center transition-colors px-2 py-2">
          <ChevronLeft className="w-5 h-5 mr-1" strokeWidth={2.5} />
          Back <span className="hidden sm:inline">&nbsp;to Details</span>
        </button>
        <button 
          type="button"
          onClick={handleConfirmBooking}
          disabled={!selectedDate || !selectedTime}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm sm:text-base font-bold py-3 px-6 sm:px-8 rounded-full shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Confirm & Login to Pay
        </button>
      </div>
    </div>
  );
}
