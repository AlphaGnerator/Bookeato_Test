'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { collection, getDocs, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { LiveItem } from '@/types/bookeato-live';
import { ChefHat, Info, Plus, Minus, ShoppingBag, ChevronLeft, Receipt, Star, Sparkles, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemDialog } from '@/components/live/item-dialog';
import { BulkCateringRequest } from '@/components/live/bulk-catering-request';
import Image from 'next/image';

interface CartItem extends LiveItem {
   cartQuantity: number;
}

const FALLBACK_TODAYS_DISH: LiveItem = {
  id: "indori-poha-default",
  name: "(V) Indori Poha",
  price: 100,
  imageUrl: "/live_menu/indori_poha.png",
  category: "Healthy Signatures",
  inStock: true,
  isSpicy: false,
  isVeg: true,
  isTodaysDish: true,
  ingredients: ["Flattened Rice", "Jeeravan Masala", "Cold-Pressed Oil", "Pomegranate", "Yellow Sev", "Lemon"],
  nutritionalProfile: { calories: 210, protein: 3, carbs: 45, fat: 2 },
  brandStory: "The beloved breakfast jewel of Indore, elevated. Made by cold press oil with organic hand-pounded rice and authentic Jeeravan masala. Sweet ruby pomegranate seeds burst with freshness to counter the crunchy sev, leaving you satiated yet incredibly light.",
  societyId: "global"
};

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
         snapshot.forEach(docSnap => {
            const data = docSnap.data() as LiveItem;
            if (data.name.toLowerCase().includes('poha')) {
               data.price = 100;
               if (!data.brandStory?.includes('cold press oil')) {
                  data.brandStory = "The beloved breakfast jewel of Indore, elevated. Made by cold press oil with organic hand-pounded rice and authentic Jeeravan masala. Sweet ruby pomegranate seeds burst with freshness to counter the crunchy sev, leaving you satiated yet incredibly light.";
               }
               updateDoc(doc(firestore, 'liveItems', docSnap.id), { 
                  price: 100, 
                  brandStory: data.brandStory 
               }).catch(() => {});
            }
            fetched.push({ id: docSnap.id, ...data });
         });
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

  // Featured Today's Dish
  const todaysDishes = useMemo(() => {
     const featured = items.filter(i => i.isTodaysDish);
     if (featured.length > 0) return featured;
     const poha = items.find(i => i.name.toLowerCase().includes('poha')) || FALLBACK_TODAYS_DISH;
     return [poha];
  }, [items]);

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

  const directOrderDish = (item: LiveItem) => {
     if (!cart[item.id]) {
        toggleCart(item, 1);
        const updatedCart = [{ ...item, cartQuantity: 1 }];
        localStorage.setItem('bookeato_live_cart', JSON.stringify(updatedCart));
     } else {
        localStorage.setItem('bookeato_live_cart', JSON.stringify(Object.values(cart)));
     }
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

       <main className="relative z-10 px-6 py-8 space-y-10 max-w-2xl mx-auto">
          {/* Today's Special Dish Section */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-amber-400 uppercase tracking-[0.25em] flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" /> TODAY'S SPECIAL DISH
                </h2>
                <span className="text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                   Fresh Pop-up Batch
                </span>
             </div>

             {todaysDishes.map((dish) => {
                const currentQty = cart[dish.id]?.cartQuantity || 0;
                return (
                   <div 
                      key={dish.id} 
                      className="bg-gradient-to-br from-stone-900 via-stone-800/90 to-stone-900 rounded-[2.5rem] border-2 border-amber-500/60 p-6 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-amber-400"
                   >
                      {/* Ambient Glow */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                         <div className="w-40 h-40 rounded-3xl overflow-hidden relative shrink-0 bg-stone-950/80 border border-amber-500/20 p-2 shadow-2xl flex items-center justify-center group">
                            {dish.imageUrl.startsWith('/') || dish.imageUrl.startsWith('http') ? (
                               <Image 
                                  src={dish.imageUrl} 
                                  alt={dish.name} 
                                  fill 
                                  className="object-contain p-2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-110" 
                               />
                            ) : (
                               <ChefHat className="w-12 h-12 text-amber-400" />
                            )}
                            <div className="absolute top-2 left-2 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                               <Star className="w-3 h-3 fill-stone-950" /> TODAY'S DISH
                            </div>
                         </div>

                         <div className="flex-1 space-y-3 text-left">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h3 className="text-2xl font-black text-white leading-tight flex items-center gap-2">
                                     {dish.name}
                                     {dish.isSpicy && <Flame className="w-4 h-4 text-red-500 shrink-0" />}
                                  </h3>
                                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mt-0.5">
                                     {dish.category}
                                  </p>
                               </div>
                               <button 
                                  onClick={() => setSelectedItem(dish)} 
                                  className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-amber-400 border border-stone-700 transition-colors"
                                  title="View Recipe Story & Nutrition"
                               >
                                  <Info className="w-4 h-4 text-[#d9a05b]" />
                               </button>
                            </div>

                            <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-medium">
                               {dish.brandStory}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                               {dish.ingredients.slice(0, 4).map((ing, i) => (
                                  <span key={i} className="text-[10px] font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-md">
                                     {ing}
                                  </span>
                               ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-2">
                               <div>
                                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Price</span>
                                  <span className="text-2xl font-black text-amber-400">₹{dish.price}</span>
                               </div>

                               {/* Quantity Selector & Order Buttons */}
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 rounded-full p-1 shadow-inner">
                                     <button 
                                        onClick={() => toggleCart(dish, -1)} 
                                        disabled={currentQty === 0}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentQty === 0 ? 'bg-stone-900 text-stone-600' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}
                                     >
                                        <Minus className="w-4 h-4" />
                                     </button>
                                     <span className="font-black text-white w-6 text-center text-sm">{currentQty}</span>
                                     <button 
                                        onClick={() => toggleCart(dish, 1)} 
                                        className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 font-bold transition-transform active:scale-95"
                                     >
                                        <Plus className="w-4 h-4 font-black" />
                                     </button>
                                  </div>

                                  <Button 
                                     onClick={() => directOrderDish(dish)}
                                     className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-full px-5 py-2 h-10 shadow-lg shadow-emerald-500/20 flex items-center gap-1 transition-all active:scale-95"
                                  >
                                     Place Order <ArrowRight className="w-4 h-4 ml-1" />
                                  </Button>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                );
             })}
           </section>

           {/* Bulk & Party Catering Request Section */}
           <BulkCateringRequest defaultLocation={`Society ${societyId}`} />

           {/* Full Menu Categories */}
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
                                  <div className="absolute inset-2 group">
                                     <Image src={item.imageUrl} alt={item.name} fill className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-110" />
                                  </div>
                               ) : (
                                  <ChefHat className="w-8 h-8 text-stone-700" />
                               )}
                               {item.isTodaysDish && (
                                  <span className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                                     SPECIAL
                                  </span>
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
