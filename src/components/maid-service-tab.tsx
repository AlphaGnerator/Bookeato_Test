'use client';

import React, { useState } from 'react';
import { X, Clock, CheckCircle2, Calendar as CalendarIcon, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

export function MaidServiceTab() {
  const [selectedPlan, setSelectedPlan] = useState<'half_hour' | 'one_hour' | 'monthly'>('one_hour');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00 AM');
  const [selectedServices, setSelectedServices] = useState<string[]>(['house_cleaning', 'sweeping', 'utensils']);

  const servicesList = [
    {
      id: 'house_cleaning',
      title: 'House Cleaning',
      desc: 'Deep cleaning, dusting & tidying',
      img: '/images/services/house_cleaning.png',
    },
    {
      id: 'sweeping',
      title: 'Sweeping & Mopping',
      desc: 'Complete floor sweeping & wet mopping',
      img: '/images/services/sweeping_mopping.png',
    },
    {
      id: 'utensils',
      title: 'Utensils & Kitchen',
      desc: 'Dishwashing, sink cleaning & counters',
      img: '/images/services/kitchen_utensils.png',
    },
    {
      id: 'bathroom',
      title: 'Bathroom Sanitization',
      desc: 'Deep tile scrubbing & toilet sanitizing',
      img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'laundry',
      title: 'Laundry & Ironing',
      desc: 'Clothes washing, folding & neat ironing',
      img: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'misc',
      title: 'Others (General Help)',
      desc: 'Balcony cleaning, trash & misc help',
      img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    },
  ];

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const timeSlots = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', 
    '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', 
    '06:00 PM', '07:00 PM'
  ];

  const serviceQuery = selectedServices.length > 0 ? `&service=${selectedServices.join(',')}` : '';
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const bookingUrl = selectedPlan === 'monthly'
    ? `/booking/maid?plan=monthly&date=${formattedDate}&timeSlot=${encodeURIComponent(selectedTimeSlot)}${serviceQuery}`
    : `/booking/maid?hours=${selectedPlan === 'half_hour' ? '0.5' : '1.0'}&date=${formattedDate}&timeSlot=${encodeURIComponent(selectedTimeSlot)}${serviceQuery}`;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-10 py-8 px-4 sm:px-6 lg:px-8 bg-white text-stone-800">
      {/* 1. Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
          Instant, verified help for your daily chores.
        </h2>
        <p className="text-lg sm:text-xl text-stone-500 font-medium">
          Transparent time-based pricing. Select your services, book for 30 mins or subscribe monthly.
        </p>
      </div>

      {/* 2. Interactive Service Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-stone-900">Select Maid Services</h3>
          <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            {selectedServices.length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {servicesList.map((service, idx) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <div 
                key={service.id} 
                onClick={() => toggleService(service.id)}
                className={cn(
                  "flex flex-col group overflow-hidden rounded-2xl border-2 transition-all cursor-pointer touch-manipulation relative",
                  isSelected 
                    ? "border-green-500 bg-green-50/20 shadow-md ring-2 ring-green-500/20" 
                    : "bg-stone-50 border-stone-200 hover:border-stone-300"
                )}
              >
                <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-stone-200">
                  <img
                    src={service.img}
                    alt={service.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 right-3 z-10">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all shadow-md",
                      isSelected ? "bg-green-500 border-white text-white scale-110" : "bg-white/80 border-stone-300 text-transparent backdrop-blur-sm"
                    )}>
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-tight flex items-center gap-1.5">
                      <span className="text-green-600 font-extrabold">{idx + 1}.</span> {service.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">{service.desc}</p>
                  </div>
                  <div className="mt-3">
                    <span className={cn(
                      "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider transition-colors inline-block",
                      isSelected ? "bg-green-600 text-white" : "bg-stone-200 text-stone-600 group-hover:bg-stone-300"
                    )}>
                      {isSelected ? "Selected ✓" : "+ Add Service"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Duration / Plan Selector */}
      <div className="bg-green-50/50 rounded-3xl p-6 sm:p-8 border border-green-100/50">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-stone-900">How much time should I book?</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: 0.5 Hrs */}
          <button
            onClick={() => setSelectedPlan('half_hour')}
            className={cn(
              "text-left bg-white rounded-2xl p-5 shadow-sm border flex items-start gap-4 transition-all hover:border-orange-300 w-full active:scale-[0.98] outline-none",
              selectedPlan === 'half_hour' 
                ? "border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/10" 
                : "border-stone-100"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-full shrink-0 transition-colors",
              selectedPlan === 'half_hour' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-green-100 text-green-600"
            )}>
              {selectedPlan === 'half_hour' ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                0.5 Hrs
                <span className="text-sm font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">Starts ₹100</span>
              </h4>
              <p className="text-stone-600 mt-1 text-sm leading-relaxed">
                Perfect for a quick sink of utensils <strong className="font-semibold text-stone-800">OR</strong> a basic floor sweep & mop.
              </p>
            </div>
          </button>

          {/* Card 2: 1.0 Hrs */}
          <button
            onClick={() => setSelectedPlan('one_hour')}
            className={cn(
              "text-left bg-white rounded-2xl p-5 shadow-sm border flex items-start gap-4 transition-all hover:border-orange-300 w-full active:scale-[0.98] outline-none",
              selectedPlan === 'one_hour' 
                ? "border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/10" 
                : "border-stone-100"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-full shrink-0 transition-colors",
              selectedPlan === 'one_hour' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-green-100 text-green-600"
            )}>
              {selectedPlan === 'one_hour' ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                1.0 Hrs
                <span className="text-sm font-medium text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Starts ₹200</span>
              </h4>
              <p className="text-stone-600 mt-1 text-sm leading-relaxed">
                The standard daily reset (Floors + Utensils + Surface wipe).
              </p>
            </div>
          </button>

          {/* Card 3: Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              "text-left bg-white rounded-2xl p-5 shadow-sm border flex items-start gap-4 transition-all hover:border-orange-300 w-full active:scale-[0.98] outline-none",
              selectedPlan === 'monthly' 
                ? "border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/10" 
                : "border-stone-100"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-full shrink-0 transition-colors shadow-lg",
              selectedPlan === 'monthly' ? "bg-orange-500 text-white shadow-orange-500/30" : "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
            )}>
              {selectedPlan === 'monthly' ? <Check className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                Monthly
                <span className="text-sm font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">Starts at ₹3,960/mo</span>
              </h4>
              <p className="text-stone-600 mt-1 text-sm leading-relaxed">
                Total autopilot. <strong className="font-semibold text-stone-800">Zero Disruption</strong> guarantee with automatic backups.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Booking Date & Time Slot Selector */}
      <div className="bg-stone-50 rounded-3xl p-6 sm:p-8 border border-stone-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-500" /> Select Booking Date & Time Slot
            </h3>
            <p className="text-stone-500 text-sm">Choose when you would like the helper to arrive</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Date Picker */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Service Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-xl justify-start text-left font-bold border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Picker */}
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Preferred Time Slot</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center",
                    selectedTimeSlot === slot
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-[1.02]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. 'Strictly Out of Scope' Boundaries */}
      <div className="bg-stone-50 rounded-3xl p-6 sm:p-8 border border-stone-100">
        <h3 className="text-xl font-bold text-stone-800 mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
          What our Maids do NOT do
          <span className="text-sm font-normal text-stone-500">(For their safety and yours)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          {[
            'Deep Cleaning (No acid wash or chimneys)',
            'Cooking & Chopping (Book a Cook instead!)',
            'Heavy Lifting & Moving Furniture',
            'High-Reach Areas (Cleaning ceiling fans)'
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 bg-red-100 text-red-500 rounded-full p-1 shrink-0">
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              <span className="text-stone-600 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. The Call to Action */}
      <div className="flex justify-center pt-4 pb-8">
        <Link 
          href={bookingUrl} 
          className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-orange-500/40 active:scale-95 flex items-center gap-2"
        >
          {selectedPlan === 'monthly' 
            ? 'Subscribe to Monthly Plan' 
            : selectedPlan === 'half_hour' 
            ? 'Select Chores & Book (0.5 Hrs)' 
            : 'Select Chores & Book (1.0 Hrs)'}
          <CheckCircle2 className="w-5 h-5 opacity-90" />
        </Link>
      </div>
    </div>
  );
}
