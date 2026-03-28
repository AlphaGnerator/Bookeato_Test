'use client';

import React, { useState } from 'react';
import { Minus, Plus, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MaidSmartEstimator({ onNext, onBack }: { onNext?: () => void, onBack?: () => void }) {
  const [homeSize, setHomeSize] = useState('2 BHK');
  const [occupants, setOccupants] = useState('1-2 People');
  
  const [chores, setChores] = useState({
    sweeping: false,
    utensils: false,
    bathroom: false,
    laundry: false,
    misc: false,
  });
  
  const [miscTime, setMiscTime] = useState(30);

  const [bathrooms, setBathrooms] = useState(1);

  // multipliers based on inputs
  const homeSizeMultiplier = homeSize === '1 BHK' ? 0 : homeSize === '2 BHK' ? 1 : homeSize === '3 BHK' ? 2 : 3;
  const occupantsMultiplier = occupants === '1-2 People' ? 0 : occupants === '3-4 People' ? 1 : 2;

  // dynamic chore times (in minutes)
  const sweepingTime = 20 + (homeSizeMultiplier * 10);
  const utensilsTime = 15 + (occupantsMultiplier * 15);
  const bathroomTime = bathrooms * 15; // static 15m * bathroom count
  const laundryTime = 15 + (occupantsMultiplier * 15);

  const totalTime = 
    (chores.sweeping ? sweepingTime : 0) +
    (chores.utensils ? utensilsTime : 0) +
    (chores.bathroom ? bathroomTime : 0) +
    (chores.laundry ? laundryTime : 0) +
    (chores.misc ? miscTime : 0);

  // tier mapping for sticky bottom cart
  let slotLabel = 'Select Chores';
  let slotPrice = '₹0';
  let slotReady = false;

  if (totalTime > 0) {
    slotReady = true;
    if (totalTime <= 30) {
      slotLabel = '30 Min Slot';
      slotPrice = '₹100';
    } else if (totalTime <= 60) {
      slotLabel = '1 Hour Slot';
      slotPrice = '₹200';
    } else if (totalTime <= 90) {
      slotLabel = '1.5 Hour Slot';
      slotPrice = '₹300';
    } else {
      // Dynamic fallback for highly customized loads (e.g. 2+ Hour Slot)
      const hours = Math.ceil(totalTime / 30) * 0.5;
      slotLabel = `${hours} Hour Slot`;
      slotPrice = `₹${hours * 200}`; // Scaled price logic
    }
  }

  const toggleChore = (key: keyof typeof chores) => {
    setChores(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    if (slotReady) {
      const selectedChores = Object.entries(chores)
        .filter(([_, checked]) => checked)
        .map(([name, _]) => {
          let estimatedTime = 0;
          let choreName = "";
          
          switch(name) {
            case 'sweeping': 
              estimatedTime = sweepingTime; 
              choreName = "Sweeping & Mopping";
              break;
            case 'utensils': 
              estimatedTime = utensilsTime; 
              choreName = "Utensils & Kitchen Reset";
              break;
            case 'bathroom': 
              estimatedTime = bathroomTime; 
              choreName = `${bathrooms} Bathroom Sanitization`;
              break;
            case 'laundry': 
              estimatedTime = laundryTime; 
              choreName = "Laundry & Ironing";
              break;
            case 'misc': 
              estimatedTime = miscTime; 
              choreName = `Miscellaneous Chores (${miscTime}m)`;
              break;
          }
          
          return { choreName, estimatedTime };
        });

      localStorage.setItem('bookeato_maid_estimate', JSON.stringify({
        totalTime,
        slotLabel,
        price: slotPrice,
        chores: selectedChores
      }));
      if (onNext) onNext();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white min-h-[500px] flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-stone-100 relative pb-28 md:pb-24">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 text-stone-400 hover:text-stone-800 font-bold p-2 transition-colors flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-stone-100 shadow-sm rounded-xl active:scale-95 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> 
          <span className="text-sm">Back</span>
        </button>
      )}
      <div className="p-6 sm:p-8 space-y-10 flex-1 pt-20 sm:pt-24">
        
        {/* 1. Top Section: Context Gatherer */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-wide text-stone-500 uppercase">
              Home Size <span className="text-stone-400 font-medium normal-case">(Calculates Floor time)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(size => (
                <button
                  key={size}
                  onClick={() => setHomeSize(size)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95",
                    homeSize === size 
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20" 
                      : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-wide text-stone-500 uppercase">
              Household Size <span className="text-stone-400 font-medium normal-case">(Calculates Utensil/Laundry time)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['1-2 People', '3-4 People', '5+ People'].map(size => (
                <button
                  key={size}
                  onClick={() => setOccupants(size)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95",
                    occupants === size 
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20" 
                      : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* 2. Middle Section: Dynamic Chore Selection */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-stone-900">Customize Your Chores</h3>
          
          <div className="space-y-3">
            {/* Sweeping & Mopping */}
            <div 
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-colors cursor-pointer touch-manipulation", 
                chores.sweeping ? "border-green-500 bg-green-50/30" : "border-stone-100 hover:border-stone-200 bg-white"
              )}
              onClick={() => toggleChore('sweeping')}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", chores.sweeping ? "bg-green-500 border-green-500 text-white" : "border-stone-300")}>
                  {chores.sweeping && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="font-bold text-stone-800">Sweeping & Mopping</span>
              </div>
              <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{sweepingTime} mins</span>
            </div>

            {/* Utensils */}
            <div 
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-colors cursor-pointer touch-manipulation", 
                chores.utensils ? "border-green-500 bg-green-50/30" : "border-stone-100 hover:border-stone-200 bg-white"
              )}
              onClick={() => toggleChore('utensils')}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", chores.utensils ? "bg-green-500 border-green-500 text-white" : "border-stone-300")}>
                  {chores.utensils && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="font-bold text-stone-800">Utensils & Kitchen Reset</span>
              </div>
              <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{utensilsTime} mins</span>
            </div>

            {/* Bathroom Sanitization */}
            <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 transition-colors gap-4", 
                chores.bathroom ? "border-green-500 bg-green-50/30" : "border-stone-100 bg-white"
            )}>
              <div className="flex items-center gap-3 flex-1 cursor-pointer touch-manipulation" onClick={() => toggleChore('bathroom')}>
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", chores.bathroom ? "bg-green-500 border-green-500 text-white" : "border-stone-300")}>
                  {chores.bathroom && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="font-bold text-stone-800">Bathroom Sanitization</span>
              </div>
              <div className="flex items-center gap-4 justify-between sm:justify-end pl-9 sm:pl-0">
                {chores.bathroom && (
                  <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-full px-2 py-1 shadow-sm">
                    <button 
                      className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 disabled:opacity-50"
                      onClick={(e) => { e.stopPropagation(); setBathrooms(Math.max(1, bathrooms - 1)); }}
                      disabled={bathrooms <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-800 w-4 text-center">{bathrooms}</span>
                    <button 
                      className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600"
                      onClick={(e) => { e.stopPropagation(); setBathrooms(bathrooms + 1); }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full min-w-[70px] text-center">{bathroomTime} mins</span>
              </div>
            </div>
            {/* Laundry & Ironing */}
            <div 
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-colors cursor-pointer touch-manipulation", 
                chores.laundry ? "border-green-500 bg-green-50/30" : "border-stone-100 hover:border-stone-200 bg-white"
              )}
              onClick={() => toggleChore('laundry')}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", chores.laundry ? "bg-green-500 border-green-500 text-white" : "border-stone-300")}>
                  {chores.laundry && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="font-bold text-stone-800">Laundry & Ironing</span>
              </div>
              <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{laundryTime} mins</span>
            </div>
            
            {/* Miscellaneous */}
            <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 transition-colors gap-4", 
                chores.misc ? "border-green-500 bg-green-50/30" : "border-stone-100 bg-white"
            )}>
              <div className="flex items-center gap-3 flex-1 cursor-pointer touch-manipulation" onClick={() => toggleChore('misc')}>
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", chores.misc ? "bg-green-500 border-green-500 text-white" : "border-stone-300")}>
                  {chores.misc && <Check className="w-4 h-4" strokeWidth={3} />}
                </div>
                <span className="font-bold text-stone-800">Miscellaneous Chores</span>
              </div>
              
              <div className="flex items-center gap-4 justify-between sm:justify-end pl-9 sm:pl-0">
                <div className={cn("flex items-center bg-stone-50 border border-stone-200 rounded-xl p-1 transition-opacity", !chores.misc && "opacity-50 pointer-events-none")}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMiscTime(30); }}
                    className={cn(
                      "px-3 py-1 text-xs font-black rounded-lg transition-all",
                      miscTime === 30 ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    30M
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMiscTime(60); }}
                    className={cn(
                      "px-3 py-1 text-xs font-black rounded-lg transition-all",
                      miscTime === 60 ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    1H
                  </button>
                </div>
                <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full min-w-[70px] text-center">
                  {chores.misc ? miscTime : 0} mins
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Bottom Section: The Dynamic Pricing Cart */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6 py-5 flex items-center justify-end z-10 transition-transform">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            {!slotReady && (
              <span className="text-sm font-bold text-stone-400">Select chores to estimate</span>
            )}
            {slotReady && (
              <>
                <span className="font-black text-lg sm:text-2xl text-stone-900">
                  {slotLabel} <span className="text-stone-300 px-1 font-normal">•</span> <span className="text-green-600">{slotPrice}</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wide">Est. Time: {totalTime} Minutes</span>
              </>
            )}
          </div>
        </div>
        <button 
          disabled={!slotReady}
          onClick={handleNext}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm sm:text-base font-bold py-3 px-5 sm:px-8 rounded-full shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Next: Location details
        </button>
      </div>
    </div>
  );
}
