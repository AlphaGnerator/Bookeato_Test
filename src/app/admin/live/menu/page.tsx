'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { LiveItem } from '@/types/bookeato-live';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Flame, RefreshCw, UploadCloud, Trash, Pencil } from 'lucide-react';
import Image from 'next/image';
import { ItemEditorDialog } from './item-editor-dialog';

const MOCK_ITEMS: Omit<LiveItem, 'id'>[] = [
  {
    name: "(V) Quinoa Golgappas",
    price: 585,
    imageUrl: "/live_menu/quinoa_golgappas.png",
    category: "The Guilt-Free Chaats",
    inStock: true,
    isSpicy: true,
    isVeg: true,
    ingredients: ["Quinoa Flour", "Cranberry Juice", "Jaljeera Water", "Sprouted Moong", "Mint"],
    nutritionalProfile: { calories: 120, protein: 4, carbs: 22, fat: 1 },
    brandStory: "A revolutionary twist on the classic pani puri. Our shells are crafted from superfood quinoa rather than refined maida, resulting in a lighter crunch. We replaced the sugar-heavy sweet water with antioxidant-rich deep cranberry juice and kept the spicy kick with pure jaljeera.",
    societyId: "global"
  },
  {
    name: "(V) Indori Poha",
    price: 485,
    imageUrl: "/live_menu/indori_poha.png",
    category: "Healthy Signatures",
    inStock: true,
    isSpicy: false,
    isVeg: true,
    ingredients: ["Flattened Rice", "Jeeravan Masala", "Pomegranate", "Yellow Sev", "Lemon"],
    nutritionalProfile: { calories: 210, protein: 3, carbs: 45, fat: 2 },
    brandStory: "The beloved breakfast jewel of Indore, elevated. We source organic hand-pounded rice and authentic Jeeravan masala. Sweet ruby pomegranate seeds burst with freshness to counter the crunchy sev, leaving you satiated yet incredibly light.",
    societyId: "global"
  },
  {
    name: "(V) Lotus Root Bhel",
    price: 585,
    imageUrl: "/live_menu/lotus_root_bhel.png",
    category: "The Guilt-Free Chaats",
    inStock: true,
    isSpicy: true,
    isVeg: true,
    ingredients: ["Crispy Lotus Root", "Lemon", "Chilli Dressing", "Puffed Rice"],
    nutritionalProfile: { calories: 180, protein: 2, carbs: 30, fat: 6 },
    brandStory: "Delicate slices of lotus root crisp to perfection, coated with a zesty lemon and chili dressing that brightens up every bite. A completely unique texture compared to standard bhel.",
    societyId: "global"
  },
  {
    name: "(V) Palak Potta Chaat",
    price: 585,
    imageUrl: "/live_menu/palak_patta_chaat.png",
    category: "The Guilt-Free Chaats",
    inStock: true,
    isSpicy: false,
    isVeg: true,
    ingredients: ["Crispy Spinach Leaves", "Chutneys", "Chaat Ka Dahi", "Pomegranate"],
    nutritionalProfile: { calories: 250, protein: 5, carbs: 25, fat: 14 },
    brandStory: "Leaves of organic baby spinach are flash-crisped in cold-pressed oil, then immediately dressed with thick, slightly sweetened yogurt and a medley of our house-made chutneys.",
    societyId: "global"
  }
];

