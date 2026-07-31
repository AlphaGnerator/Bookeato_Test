import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LiveItem } from '@/types/bookeato-live';
import { Flame, Info, Leaf, Activity, X } from 'lucide-react';
import Image from 'next/image';

interface ItemDialogProps {
  item: LiveItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDialog({ item, isOpen, onClose }: ItemDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#2a2b2e] border-stone-700 text-stone-100 rounded-[2rem] gap-0">
         <div className="relative h-64 w-full bg-stone-900 shadow-inner">
            <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-900/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-stone-800 transition-colors">
               <X className="w-4 h-4 text-white" />
            </button>
            {item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? (
               <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            ) : (
               <div className="flex items-center justify-center h-full opacity-50">Image Preview</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2b2e] via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-6 right-6 z-10">
               <div className="flex gap-2 mb-2">
                  {item.isVeg && <Badge className="bg-green-600 border-none px-2 py-0 h-6"><Leaf className="w-3 h-3 mr-1" /> Veg</Badge>}
                  {item.isSpicy && <Badge variant="destructive" className="border-none px-2 py-0 h-6"><Flame className="w-3 h-3 mr-1" /> Spicy</Badge>}
               </div>
               <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">{item.name}</h2>
            </div>
         </div>

         <div className="p-6 space-y-6">
            <div className="space-y-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-[#d9a05b] flex items-center gap-1">
                  <Info className="w-4 h-4" /> The Story
               </h3>
               <p className="text-stone-300 text-sm leading-relaxed font-medium">
                  {item.brandStory}
               </p>
            </div>

            <div className="space-y-3">
               <h3 className="text-xs font-black uppercase tracking-widest text-[#8e986d]">Key Ingredients</h3>
               <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, idx) => (
                     <span key={idx} className="bg-stone-800/80 border border-stone-700 text-stone-300 px-3 py-1.5 rounded-lg text-xs font-bold">
                        {ing}
                     </span>
                  ))}
               </div>
            </div>

            <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
               <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> Nutritional Profile
               </h3>
               <div className="flex gap-4">
                  <div className="text-center">
                     <p className="text-lg font-black text-white">{item.nutritionalProfile.calories}</p>
                     <p className="text-[9px] uppercase font-bold text-stone-500">KCAL</p>
                  </div>
                  <div className="text-center">
                     <p className="text-lg font-black text-white">{item.nutritionalProfile.protein}g</p>
                     <p className="text-[9px] uppercase font-bold text-stone-500">PROT</p>
                  </div>
                  <div className="text-center">
                     <p className="text-lg font-black text-white">{item.nutritionalProfile.carbs}g</p>
                     <p className="text-[9px] uppercase font-bold text-stone-500">CARBS</p>
                  </div>
               </div>
            </div>
         </div>
      </DialogContent>
    </Dialog>
  );
}
