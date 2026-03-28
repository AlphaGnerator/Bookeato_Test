'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, ChefHat, ArrowRight, ChevronLeft, Search } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LiveSociety } from '@/types/bookeato-live';
import { Input } from '@/components/ui/input';

export default function BookeatoLiveLanding() {
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
     const fetchActiveSocieties = async () => {
        if (!firestore) return;
        try {
           const q = query(collection(firestore, 'liveSocieties'), where('isActive', '==', true));
           const snap = await getDocs(q);
           const fetched: LiveSociety[] = [];
           snap.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as LiveSociety));
           setSocieties(fetched);
        } catch (e) {
           console.error("Failed to fetch societies", e);
        } finally {
           setIsLoading(false);
        }
     };
     fetchActiveSocieties();
  }, [firestore]);

  const filteredSocieties = useMemo(() => {
      if (!searchQuery) return societies;
      const lowerQ = searchQuery.toLowerCase();
      return societies.filter(soc => soc.name.toLowerCase().includes(lowerQ) || soc.locationDetails.toLowerCase().includes(lowerQ));
  }, [societies, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 md:px-12 md:py-8 flex justify-between items-center bg-stone-900 border-b border-stone-800">
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 relative overflow-hidden bg-[#2a2b2e]">
         {/* Subtle chalkboard texture simulation using background and opacities */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none" />
         
         <div className="max-w-xl w-full text-center relative z-10 min-h-[50vh]">
            <h2 className="text-4xl md:text-5xl font-black text-stone-100 mb-6 drop-shadow-md">
               Good Food, <span className="text-orange-400">Right Now.</span>
            </h2>
            <p className="text-lg text-stone-300 font-medium mb-8">
               Select your society or location below to order from our premium pop-up kitchen. No waiting. Just healthy, hot meals.
            </p>

            <div className="space-y-6 text-left">
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
                  <span className="text-xs font-black uppercase tracking-widest text-stone-500 ml-4">Active Pop-ups</span>
                  
                  {isLoading ? (
                     <div className="p-6 bg-stone-800/80 rounded-[2rem] border-2 border-stone-700 h-28 animate-pulse text-center pt-10 text-stone-500 font-bold">
                        Loading locations...
                     </div>
                  ) : filteredSocieties.length === 0 ? (
                     <div className="p-6 text-center text-stone-400 font-medium mt-4">
                        No active pop-ups found matching your search.
                     </div>
                  ) : filteredSocieties.map(society => (
                     <Link 
                        key={society.id} 
                        href={`/live/${society.id}/onboarding`}
                        className="block p-6 bg-stone-800/80 backdrop-blur-md rounded-[2rem] border-2 border-stone-700 hover:border-orange-500 hover:bg-stone-800 transition-all duration-300 group"
                     >
                        <div className="flex justify-between items-center">
                           <div className="flex items-start gap-4">
                              <div className="p-3 bg-stone-900 rounded-xl group-hover:bg-orange-500/10 transition-colors">
                                 <MapPin className="w-6 h-6 text-orange-400" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-500 transition-colors">{society.name}</h3>
                                 <p className="text-sm font-medium text-stone-400">{society.locationDetails}</p>
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center group-hover:bg-orange-500 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all">
                              <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-white" />
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </div>
         </div>
         
         {/* Decorative elements */}
         <div className="absolute top-[20%] -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute bottom-[10%] -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </main>
    </div>
  );
}
