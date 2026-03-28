'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { LiveOrder } from '@/types/bookeato-live';
import { ChevronLeft, Flame, Clock, CheckCircle2, ChevronRight, Utensils, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function LiveOrderTracker() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const firestore = useFirestore();

  const [order, setOrder] = useState<LiveOrder | null>(null);
  const audioContextReady = useRef(false);

  useEffect(() => {
    if (!firestore || !orderId) return;
    
    const unsubscribe = onSnapshot(doc(firestore, 'liveOrders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const newData = docSnap.data() as LiveOrder;
        
        // Check if just became ready
        if (order && order.status !== 'Ready' && newData.status === 'Ready') {
           playChime();
        }

        setOrder({ id: docSnap.id, ...newData });
      }
    });

    return () => unsubscribe();
  }, [firestore, orderId, order]);

  // Handle simple web audio chime for frictionless notification
  const initAudio = () => { if (!audioContextReady.current) audioContextReady.current = true; };
  
  const playChime = () => {
     if (!audioContextReady.current) return;
     try {
       const ctx = new window.AudioContext();
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.connect(gain);
       gain.connect(ctx.destination);
       
       osc.type = 'sine';
       osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
       osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
       osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
       
       gain.gain.setValueAtTime(1, ctx.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
       
       osc.start(ctx.currentTime);
       osc.stop(ctx.currentTime + 1);
     } catch (e) {
        // silent fail for browsers blocking auto audio
     }
  };

  if (!order) {
     return (
        <div className="min-h-screen bg-[#2a2b2e] flex flex-col items-center justify-center">
           <div className="w-12 h-12 border-4 border-t-orange-500 border-stone-800 rounded-full animate-spin"></div>
        </div>
     );
  }

  // Calculate progress
  const statuses = ["Queued", "Preparing", "Ready", "Collected"];
  const progressPercent = Math.max(10, ((statuses.indexOf(order.status) + 1) / 3) * 100);

  return (
    <div className="min-h-screen bg-[#2a2b2e] pb-10" onClick={initAudio}>
       <header className="pt-8 px-6 pb-6">
          <Button onClick={() => router.push(`/live/${params.societyId}/menu`)} variant="ghost" className="text-stone-400 hover:text-white px-0 hover:bg-transparent -ml-2 mb-4 h-auto">
             <ChevronLeft className="w-5 h-5 mr-1" /> Back to Menu
          </Button>
          <div className="flex justify-between items-end">
             <div>
                <span className="text-orange-500 font-black text-xs uppercase tracking-widest">{order.customer.name}'s Order</span>
                <h1 className="text-3xl font-black text-white leading-tight">#{order.id?.slice(-4).toUpperCase()}</h1>
             </div>
             
             <div className="text-right">
                <span className="text-stone-500 text-xs font-bold uppercase block mb-1">Status</span>
                {order.status === "Ready" ? (
                   <span className="bg-emerald-500 text-stone-900 font-black uppercase px-3 py-1 rounded-lg animate-pulse flex items-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      <BellRing className="w-4 h-4" /> READY
                   </span>
                ) : (
                   <span className="bg-stone-800 text-stone-300 font-bold uppercase px-3 py-1 rounded-lg border border-stone-700">
                      {order.status}
                   </span>
                )}
             </div>
          </div>
       </header>

       <main className="px-6 space-y-8 max-w-lg mx-auto">
          {/* Tracking Bar */}
          <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700 relative overflow-hidden">
             {order.status === "Ready" && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />}
             
             <div className="flex justify-between text-xs font-black uppercase text-stone-500 mb-3 px-1">
                 <span className={order.status === "Queued" ? "text-orange-500" : "text-emerald-500"}>Queue</span>
                 <span className={order.status === "Preparing" ? "text-orange-500" : (statuses.indexOf(order.status) > 1 ? "text-emerald-500" : "")}>Prep</span>
                 <span className={order.status === "Ready" ? "text-emerald-500" : ""}>Ready</span>
             </div>
             
             <Progress value={progressPercent} className="h-3 bg-stone-900 overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-emerald-500" />
             
             <div className="mt-6 flex justify-center">
                 {order.status === "Queued" && (
                    <p className="text-stone-300 font-medium text-center text-sm flex items-center gap-2">
                       <Clock className="w-4 h-4 text-stone-500" /> We've received your order. Hang tight.
                    </p>
                 )}
                 {order.status === "Preparing" && (
                    <p className="text-orange-400 font-bold text-center text-sm flex items-center gap-2 animate-pulse">
                       <Flame className="w-5 h-5" /> The chefs are plating your food.
                    </p>
                 )}
                 {order.status === "Ready" && (
                    <div className="text-center">
                       <p className="text-emerald-400 font-black text-lg flex items-center justify-center gap-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                          <CheckCircle2 className="w-6 h-6" /> Your order is ready!
                       </p>
                       <p className="text-sm font-medium text-stone-400 mt-1">Please show your order number at the counter.</p>
                    </div>
                 )}
                 {order.status === "Collected" && (
                    <p className="text-stone-500 font-medium text-center text-sm flex items-center gap-2">
                       <Utensils className="w-4 h-4" /> Order collected. Enjoy your meal!
                    </p>
                 )}
             </div>
          </div>

          <div className="bg-stone-800/50 rounded-3xl p-6 border border-stone-700/50 backdrop-blur-xl">
             <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4">Order Items</h3>
             <ul className="space-y-4">
               {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center group">
                     <div className="flex gap-3">
                        <span className="bg-stone-900 border border-stone-700 w-8 h-8 rounded-lg flex items-center justify-center font-black text-orange-500">{item.quantity}</span>
                        <div>
                           <p className="font-bold text-stone-100">{item.name}</p>
                           <p className="text-xs text-stone-500 font-medium">₹{item.price}</p>
                        </div>
                     </div>
                     <div className="text-right">
                       {item.status === 'Queued' && <span className="text-xs font-bold text-stone-500 uppercase">WAITING</span>}
                       {item.status === 'Preparing' && <span className="text-xs font-bold text-orange-500 uppercase flex items-center"><Flame className="w-3 h-3 mr-1"/> PREP</span>}
                       {item.status === 'Ready' && <span className="text-xs font-bold text-emerald-500 uppercase flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> READY</span>}
                     </div>
                  </li>
               ))}
             </ul>
             
             <div className="mt-8 pt-4 border-t border-stone-700 flex justify-between items-center">
                <span className="text-sm font-bold text-stone-400">Total Paid</span>
                <span className="font-black text-xl text-white">₹{order.totalAmount}</span>
             </div>
          </div>
       </main>
    </div>
  );
}