function LiveMenuManager() {
  const [items, setItems] = useState<LiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LiveItem | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchItems = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const q = collection(firestore, 'liveItems');
      const querySnapshot = await getDocs(q);
      const fetchedItems: LiveItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as LiveItem);
      });
      setItems(fetchedItems);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to fetch items', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [firestore]);

  const toggleStock = async (item: LiveItem) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveItems', item.id);
      await updateDoc(docRef, { inStock: !item.inStock });
      setItems(items.map(i => i.id === item.id ? { ...i, inStock: !i.inStock } : i));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!firestore) return;
    if (!confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(firestore, 'liveItems', id));
      setItems(items.filter(i => i.id !== id));
      toast({ title: 'Deleted', description: 'Item removed from Live Menu.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  }

  const seedMockData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      // First wipe all old items
      const deletePromises = items.map(i => deleteDoc(doc(firestore, 'liveItems', i.id)));
      await Promise.all(deletePromises);

      // Now add new items with updated paths
      const batch = writeBatch(firestore);
      MOCK_ITEMS.forEach(mockItem => {
        const docRef = doc(collection(firestore, 'liveItems'));
        batch.set(docRef, mockItem);
      });
      await batch.commit();
      toast({ title: 'Menu Reset', description: 'Updated all items with the finalized generated art.' });
      fetchItems();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to reset data', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  const saveItem = async (itemData: Omit<LiveItem, 'id'>) => {
    if (!firestore) return;
    try {
      if (editingItem) {
         const docRef = doc(firestore, 'liveItems', editingItem.id);
         await updateDoc(docRef, itemData);
         setItems(items.map(i => i.id === editingItem.id ? { id: editingItem.id, ...itemData } : i));
         toast({ title: 'Updated', description: 'Item updated successfully.' });
      } else {
         const res = await addDoc(collection(firestore, 'liveItems'), itemData);
         setItems([...items, { id: res.id, ...itemData }]);
         toast({ title: 'Added', description: 'New item added successfully.' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });
      throw e; // rethrow to keep dialog open if needed, or dialog handles it
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-stone-900 text-white rounded-[2rem] p-8 -mt-2">
        <div>
           <h1 className="text-3xl font-black">Live Menu Master</h1>
           <p className="text-stone-400 mt-2 font-medium">Control the stalls, edit items, and manage 86'd inventory instantly.</p>
        </div>
        <div className="flex gap-4">
             <Button onClick={seedMockData} disabled={isSeeding} variant="secondary" className="rounded-xl font-bold bg-white text-stone-900 border-2 border-transparent shadow-lg shadow-white/20">
               <UploadCloud className="w-4 h-4 mr-2" /> {isSeeding ? 'Updating...' : 'Reset Demo Menu'}
             </Button>
           <Button onClick={fetchItems} variant="outline" className="rounded-xl font-bold border-stone-700 hover:bg-stone-800 text-white bg-transparent">
             <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
           </Button>
           <Button onClick={() => { setEditingItem(null); setIsEditorOpen(true); }} className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 text-white">
             <Plus className="w-4 h-4 mr-2" /> Add Item
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <Card key={item.id} className={`rounded-2xl border-none shadow-lg shadow-stone-200/50 overflow-hidden relative group transition-all duration-300 ${!item.inStock ? 'opacity-60 grayscale-[0.5]' : ''}`}>
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                {item.isSpicy && <Badge variant="destructive" className="bg-red-500/90 backdrop-blur border-none shadow-lg shadow-red-500/20"><Flame className="w-3 h-3 mr-1" /> Spicy</Badge>}
                <Badge variant={item.inStock ? "default" : "secondary"} className={item.inStock ? 'bg-emerald-500/90 backdrop-blur border-none shadow-lg shadow-emerald-500/20' : 'bg-stone-500 text-white border-none'}>
                   {item.inStock ? 'In Stock' : '86\'d'}
                </Badge>
             </div>
             
             {/* Note: since absolute file paths won't load in regular unconfigured Next/Image for public assets in dev if not served, 
                 we will mock a colored placeholder if the URL starts with / for safety unless copied to public. */}
             <div className="h-48 w-full bg-stone-800 relative flex items-center justify-center p-4">
               {/* Simulating the dark chalkboard aesthetic from pot pot yum yum style in admin view too */}
               <div className="absolute inset-0 bg-[#2a2b2e]" />
               {item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover opacity-90" />
               ) : (
                  <div className="z-10 text-center">
                     <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#8e986d] bg-[#d9a05b]/20 flex items-center justify-center mb-2 shadow-2xl backdrop-blur-md">
                        <UtensilsIcon className="w-8 h-8 text-[#d9a05b]" />
                     </div>
                     <span className="text-xs text-stone-400">Generated Art Pending Map</span>
                  </div>
               )}
             </div>

             <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <CardTitle className="text-xl font-bold leading-tight">{item.name}</CardTitle>
                   <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm shrink-0">₹{item.price}</span>
                </div>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-orange-500">{item.category}</CardDescription>
             </CardHeader>
             
             <CardContent className="pb-4">
                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
                   {item.brandStory}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                   {item.ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-sm">{ing}</span>
                   ))}
                   {item.ingredients.length > 3 && <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-sm">+{item.ingredients.length - 3} more</span>}
                </div>
             </CardContent>
             
             <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 gap-2">
                <Button onClick={() => toggleStock(item)} variant={item.inStock ? 'outline' : 'default'} className="flex-1 rounded-xl font-bold">
                   {item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                </Button>
                <Button onClick={() => { setEditingItem(item); setIsEditorOpen(true); }} variant="secondary" className="shrink-0 rounded-xl">
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button onClick={() => deleteItem(item.id)} variant="ghost" className="shrink-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash className="w-4 h-4" />
                </Button>
             </CardFooter>
          </Card>
        ))}

        {items.length === 0 && !isLoading && (
           <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50">
              <UtensilsIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-900">No items on the menu</h3>
              <p className="text-stone-500 mt-1 mb-4">Click 'Seed Initial Data' to populate the Pot Pot style items.</p>
           </div>
        )}
      </div>

      <ItemEditorDialog
         isOpen={isEditorOpen}
         onClose={() => setIsEditorOpen(false)}
         onSave={saveItem}
         editingItem={editingItem}
      />
    </div>
  );
}

function UtensilsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  )
}

export default function AdminLiveMenuPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Live Menu Matrix">
          <LiveMenuManager />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  )
}
