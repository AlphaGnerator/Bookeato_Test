'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, ChefHat, ArrowRight, ChevronLeft, Search, Star, Sparkles, Plus, Minus, Flame, Info } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { LiveSociety, LiveItem } from '@/types/bookeato-live';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ItemDialog } from '@/components/live/item-dialog';
import { BulkCateringRequest } from '@/components/live/bulk-catering-request';

const DEFAULT_INDORI_POHA: LiveItem = {
  id: "indori-poha-live-landing",
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

const DEFAULT_HYDERABAD_SOCIETIES: LiveSociety[] = [
  {
    id: "my-home-vihanga",
    name: "My Home Vihanga",
    locationDetails: "Nanakramguda, Financial District, Hyderabad",
    isActive: true
  },
  {
    id: "prestige-high-fields",
    name: "Prestige High Fields",
    locationDetails: "ISB Road, Nanakramguda, Hyderabad",
    isActive: true
  },
  {
    id: "sumadhura-acropolis",
    name: "Sumadhura Acropolis",
    locationDetails: "Nanakramguda, Financial District, Hyderabad",
    isActive: true
  },
  {
    id: "jayabheri-silicon-county",
    name: "Jayabheri Silicon County",
    locationDetails: "Nanakramguda, Hyderabad",
    isActive: true
  },
  {
    id: "rajapushpa-atria",
    name: "Rajapushpa Atria",
    locationDetails: "Golden Mile Road, Nanakramguda, Hyderabad",
    isActive: true
  },
  {
    id: "incor-one-city",
    name: "Incor One City",
    locationDetails: "Nanakramguda Financial District, Hyderabad",
    isActive: true
  }
];

export default function BookeatoLiveLanding() {
  const router = useRouter();
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [todaysDish, setTodaysDish] = useState<LiveItem>(DEFAULT_INDORI_POHA);
  const [quantity, setQuantity] = useState(1);
  const [selectedItem, setSelectedItem] = useState<LiveItem | null>(null);
  
  const firestore = useFirestore();

  useEffect(() => {
     const fetchData = async () => {
        if (!firestore) return;
        try {
           // Fetch societies
           const qSocieties = query(collection(firestore, 'liveSocieties'), where('isActive', '==', true));
           const snapSocieties = await getDocs(qSocieties);
           const fetchedSocieties: LiveSociety[] = [];
           snapSocieties.forEach(docSnap => fetchedSocieties.push({ id: docSnap.id, ...docSnap.data() } as LiveSociety));
           
           // Ensure Nanakramguda Hyderabad societies are present
           const existingNames = new Set(fetchedSocieties.map(s => s.name.toLowerCase()));
           const merged = [...fetchedSocieties];

           for (const defaultSoc of DEFAULT_HYDERABAD_SOCIETIES) {
              if (!existingNames.has(defaultSoc.name.toLowerCase())) {
                 merged.push(defaultSoc);
                 // Auto-add to Firestore in background for persistence
                 addDoc(collection(firestore, 'liveSocieties'), {
                    name: defaultSoc.name,
                    locationDetails: defaultSoc.locationDetails,
                    isActive: true
                 }).catch(() => {});
              }
           }

           setSocieties(merged);

           // Fetch Today's Dish
           const qItems = collection(firestore, 'liveItems');
           const snapItems = await getDocs(qItems);
           const fetchedItems: LiveItem[] = [];
           snapItems.forEach(docSnap => {
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
              fetchedItems.push({ id: docSnap.id, ...data });
           });
           
           const featured = fetchedItems.find(item => item.isTodaysDish && item.inStock);
           const poha = fetchedItems.find(item => item.name.toLowerCase().includes('poha') && item.inStock);
           
           let selected = featured || poha || DEFAULT_INDORI_POHA;
           if (selected.name.toLowerCase().includes('poha')) {
              selected = {
                 ...selected,
                 price: 100,
                 brandStory: selected.brandStory?.includes('cold press oil') 
                    ? selected.brandStory 
                    : "The beloved breakfast jewel of Indore, elevated. Made by cold press oil with organic hand-pounded rice and authentic Jeeravan masala. Sweet ruby pomegranate seeds burst with freshness to counter the crunchy sev, leaving you satiated yet incredibly light."
              };
           }
           setTodaysDish(selected);
        } catch (e) {
           console.error("Failed to fetch live landing data", e);
        } finally {
           setIsLoading(false);
        }
     };
     fetchData();
  }, [firestore]);

  const filteredSocieties = useMemo(() => {
      if (!searchQuery) return societies;
      const lowerQ = searchQuery.toLowerCase();
      return societies.filter(soc => soc.name.toLowerCase().includes(lowerQ) || soc.locationDetails.toLowerCase().includes(lowerQ));
  }, [societies, searchQuery]);

  const handlePlaceOrder = (targetSocietyId?: string) => {
     const chosenSocietyId = targetSocietyId || (societies.length > 0 ? societies[0].id : 'my-home-vihanga');
     
     // Save item with selected quantity to cart
     const cartItem = { ...todaysDish, cartQuantity: quantity };
     localStorage.setItem('bookeato_live_cart', JSON.stringify([cartItem]));
     
     // Check if customer session exists
     const existingSession = localStorage.getItem('bookeato_live_customer');
     if (!existingSession) {
        router.push(`/live/${chosenSocietyId}/onboarding`);
        return;
     }

     router.push(`/live/${chosenSocietyId}/checkout`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#2a2b2e]">
      <header className="px-6 py-4 md:px-12 md:py-6 flex justify-between items-center bg-stone-900 border-b border-stone-800 sticky top-0 z-30">
         <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors mr-2">
               <ChevronLeft className="w-5 h-5 text-stone-400" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
               <ChefHat className="w-5 h-5 text-stone-900" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
               bookeato <span className="text-orange-500 font-['Caveat'] text-3xl font-normal relative top-1">Live</span>
            </h1>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 md:py-12 relative overflow-hidden">
         {/* Subtle chalkboard texture simulation */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none" />
         
         <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
            {/* Header Section */}
            <div>
               <h2 className="text-4xl md:text-5xl font-black text-stone-100 mb-3 drop-shadow-md">
                  Good Food, <span className="text-orange-400">Right Now.</span>
               </h2>
               <p className="text-base md:text-lg text-stone-300 font-medium max-w-xl mx-auto">
                  Select your quantity and order today's fresh pop-up dish directly, or choose your society below.
               </p>
            </div>

            {/* ⭐ TODAY'S DISH CARD - PROMINENTLY BELOW GOOD FOOD RIGHT NOW ⭐ */}
            <div className="text-left bg-gradient-to-br from-stone-900 via-stone-800/95 to-stone-900 rounded-[2.5rem] border-2 border-amber-500/70 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-amber-400 group">
               {/* Ambient Glow background */}
               <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
               <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <span className="bg-amber-500 text-stone-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/30 uppercase tracking-wider">
                        <Star className="w-3.5 h-3.5 fill-stone-950" /> Today's Special Dish
                     </span>
                     <span className="text-[10px] font-bold uppercase bg-stone-800 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                        Fresh Batch Hot
                     </span>
                  </div>
                  <button 
                     onClick={() => setSelectedItem(todaysDish)} 
                     className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 transition-colors"
                     title="View Full Story & Nutrition"
                  >
                     <Info className="w-4 h-4 text-[#d9a05b]" />
                  </button>
               </div>

               <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Dish Image */}
                  <div className="w-44 h-44 rounded-3xl overflow-hidden relative shrink-0 bg-stone-950/90 border border-amber-500/30 p-2 shadow-2xl flex items-center justify-center">
                     {todaysDish.imageUrl.startsWith('/') || todaysDish.imageUrl.startsWith('http') ? (
                        <Image 
                           src={todaysDish.imageUrl} 
                           alt={todaysDish.name} 
                           fill 
                           className="object-contain p-2 drop-shadow-[0_20px_25px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:scale-105" 
                        />
                     ) : (
                        <ChefHat className="w-14 h-14 text-amber-400" />
                     )}
                  </div>

                  {/* Dish Info & Order Actions */}
                  <div className="flex-1 space-y-3 w-full">
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-2xl md:text-3xl font-black text-white leading-tight flex items-center gap-2">
                              {todaysDish.name}
                              {todaysDish.isSpicy && <Flame className="w-5 h-5 text-red-500 shrink-0" />}
                           </h3>
                           <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mt-1">
                              {todaysDish.category}
                           </p>
                        </div>
                        <div className="text-right shrink-0">
                           <span className="text-[10px] uppercase font-bold text-stone-400 block">Price</span>
                           <span className="text-3xl font-black text-amber-400">₹{todaysDish.price}</span>
                        </div>
                     </div>

                     <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-medium">
                        {todaysDish.brandStory}
                     </p>

                     {/* Ingredients Badges */}
                     <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {todaysDish.ingredients.map((ing, i) => (
                           <span key={i} className="text-[10px] font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-md">
                              {ing}
                           </span>
                        ))}
                     </div>

                     {/* Quantity Selector & Order Buttons */}
                     <div className="pt-3 border-t border-stone-800/90 flex flex-wrap items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold uppercase text-stone-400">Quantity:</span>
                           <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 rounded-full p-1 shadow-inner">
                              <button 
                                 onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                                 disabled={quantity <= 1}
                                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${quantity <= 1 ? 'bg-stone-900 text-stone-600' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}
                              >
                                 <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-white w-6 text-center text-base">{quantity}</span>
                              <button 
                                 onClick={() => setQuantity(quantity + 1)} 
                                 className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 font-bold transition-transform active:scale-95"
                              >
                                 <Plus className="w-4 h-4 font-black" />
                              </button>
                           </div>
                        </div>

                        <Button 
                           onClick={() => handlePlaceOrder()}
                           className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl px-6 py-3 h-12 text-base shadow-[0_10px_25px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all active:scale-95"
                        >
                           Order Now (₹{todaysDish.price * quantity}) <ArrowRight className="w-5 h-5 ml-1" />
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Bulk & Party Catering Request Section */}
            <BulkCateringRequest />

            {/* Active Pop-up Locations Section */}
            <div className="space-y-6 text-left pt-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                  <Input 
                     placeholder="Search for your society or location..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="bg-stone-800 border-stone-700 text-white pl-12 h-14 rounded-2xl text-lg focus-visible:ring-orange-500 placeholder:text-stone-500"
                  />
               </div>

               <div className="space-y-4">
                  <span className="text-xs font-black uppercase tracking-widest text-stone-500 ml-4">Active Pop-up Locations</span>
                  
                  {isLoading ? (
                     <div className="p-6 bg-stone-800/80 rounded-[2rem] border-2 border-stone-700 h-28 animate-pulse text-center pt-10 text-stone-500 font-bold">
                        Loading locations...
                     </div>
                  ) : filteredSocieties.length === 0 ? (
                     <div className="p-6 text-center text-stone-400 font-medium mt-4 bg-stone-800/50 rounded-2xl border border-stone-700">
                        No active pop-ups found matching your search.
                     </div>
                  ) : filteredSocieties.map(society => (
                     <div 
                        key={society.id} 
                        className="p-6 bg-stone-800/80 backdrop-blur-md rounded-[2rem] border-2 border-stone-700 hover:border-orange-500 hover:bg-stone-800 transition-all duration-300 group flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                     >
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-stone-900 rounded-xl group-hover:bg-orange-500/10 transition-colors shrink-0">
                              <MapPin className="w-6 h-6 text-orange-400" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-500 transition-colors">{society.name}</h3>
                              <p className="text-sm font-medium text-stone-400">{society.locationDetails}</p>
                           </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                           <Button 
                              onClick={() => handlePlaceOrder(society.id)} 
                              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl px-4 py-2 flex-1 md:flex-initial"
                           >
                              Order Poha Here
                           </Button>
                           <Link 
                              href={`/live/${society.id}/menu`}
                              className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-sm flex items-center justify-center gap-2 flex-1 md:flex-initial transition-colors"
                           >
                              Full Menu <ArrowRight className="w-4 h-4" />
                           </Link>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         
         {/* Decorative ambient background spots */}
         <div className="absolute top-[20%] -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute bottom-[10%] -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

         {/* Item Details Popup */}
         <ItemDialog item={selectedItem} isOpen={selectedItem !== null} onClose={() => setSelectedItem(null)} />
      </main>
    </div>
  );
}

