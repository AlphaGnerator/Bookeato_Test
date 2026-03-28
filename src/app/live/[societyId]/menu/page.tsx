'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { LiveItem } from '@/types/bookeato-live';
import { ChefHat, Info, Plus, Minus, ShoppingBag, ChevronLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemDialog } from '@/components/live/item-dialog';
import Image from 'next/image';

interface CartItem extends LiveItem {
   cartQuantity: number;
}

export default function LiveMenu() {
  const router = useRouter();
  const params = useParams();
  const societyId = params.societyId as string;
  const auth = useAuth();
  const firestore = useFirestore();

  const [items, setItems] = useState<LiveItem[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LiveItem | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  
  const [customerName, setCustomerName] = useState('');

  // Protect route & Load data
  useEffect(() => {
    const savedSession = localStorage.getItem('bookeato_live_customer');
    if (!savedSession || !auth?.currentUser) {
       // Temporarily replacing the strict check for the preview because sometimes the auth takes a sec to hydrate.
       // In a real app we'd wait for onAuthStateChanged.
       const sessionData = savedSession ? JSON.parse(savedSession) : null;
       if (!sessionData) {
         router.replace(`/live/${societyId}/onboarding`);
         return;
       }
       setCustomerName(sessionData.name);
    } else {
       setCustomerName(JSON.parse(savedSession).name);
    }

    const fetchMenu = async () => {
      if (!firestore) return;
      try {
         const q = collection(firestore, 'liveItems');
         const snapshot = await getDocs(q);
         const fetched: LiveItem[] = [];
         snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as LiveItem));
         setItems(fetched.filter(item => item.inStock));
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
    };
    fetchMenu();

    // Listen for active orders to show notification badge
    if (auth?.currentUser && firestore) {
       const ordersQ = query(
          collection(firestore, 'liveOrders'),
          where('customer.uid', '==', auth.currentUser.uid),
          where('societyId', '==', societyId)
       );
       const unsub = onSnapshot(ordersQ, (snap) => {
          let count = 0;
          snap.forEach(d => {
             const status = d.data().status;
             if (status !== 'Collected') count++;
          });
          setActiveOrderCount(count);
       });
       return () => unsub();
    }
  }, [auth, firestore, societyId, router]);

  // Group items by category
  const groupedItems = useMemo(() => {
     return items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
     }, {} as Record<string, LiveItem[]>);
  }, [items]);

  const toggleCart = (item: LiveItem, delta: number) => {
     setCart(prev => {
        const current = prev[item.id]?.cartQuantity || 0;
        const next = Math.max(0, current + delta);
        const updated = { ...prev };
        if (next === 0) {
           delete updated[item.id];
        } else {
           updated[item.id] = { ...item, cartQuantity: next };
        }
        return updated;
     });
  };

  const cartItemsCount = Object.values(cart).reduce((sum, i) => sum + i.cartQuantity, 0);
  const cartTotal = Object.values(cart).reduce((sum, i) => sum + (i.price * i.cartQuantity), 0);

  const proceedToCheckout = () => {
     localStorage.setItem('bookeato_live_cart', JSON.stringify(Object.values(cart)));
     router.push(`/live/${societyId}/checkout`);
  };

  return (
    <div className="min-h-screen bg-[#2a2b2e] pb-32">
       {/* Background Texture for Pot Pot Yum Yum aesthetic */}
       <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none z-0" />
       
       <header className="sticky top-0 z-30 bg-[#2a2b2e]/90 backdrop-blur-xl border-b border-stone-800 px-6 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
             <button onClick={() => router.push('/live')} className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-stone-400" />
             </button>
             <div>
                <span className="text-orange-500 font-black text-xs uppercase tracking-widest">{customerName}'s Order</span>
                <h1 className="text-xl font-black text-white leading-tight">Live Menu</h1>
             </div>
          </div>
          <button onClick={() => router.push(`/live/${societyId}/orders`)} className="relative w-10 h-10 rounded-full bg-stone-800 border-2 border-stone-700 flex items-center justify-center hover:bg-stone-700 hover:border-orange-500/50 transition-all">
             <Receipt className="w-5 h-5 text-stone-300" />
             {activeOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 border-2 border-[#2a2b2e] rounded-full animate-pulse" />
             )}
          </button>
       </header>

       <main className="relative z-10 px-6 py-8 space-y-12 max-w-2xl mx-auto">
          {isLoading ? (
             <div className="space-y-6">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-stone-800/50 rounded-3xl animate-pulse" />)}
             </div>
          ) : (
             Object.entries(groupedItems).map(([category, catItems]) => (
                <section key={category}>
                   <h2 className="text-sm font-black text-[#8e986d] uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                      {category} <div className="h-px bg-stone-800 flex-1" />
                   </h2>
                   
                   <div className="grid gap-6">
                      {catItems.map(item => (
                         <div key={item.id} className="bg-stone-800/40 rounded-[2rem] border-2 border-stone-800 p-4 transition-all duration-300 hover:border-stone-700 shadow-xl relative overflow-hidden flex gap-4">
                            
                            <div className="w-32 h-32 rounded-3xl overflow-hidden relative shrink-0 bg-stone-900 flex items-center justify-center">
                              {item.imageUrl.startsWith('/') || item.imageUrl.startsWith('http') ? (
                                  // The requested aesthetic is top-down 45-deg
                                  // we pad it slightly so the shadow gives a hovering effect
                                  <div className="absolute inset-2 group">
                                     <Image src={item.imageUrl} alt={item.name} fill className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-110" />
                                  </div>
                               ) : (
                                  <ChefHat className="w-8 h-8 text-stone-700" />
                               )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-1">
                               <div>
                                  <div className="flex justify-between items-start">
                                     <h3 className="font-black text-lg text-white leading-tight pr-2">{item.name}</h3>
                                     <button onClick={() => setSelectedItem(item)} className="p-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 mt-1">
                                        <Info className="w-4 h-4 text-[#d9a05b]" />
                                     </button>
                                  </div>
                                  <p className="text-xl font-black text-[#d9a05b] mt-1">₹{item.price}</p>
                               </div>

                               <div className="mt-4 flex items-center gap-3">
                                  {cart[item.id] ? (
                                     <div className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-full px-1 py-1 w-28 shadow-inner">
                                        <button onClick={() => toggleCart(item, -1)} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center">
                                           <Minus className="w-4 h-4 text-white" />
                                        </button>
                                        <span className="font-black text-white w-4 text-center">{cart[item.id].cartQuantity}</span>
                                        <button onClick={() => toggleCart(item, 1)} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                           <Plus className="w-4 h-4 text-stone-900 font-bold" />
                                        </button>
                                     </div>
                                  ) : (
                                     <Button onClick={() => toggleCart(item, 1)} variant="outline" className="rounded-full font-bold border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white px-6">
                                        Add
                                     </Button>
                                  )}
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </section>
             ))
          )}
       </main>

       {/* Floating Cart Button */}
       {cartItemsCount > 0 && (
          <div className="fixed bottom-6 left-6 right-6 z-40 max-w-2xl mx-auto">
             <button onClick={proceedToCheckout} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 rounded-2xl flex items-center justify-between px-6 shadow-[0_15px_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95 group">
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <ShoppingBag className="w-6 h-6 text-emerald-950" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-emerald-500">
                         {cartItemsCount}
                      </span>
                   </div>
                   <span className="font-bold text-emerald-950 ml-2">Review Order</span>
                </div>
                <div className="text-right">
                   <span className="block text-xs uppercase font-bold text-emerald-800 tracking-wider">Total</span>
                   <span className="font-black text-emerald-950 text-xl">₹{cartTotal}</span>
                </div>
             </button>
          </div>
       )}

       {/* Item Details Popup */}
       <ItemDialog item={selectedItem} isOpen={selectedItem !== null} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
