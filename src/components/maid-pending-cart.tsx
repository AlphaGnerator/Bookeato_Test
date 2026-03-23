'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MaidPendingCart() {
  const { user: firebaseUser } = useUser();
  const { user, deductFromWallet, checkBalance } = useCulinaryStore();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const userWalletBalance = user.walletBalance || 0;
  const [paymentMethod, setPaymentMethod] = useState(userWalletBalance >= 200 ? 'wallet' : 'upi');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    if (pendingBooking?.address) {
        setNewAddress(pendingBooking.address);
    }
  }, [pendingBooking]);

  useEffect(() => {
    // Check localStorage on mount for any pending, unpaid maid cart data
    const rawData = typeof window !== 'undefined' ? localStorage.getItem('bookeato_pending_maid_booking') : null;
    if (rawData) {
      try {
        setPendingBooking(JSON.parse(rawData));
      } catch (e) {
        console.error("Error parsing pending booking data", e);
      }
    }
  }, []);

  // Soft-fail: Do not render if the user has no pending maid booking 
  if (!pendingBooking && !isSuccess) return null;

  const handlePaymentSuccess = async () => {
    if (!firebaseUser || !firestore || !pendingBooking) return;
    
    setIsSubmitting(true);
    try {
      const bookingsRef = collection(firestore, 'customers', firebaseUser.uid, 'bookings');
      
      const newBooking = {
        customerId: firebaseUser.uid,
        bookingDate: pendingBooking.date,
        mealType: 'N/A',
        type: 'maid',
        service: pendingBooking.service || 'Maid - A-La-Carte',
        status: 'pending',
        items: pendingBooking.chores ? pendingBooking.chores.map((c: string) => ({ dishName: c, numberOfPortions: 1 })) : [],
        totalCost: parseInt(String(pendingBooking.price).replace(/[^0-9]/g, ''), 10) || 0,
        address: pendingBooking.address,
        phone: pendingBooking.phone,
        time: pendingBooking.timeslot,
        createdAt: serverTimestamp(),
      };

      await addDocumentNonBlocking(bookingsRef, newBooking);

      if (paymentMethod === 'wallet') {
          deductFromWallet(newBooking.totalCost);
      }

      localStorage.removeItem('bookeato_pending_maid_booking');
      setIsSuccess(true);
    } catch (error) {
       console.error("Failed to book maid", error);
       alert("Failed to confirm booking. Please try again.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleUpdateAddress = () => {
    setPendingBooking(prev => {
        const updated = { ...prev, address: newAddress };
        localStorage.setItem('bookeato_pending_maid_booking', JSON.stringify(updated));
        return updated;
    });
    setIsEditingAddress(false);
  };

  const cancelBooking = () => {
    // Clear out the cart and instantly hide the component
    localStorage.removeItem('bookeato_pending_maid_booking');
    setPendingBooking(null);
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8 bg-green-50 rounded-2xl border border-green-200 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in zoom-in duration-300">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4 drop-shadow-sm" />
        <h2 className="text-2xl sm:text-3xl font-black text-green-900 tracking-tight">Booking Confirmed!</h2>
        <p className="text-green-700 mt-2 font-medium text-lg max-w-lg">
          Your maid has been successfully scheduled. We will send you arriving details via WhatsApp shortly.
        </p>
        <button onClick={() => setIsSuccess(false)} className="mt-8 px-6 py-2 bg-green-100/50 hover:bg-green-100 border border-green-200 rounded-full font-bold text-green-700 transition-colors">
          Dismiss
        </button>
      </div>
    );
  }

  // Format date gracefully
  const formattedDate = pendingBooking.date 
    ? new Date(pendingBooking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Selected Date';

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 bg-white rounded-[2rem] shadow-lg shadow-stone-200/50 border-t-4 border-t-orange-500 border-x border-b border-stone-100 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-stretch justify-between gap-8 md:gap-12">
          
          {/* Left Side: Summary */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              You have a pending booking! Complete payment to confirm.
            </h2>
            
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 space-y-3 mt-6 text-sm flex-1">
              <div className="flex justify-between items-start py-1">
                <span className="text-stone-500 font-medium whitespace-nowrap">Service:</span>
                <span className="text-stone-900 font-bold ml-4 text-right">{pendingBooking.service || 'Maid (A-La-Carte)'}</span>
              </div>
              <div className="flex justify-between items-start py-1">
                <span className="text-stone-500 font-medium whitespace-nowrap">Date & Time:</span>
                <span className="text-stone-900 font-bold ml-4 text-right flex flex-col items-end">
                   <span>{formattedDate}</span>
                   <span className="text-stone-500 text-xs mt-0.5">{pendingBooking.timeslot}</span>
                </span>
              </div>
              <div className="flex justify-between items-start py-1 group/addr relative">
                <span className="text-stone-500 font-medium whitespace-nowrap">Location:</span>
                <div className="flex flex-col items-end gap-1 flex-1">
                   {isEditingAddress ? (
                      <div className="flex items-center gap-2 w-full max-w-[200px]">
                         <input 
                            value={newAddress} 
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="text-xs font-bold text-stone-900 border border-stone-300 rounded px-2 py-1 flex-1 focus:outline-orange-500"
                         />
                         <button onClick={handleUpdateAddress} className="text-orange-600 font-black text-[10px] uppercase">Save</button>
                      </div>
                   ) : (
                      <span className="text-stone-900 font-bold ml-4 text-right flex items-center gap-2">
                        <span className="truncate max-w-[150px]">{pendingBooking.address || 'Address on file'}</span>
                        <button onClick={() => setIsEditingAddress(true)} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
                           <Pencil className="w-3 h-3 text-stone-400 group-hover/addr:text-orange-500" />
                        </button>
                      </span>
                   )}
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-stone-200">
                <div className="flex justify-between items-center text-base">
                  <span className="text-stone-900 font-bold">Total Payable:</span>
                  <span className="text-orange-600 font-black text-2xl">{pendingBooking.price || '₹0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Engine */}
          <div className="flex-1 md:max-w-[320px] w-full flex flex-col min-h-full">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5 flex-1 flex flex-col shadow-sm">
              
              <h3 className="font-bold text-stone-800 text-sm tracking-wide uppercase">Select Payment Method</h3>
              
              <div className="space-y-3">
                {/* Wallet Option */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${userWalletBalance < (parseInt(String(pendingBooking.price).replace(/[^0-9]/g, ''), 10) || 0) ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'} ${paymentMethod === 'wallet' ? 'border-orange-500 bg-orange-50/30' : 'border-stone-100 bg-stone-50 hover:border-stone-200'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    className="mt-1" 
                    disabled={userWalletBalance < (parseInt(String(pendingBooking.price).replace(/[^0-9]/g, ''), 10) || 0)} 
                    checked={paymentMethod === 'wallet'} 
                    onChange={() => setPaymentMethod('wallet')} 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-stone-500" />
                      <span className="font-bold text-stone-800 flex-1">Bookeato Wallet</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                       <p className="text-xs font-bold text-stone-400">Bal: ₹{userWalletBalance}</p>
                       {userWalletBalance === 0 && (
                        <span className="text-xs text-orange-600 font-bold">Recharge to use</span>
                       )}
                    </div>
                  </div>
                </label>

                {/* UPI / Card Option */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-orange-500 bg-orange-50/50 shadow-sm' : 'border-stone-100 hover:border-stone-200'}`}>
                  <input type="radio" name="payment" className="mt-1 accent-orange-500" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-stone-600" />
                      <span className="font-bold text-stone-800">Pay via UPI / Card</span>
                    </div>
                    <p className="text-xs font-medium text-stone-500 mt-1">Instant online payment gateway.</p>
                  </div>
                </label>
              </div>

              <p className="text-xs text-stone-400 leading-snug mt-auto pt-6">
                <span className="font-bold uppercase tracking-wider text-[10px] mr-1">Note:</span> 
                Any extra time requested beyond the booked slot will be billed post-service.
              </p>

            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button 
                onClick={handlePaymentSuccess}
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] sm:text-lg flex justify-center items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                Pay {pendingBooking.price || '₹0'} & Confirm
              </button>
              <button 
                onClick={cancelBooking}
                className="text-stone-400 hover:text-stone-600 text-xs uppercase tracking-widest font-bold py-2 transition-colors flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100"
              >
                <XCircle className="w-3.5 h-3.5" strokeWidth={3} /> Cancel this booking
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
