'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, MapPin, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCulinaryStore } from '@/hooks/use-culinary-store';

export function MaidCheckoutDetails({ onBack, onNext }: { onBack?: () => void, onNext?: () => void }) {
  const { user, isInitialized } = useCulinaryStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [society, setSociety] = useState('');
  const [flat, setFlat] = useState('');

  useEffect(() => {
    if (isInitialized && user && user.id !== 'guest') {
      if (user.contactNumber) {
          const rawPhone = user.contactNumber.replace('+91', '');
          if (rawPhone) setPhoneNumber(rawPhone);
      }
      if (user.pincode) setPincode(user.pincode);
      if (user.address) {
          // If address contains a comma, try to split it into society and flat
          if (user.address.includes(',')) {
              const parts = user.address.split(',');
              setSociety(parts[0].trim());
              setFlat(parts.slice(1).join(',').trim());
          } else {
              setSociety(user.address);
          }
      }
    }
  }, [isInitialized, user]);

  // If logged in and info is complete, we could auto-advance, but let's allow confirmation
  // unless the user specifically wants a one-click experience.

  // Serviceability check based on exact Pincode length match
  const isServiceable = pincode.length === 6; 
  const isFormValid = phoneNumber.length >= 10 && pincode.length === 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // In a real application, chores & calculations from Step 1 are pulled from context here
    const checkoutData = {
      phone: "+91" + phoneNumber,
      pincode: pincode,
      society: society,
      flat: flat,
      timestamp: new Date().toISOString()
    };

    // Data stored to localStorage so the Auth routing can pick it up post verification
    localStorage.setItem('bookeato_maid_checkout_step2', JSON.stringify(checkoutData));
    
    // Simulate navigation
    console.log("Mock routing to Step 3, Payload:", checkoutData);
    if (onNext) onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white min-h-[600px] flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-stone-100 relative pb-24 md:pb-28">
      
      {/* 1. Top Progress Bar */}
      <div className="px-6 sm:px-8 py-5 border-b border-stone-100 bg-stone-50/80">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wide">
          <div className="flex items-center gap-2 text-stone-400">
            <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-100 flex-shrink-0" />
            <span className="hidden sm:inline">1. Estimate</span>
            <span className="sm:hidden">1. Est</span>
          </div>
          <div className="h-0.5 w-4 sm:w-8 bg-stone-200 rounded-full"></div>
          <div className="flex items-center gap-2 text-stone-900 border-b-[3px] border-stone-900 pb-1 -mb-1">
            <span className="bg-stone-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
            <span>2. Details</span>
          </div>
          <div className="h-0.5 w-4 sm:w-8 bg-stone-200 rounded-full"></div>
          <div className="flex items-center gap-2 text-stone-300">
            <span className="bg-stone-200 text-stone-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
            <span className="hidden sm:inline">3. Schedule</span>
            <span className="sm:hidden">3. Sched</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 flex-1">
        {/* 2. Header Section */}
        <div className="space-y-3 mb-10 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
            Where should we send the professional?
          </h2>
          <p className="text-stone-500 font-medium text-lg">
            Enter your details to check serviceability in your society.
          </p>
        </div>

        {/* 3. The Form Fields */}
        <form id="details-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Phone Number */}
          <div className="space-y-2 relative group">
            <label className="text-sm font-bold text-stone-600 block ml-1 transition-colors group-focus-within:text-green-600">
              Phone Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-stone-500 flex items-center h-full">+91</span>
              <input 
                type="tel"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="99999 99999"
                className="w-full pl-[3.25rem] pr-4 py-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-300 text-lg sm:text-xl"
              />
            </div>
          </div>

          {/* Pincode & Serviceability */}
          <div className="space-y-2 relative group">
            <label className="text-sm font-bold text-stone-600 block ml-1 transition-colors group-focus-within:text-green-600">
              Area Pincode
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                autoComplete="off"
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 500032"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-300 text-lg sm:text-xl tracking-widest"
              />
            </div>
            
            {/* Conditional Serviceability Message */}
            <div className={cn("overflow-hidden transition-all duration-300 ease-out", isServiceable ? "max-h-20 opacity-100" : "max-h-0 opacity-0")}>
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200/50 px-4 py-3 rounded-2xl text-sm font-bold mt-2 shadow-sm">
                ✅ Great news! We serve your area.
              </div>
            </div>
          </div>

          {/* Society Name */}
          <div className="space-y-2 group mt-8">
            <label className="text-sm font-bold text-stone-600 block ml-1 transition-colors group-focus-within:text-green-600">
              Society / Building Name
            </label>
            <input 
              type="text"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              placeholder="e.g. My Home Avatar"
              className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-300 text-lg"
            />
          </div>

          {/* Flat Number */}
          <div className="space-y-2 group">
            <label className="text-sm font-bold text-stone-600 block ml-1 transition-colors group-focus-within:text-green-600">
              Flat / Villa Number
            </label>
            <input 
              type="text"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              placeholder="e.g. Tower B, Flat 402"
              className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-300 text-lg"
            />
          </div>
        </form>
      </div>

      {/* 5. Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6 py-5 flex items-center justify-between z-10 transition-transform">
        <button type="button" onClick={onBack} className="text-stone-400 hover:text-stone-700 font-bold text-sm sm:text-base flex items-center transition-colors px-2 py-2">
          <ChevronLeft className="w-5 h-5 mr-1" strokeWidth={2.5} />
          Back <span className="hidden sm:inline">&nbsp;to Chores</span>
        </button>
        <button 
          form="details-form"
          type="submit"
          disabled={!isFormValid}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm sm:text-base font-bold py-3 px-6 sm:px-8 rounded-full shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Next: Schedule
        </button>
      </div>
    </div>
  );
}
