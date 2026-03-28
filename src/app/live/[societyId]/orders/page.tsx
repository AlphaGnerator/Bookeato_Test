'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { LiveOrder } from '@/types/bookeato-live';
import { ChevronLeft, Receipt, CheckCircle2, Clock, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function MyOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const societyId = params.societyId as string;
  const auth = useAuth();
  const firestore = useFirestore();

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session fallback check if not hydrated yet by auth
    const savedSession = localStorage.getItem('bookeato_live_customer');
    if (!savedSession && !auth?.currentUser) {
       router.replace(`/live/${societyId}/onboarding`);
       return;
    }

    if (!auth?.currentUser || !firestore) return;

    // In a production environment without composite indexes, orderBy(createdAt) combined
    // with 'where' might require an index prompt in console. For zero-friction, we fetch all 
    // user orders here and sort client-side to avoid blocking the user on missing indexes.
    const q = query(
       collection(firestore, 'liveOrders'),
       where('customer.uid', '==', auth.currentUser.uid),
       where('societyId', '==', societyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
       const fetched: LiveOrder[] = [];
       snapshot.forEach(doc => {
          fetched.push({ id: doc.id, ...doc.data() } as LiveOrder);
       });
       
       // Sort newest first
       fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
       setOrders(fetched);
       setIsLoading(false);
    }, (error) => {
       console.error("Orders fetch error:", error);
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, societyId, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Queued': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Preparing': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Ready': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Collected': return 'text-stone-500 bg-stone-500/10 border-stone-500/20';
      default: return 'text-stone-500 bg-stone-500/10 border-stone-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Queued': return <Clock className="w-4 h-4 mr-1.5" />;
      case 'Preparing': return <ChefHat className="w-4 h-4 mr-1.5" />;
      case 'Ready': return <CheckCircle2 className="w-4 h-4 mr-1.5 animate-pulse" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#2a2b2e] pb-12 relative overflow-hidden">
       {/* Background Texture */}
       <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none z-0" />
       
       <header className="sticky top-0 z-30 bg-[#2a2b2e]/90 backdrop-blur-xl border-b border-stone-800 px-6 py-4 flex items-center shadow-lg gap-4">
          <button onClick={() => router.push(`/live/${societyId}/menu`)} className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
             <ChevronLeft className="w-5 h-5 text-stone-400" />
          </button>
          <div>
             <span className="text-orange-500 font-black text-xs uppercase tracking-widest">History</span>
             <h1 className="text-xl font-black text-white leading-tight">My Orders</h1>
          </div>
       </header>

       <main className="relative z-10 px-6 py-8 max-w-2xl mx-auto space-y-6">
          {isLoading ? (
             <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-stone-800/50 rounded-3xl animate-pulse" />)}
             </div>
          ) : orders.length === 0 ? (
             <div className="text-center py-20 bg-stone-800/20 rounded-[2rem] border border-stone-800 backdrop-blur-sm">
                <Receipt className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white mb-2">No orders yet</h2>
                <p className="text-stone-400 mb-8 max-w-[200px] mx-auto">Hungry? Your recent orders will show up right here.</p>
                <Button onClick={() => router.push(`/live/${societyId}/menu`)} className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-stone-900 shadow-[0_10px_30px_rgba(249,115,22,0.3)]">
                   View Live Menu
                </Button>
             </div>
          ) : (
             <div className="space-y-4">
                {orders.map((order) => {
                   const isActive = order.status !== 'Collected';
                   return (
                      <div 
                        key={order.id} 
                        onClick={() => router.push(`/live/${societyId}/order/${order.id}`)}
                        className={`bg-stone-800/40 border-2 ${isActive ? 'border-stone-700 hover:border-orange-500/50' : 'border-stone-800 opacity-60'} rounded-3xl p-5 cursor-pointer transition-all hover:bg-stone-800/60 shadow-xl relative overflow-hidden`}
                      >
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                                  {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                               </span>
                               <h3 className="font-black text-white text-lg mt-0.5">Order #{order.id?.slice(-4).toUpperCase()}</h3>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full border ${getStatusColor(order.status)} flex items-center font-bold text-xs uppercase tracking-wider`}>
                               {getStatusIcon(order.status)}
                               {order.status}
                            </div>
                         </div>
                         
                         <div className="border-t border-stone-800 pt-4 mt-4 flex justify-between items-end">
                            <div className="space-y-1">
                               {order.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-stone-400 text-sm font-medium">
                                     {item.quantity}x {item.name}
                                  </div>
                               ))}
                               {order.items.length > 2 && (
                                  <div className="text-stone-500 text-xs font-bold uppercase mt-1">
                                     +{order.items.length - 2} more items
                                  </div>
                               )}
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-0.5">Total</p>
                               <p className="font-black text-xl text-white">₹{order.totalAmount}</p>
                            </div>
                         </div>
                         
                         {isActive && (
                            <div className="w-full mt-5 pt-3 border-t border-stone-800 text-center text-orange-500 font-bold text-sm flex items-center justify-center">
                               Tap to view live tracker <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                            </div>
                         )}
                      </div>
                   )
                })}
             </div>
          )}
       </main>
    </div>
  );
}
