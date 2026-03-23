'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChefHat, Sparkles, X, Plus } from 'lucide-react';
import type { Booking } from './upcoming-bookings-feed';
import { useToast } from '@/hooks/use-toast';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooking: Booking;
}

export function EditBookingModal({ isOpen, onClose, selectedBooking }: EditBookingModalProps) {
  const { toast } = useToast();
  
  // Base initialization against incoming explicit prop state
  const [newTotalPrice, setNewTotalPrice] = useState(selectedBooking.currentPrice);
  const [editedItems, setEditedItems] = useState<string[]>(selectedBooking.items || []);

  // Sync edits safely if props change unexpectedly
  useEffect(() => {
     if (isOpen) {
        setEditedItems(selectedBooking.items || []);
     }
  }, [isOpen, selectedBooking]);

  // Static Matrix Mock Engine
  const CHORE_PRICES: Record<string, number> = {
    'Sweeping & Mopping': 100,
    'Utensils': 50,
    'Bathrooms': 100,
    'Laundry': 50
  };

  useEffect(() => {
    // Delta Calculator Logic
    if (selectedBooking.type === 'maid') {
       let calculatedNew = 100; // Hardcoded base visit fee proxy
       editedItems.forEach(item => {
           calculatedNew += (CHORE_PRICES[item] || 0);
       });
       setNewTotalPrice(calculatedNew);
    } else {
       // Cook plans typically don't charge incremental basis for simple dish swaps
       setNewTotalPrice(selectedBooking.currentPrice);
    }
  }, [editedItems, selectedBooking]);

  const priceDelta = newTotalPrice - selectedBooking.currentPrice;

  const handleProcessTransaction = () => {
     // Transaction resolution
     toast({
        title: "Order Updated Guaranteed",
        description: `Changes preserved. Account offset: ₹${priceDelta}.`
     });
     onClose();
  };

  // Render Cook UI Profile
  const renderCookUI = () => (
    <div className="space-y-4 py-4">
      <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
         <p className="text-sm font-black text-orange-900 tracking-tight mb-4 uppercase">Currently Selected Dishes</p>
         <ul className="space-y-3">
            {editedItems.map((dish, i) => (
               <li key={i} className="flex items-center justify-between text-sm font-bold bg-white p-3.5 rounded-xl border border-orange-100 shadow-sm text-stone-700">
                 <span>{dish}</span>
                 <button onClick={() => setEditedItems(prev => prev.filter(d => d !== dish))} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                   <X className="w-4 h-4" strokeWidth={3}/>
                 </button>
               </li>
            ))}
         </ul>
      </div>
      <Button variant="outline" className="w-full border-dashed border-2 hover:border-orange-500 hover:bg-orange-50 font-bold h-12 text-stone-500 hover:text-orange-600 transition-colors" onClick={() => {toast({title:"Placeholder Menu Router"})}}>
         <Plus className="w-4 h-4 mr-2" /> Add Dish
      </Button>
    </div>
  );

  // Render Maid UI Profile
  const renderMaidUI = () => (
    <div className="space-y-3 py-4">
      <p className="text-xs font-black text-stone-500 uppercase tracking-widest pl-2 mb-2">Edit Required Chores</p>
      {Object.keys(CHORE_PRICES).map(chore => {
        const isChecked = editedItems.includes(chore);
        return (
          <label key={chore} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors cursor-pointer group ${isChecked ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-stone-100 hover:border-stone-200 bg-white'}`}>
             <div className="flex items-center gap-3">
               <input 
                 onChange={() => {
                   if (isChecked) setEditedItems(prev => prev.filter(c => c !== chore));
                   else setEditedItems(prev => [...prev, chore]);
                 }}
                 type="checkbox" 
                 checked={isChecked}
                 className="w-5 h-5 rounded-md border-stone-300 text-green-500 focus:ring-green-500 accent-green-500 cursor-pointer shrink-0" 
               />
               <span className={`font-bold transition-colors ${isChecked ? 'text-green-900' : 'text-stone-700 group-hover:text-stone-900'}`}>{chore}</span>
             </div>
             <span className={`text-sm font-black transition-colors ${isChecked ? 'text-green-700' : 'text-stone-400 group-hover:text-stone-600'}`}>+₹{CHORE_PRICES[chore]}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-6 sm:p-8 bg-white overflow-hidden shadow-2xl border-none">
        <DialogHeader className="mb-2">
          <div className="flex items-start gap-4 mb-2">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${selectedBooking.type === 'cook' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                {selectedBooking.type === 'cook' ? <ChefHat className="w-7 h-7" strokeWidth={2}/> : <Sparkles className="w-7 h-7" strokeWidth={2.5}/>}
             </div>
             <div>
                 <DialogTitle className="text-2xl font-black text-stone-900 leading-tight tracking-tight">Edit Order</DialogTitle>
                 <DialogDescription className="text-stone-500 font-bold mt-1 max-w-[200px]">Modifying your {selectedBooking.service} configuration.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        {selectedBooking.type === 'cook' ? renderCookUI() : renderMaidUI()}

        <DialogFooter className="bg-stone-50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 mt-4 border-t border-stone-200/60 flex-col gap-4">
          
          <div className="flex-col pb-3 mb-1 border-b-2 border-dashed border-stone-200">
             {priceDelta > 0 && (
                <p className="text-sm font-black text-center text-stone-600 uppercase tracking-wider block">
                  Additional Due: <span className="text-orange-600 text-2xl font-black block mt-1 tracking-tight">₹{priceDelta}</span>
                </p>
             )}
             {priceDelta < 0 && (
                <p className="text-sm font-black text-center text-stone-600 uppercase tracking-wider block">
                  Refund Due: <span className="text-green-600 text-2xl font-black block mt-1 tracking-tight">₹{Math.abs(priceDelta)}</span>
                </p>
             )}
             {priceDelta === 0 && (
                <p className="text-xs font-black text-center text-stone-400 uppercase tracking-widest block py-2">
                  No Price Impact
                </p>
             )}
          </div>
          
          <div className="flex w-full gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-14 font-black rounded-xl border-2 hover:bg-stone-100 text-stone-600">
              Cancel
            </Button>
            
            <Button onClick={handleProcessTransaction} className={`flex-1 h-14 font-black rounded-xl text-white shadow-xl transition-all active:scale-95 ${priceDelta === 0 ? 'bg-stone-900 hover:bg-stone-800 shadow-stone-900/20' : priceDelta > 0 ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'}`}>
              {priceDelta === 0 && 'Confirm Changes'}
              {priceDelta > 0 && `Pay ₹${priceDelta}`}
              {priceDelta < 0 && 'Update & Credit Wallet'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
