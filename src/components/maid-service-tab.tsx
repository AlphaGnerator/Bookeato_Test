import React, { useState } from 'react';
import { X, Clock, CheckCircle2, Calendar, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function MaidServiceTab() {
  const [selectedPlan, setSelectedPlan] = useState<'half_hour' | 'one_hour' | 'monthly'>('one_hour');

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 py-8 px-4 sm:px-6 lg:px-8 bg-white text-stone-800">
      {/* 1. Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
          Instant, verified help for your daily chores.
        </h2>
        <p className="text-lg sm:text-xl text-stone-500 font-medium">
          Transparent time-based pricing. Book for 30 mins or subscribe monthly.
        </p>
      </div>

      {/* 2. The Visual Service Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            title: 'Sweeping & Mopping',
            img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&h=300&auto=format&fit=crop', // cleaning
          },
          {
            title: 'Utensils & Kitchen',
            img: '/images/utensils_kitchen.png', // dishes
          },
          {
            title: 'Bathroom Sanitization',
            img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&h=300&auto=format&fit=crop', // bathroom
          },
          {
            title: 'Laundry & Ironing',
            img: '/images/maid_laundry.png', // laundry
          },
        ].map((service, idx) => (
          <div key={idx} className="flex flex-col group overflow-hidden rounded-2xl bg-stone-50 border border-stone-100 transition-all hover:shadow-md">
            <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-stone-200">
              <img
                src={service.img}
                alt={service.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
            <div className="p-4 flex-1 flex items-center justify-center text-center">
              <h3 className="font-semibold text-stone-800 text-sm sm:text-base leading-tight">
                <span className="text-green-500 mr-1">{idx + 1}.</span> {service.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* 3. The 'Comfortable Capacity' Guide */}
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
              {selectedPlan === 'monthly' ? <Check className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                Monthly
                <span className="text-sm font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">₹5,500</span>
              </h4>
              <p className="text-stone-600 mt-1 text-sm leading-relaxed">
                Total autopilot. <strong className="font-semibold text-stone-800">Zero Disruption</strong> guarantee with automatic backups.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. 'Strictly Out of Scope' Boundaries */}
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

      {/* 5. The Call to Action */}
      <div className="flex justify-center pt-4 pb-8">
        <Link 
          href={
            selectedPlan === 'monthly' 
              ? '/booking/maid?plan=monthly' 
              : selectedPlan === 'half_hour' 
              ? '/booking/maid?hours=0.5' 
              : '/booking/maid?hours=1.0'
          } 
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
