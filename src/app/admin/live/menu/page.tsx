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
import { Plus, Flame, RefreshCw, UploadCloud, Trash, Pencil, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { ItemEditorDialog } from './item-editor-dialog';

const MOCK_ITEMS: Omit<LiveItem, 'id'>[] = [
  {
    name: "Fresh Tender Coconut Water (Glass Bottle)",
    price: 79,
    imageUrl: "/live_menu/bookeato_coconut_glass_bottle.jpg",
    category: "Organic Refreshment",
    inStock: true,
    isSpicy: false,
    isVeg: true,
    ingredients: ["100% Pure Tender Coconut Water", "Natural Electrolytes", "Glass Bottle Packaging"],
    nutritionalProfile: { calories: 45, protein: 1, carbs: 9, fat: 0 },
    brandStory: "Pure raw tender coconut water served chilled in glass bottle with Bookeato sticker label. Natural hydration delivered fresh daily.",
    societyId: "global"
  },
  {
    name: "Customized Organic Salad Box",
    price: 99,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
    category: "Daily Health Subscription",
    inStock: true,
    isSpicy: false,
    isVeg: true,
    ingredients: ["Chickpeas", "Lobiya", "Organic Paneer / Tofu", "Red Onions", "Tomatoes", "Lemon Mint Vinaigrette"],
    nutritionalProfile: { calories: 280, protein: 18, carbs: 32, fat: 6 },
    brandStory: "Handpicked organic greens, high-protein legumes, and artisan house dressings in a crisp subscription box.",
    societyId: "global"
  },
  {
    name: "Overnight Protein Oats Jar (24g Protein)",
    price: 129,
    imageUrl: "/live_menu/bookeato_oats_glass_jar.jpg",
    category: "Daily Health Subscription",
    inStock: true,
    isSpicy: false,
    isVeg: true,
    ingredients: ["Rolled Oats", "Belgian Chocolate / French Vanilla Whey (24g)", "Almond Milk", "Fresh Berries", "Almonds"],
    nutritionalProfile: { calories: 340, protein: 24, carbs: 42, fat: 5 },
    brandStory: "Slow-soaked overnight oats loaded with 24g pure whey protein powder, fruit compote, and superfood nut toppings in glass jar.",
    societyId: "global"
  },
  {
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
  },
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
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as LiveItem;
        fetchedItems.push({ ...data, id: docSnap.id });
      });

      if (fetchedItems.length > 0) {
        setItems(fetchedItems);
        try {
          localStorage.setItem('bookeato_live_items_override', JSON.stringify(fetchedItems));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}
      } else {
        // Fallback to MOCK_ITEMS if empty
        setItems(MOCK_ITEMS as LiveItem[]);
        try {
          localStorage.setItem('bookeato_live_items_override', JSON.stringify(MOCK_ITEMS));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
      const cached = localStorage.getItem('bookeato_live_items_override');
      if (cached) {
        try { setItems(JSON.parse(cached)); } catch (err) { setItems(MOCK_ITEMS as LiveItem[]); }
      } else {
        setItems(MOCK_ITEMS as LiveItem[]);
      }
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
      let updated: LiveItem[];
      if (editingItem) {
         const docRef = doc(firestore, 'liveItems', editingItem.id);
         await updateDoc(docRef, itemData);
         updated = items.map(i => i.id === editingItem.id ? { id: editingItem.id, ...itemData } : i);
         toast({ title: 'Updated', description: 'Item updated successfully.' });
      } else {
         const res = await addDoc(collection(firestore, 'liveItems'), itemData);
         updated = [...items, { id: res.id, ...itemData }];
         toast({ title: 'Added', description: 'New item added successfully.' });
      }
      setItems(updated);
      try {
        localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save item', variant: 'destructive' });
      throw e;
    }
  };

  const toggleTodaysDish = async (item: LiveItem) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveItems', item.id);
      const nextState = !item.isTodaysDish;
      await updateDoc(docRef, { isTodaysDish: nextState });
      // If marking true, unmark all other items as Today's Dish
      const updated = items.map(i => {
        if (i.id === item.id) return { ...i, isTodaysDish: nextState };
        return nextState ? { ...i, isTodaysDish: false } : i;
      });
      setItems(updated);
      try {
        localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
      toast({ 
        title: nextState ? 'Set as Today\'s Dish' : 'Removed from Today\'s Dish', 
        description: nextState ? `"${item.name}" is now featured as Today's Dish on customer page.` : `"${item.name}" is no longer featured.` 
      });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update Today\'s Dish status', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-900 text-white rounded-[2rem] p-8 -mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-black flex items-center gap-2">
             Live Menu Master <Sparkles className="w-6 h-6 text-amber-400" />
           </h1>
           <p className="text-stone-400 mt-2 font-medium">Control stall items, mark Today's Dish, and manage live inventory.</p>
        </div>
        <div className="flex flex-wrap gap-3">
             <Button onClick={seedMockData} disabled={isSeeding} variant="secondary" className="rounded-xl font-bold bg-white text-stone-900 border-2 border-transparent shadow-lg shadow-white/20">
               <UploadCloud className="w-4 h-4 mr-2" /> {isSeeding ? 'Updating...' : 'Reset Demo Menu'}
             </Button>
           <Button onClick={fetchItems} variant="outline" className="rounded-xl font-bold border-stone-700 hover:bg-stone-800 text-white bg-transparent">
             <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
           </Button>
           <Button 
             onClick={() => { 
               setEditingItem(null); 
               setIsEditorOpen(true); 
             }} 
             className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 border-none shadow-lg shadow-amber-500/20 text-stone-950"
           >
             <Star className="w-4 h-4 mr-2 fill-stone-950" /> Add Today's Dish
           </Button>
           <Button onClick={() => { setEditingItem(null); setIsEditorOpen(true); }} className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 text-white">
             <Plus className="w-4 h-4 mr-2" /> Add Item
           </Button>
        </div>
      </div>

      {/* BACKEND SUBSCRIPTION PRICES & PORTION RATES MANAGER (ADMIN CONTROL) */}
      <Card className="rounded-[2rem] border-stone-200/80 shadow-md bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <Badge className="bg-emerald-100 text-emerald-950 font-black text-[10px] uppercase">Backend Admin Control</Badge>
            <h2 className="text-xl font-black text-stone-900 mt-0.5">Live Subscription Item & Portion Price Manager</h2>
            <p className="text-xs text-stone-500 font-medium">Update prices per portion for Coconut Water, Salad Box ingredients, and Overnight Oats toppings. Changes reflect live for customers instantly.</p>
          </div>
          <Button 
            onClick={() => {
              const config = {
                coconutPrices,
                saladBasePrice,
                oatsBasePrice,
                saladGrains: [
                  { id: 'chickpeas', name: 'Chickpeas (Kabuli Chana)', price: 30, icon: '🫘' },
                  { id: 'lobiya', name: 'Black-Eyed Peas (Lobiya)', price: 30, icon: '🌱' },
                  { id: 'moong', name: 'Sprouted Green Moong', price: 25, icon: '🌿' },
                  { id: 'paneer', name: 'Organic Paneer Cubes', price: 35, icon: '🧀' },
                  { id: 'tofu', name: 'High-Protein Tofu', price: 35, icon: '🟩' },
                ],
                saladVeggies: [
                  { id: 'onions', name: 'Red Onions', price: 15, icon: '🧅' },
                  { id: 'tomatoes', name: 'Crisp Tomatoes', price: 15, icon: '🍅' },
                  { id: 'cherry_tomatoes', name: 'Cherry Tomatoes', price: 20, icon: '🍒' },
                  { id: 'peanuts', name: 'Roasted Peanuts', price: 15, icon: '🥜' },
                  { id: 'capsicum', name: 'Capsicum (Bell Pepper)', price: 15, icon: '🫑' },
                  { id: 'lettuce', name: 'Fresh Lettuce', price: 15, icon: '🥬' },
                  { id: 'cucumber', name: 'Crispy Cucumber', price: 15, icon: '🥒' },
                  { id: 'corn', name: 'Sweet Corn', price: 15, icon: '🌽' },
                ]
              };
              localStorage.setItem('bookeato_subscription_prices', JSON.stringify(config));
              window.dispatchEvent(new Event('storage'));
              toast({ title: "Subscription Prices Saved", description: "Updated ingredient portion prices are now live for customers." });
            }}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl h-9 px-4 shrink-0"
          >
            Save Admin Portion Prices
          </Button>
        </div>

        {/* EDITABLE PORTION PRICES CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="font-extrabold text-stone-900 block text-sm">1. Coconut Water Prices</span>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>500 ml Bottle (₹)</span>
              <Input 
                type="number"
                value={coconutPrices['500ml'] || 79}
                onChange={e => setCoconutPrices({ ...coconutPrices, '500ml': Number(e.target.value) })}
                className="w-20 h-8 text-right font-black text-emerald-800"
              />
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>1 Litre Bottle (₹)</span>
              <Input 
                type="number"
                value={coconutPrices['1ltr'] || 149}
                onChange={e => setCoconutPrices({ ...coconutPrices, '1ltr': Number(e.target.value) })}
                className="w-20 h-8 text-right font-black text-emerald-800"
              />
            </div>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="font-extrabold text-stone-900 block text-sm">2. Salad Box Rates</span>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>Base Salad Box (₹)</span>
              <Input 
                type="number"
                value={saladBasePrice}
                onChange={e => setSaladBasePrice(Number(e.target.value))}
                className="w-20 h-8 text-right font-black text-amber-800"
              />
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>Grains Add-ons Rate</span>
              <span className="font-black text-amber-800">+₹25 - ₹35</span>
            </div>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="font-extrabold text-stone-900 block text-sm">3. Oats Jar Rates</span>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>Base Oats Jar (₹)</span>
              <Input 
                type="number"
                value={oatsBasePrice}
                onChange={e => setOatsBasePrice(Number(e.target.value))}
                className="w-20 h-8 text-right font-black text-purple-900"
              />
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200">
              <span>24g Protein Powder Flavors</span>
              <span className="font-black text-purple-900">+₹45 / flavor</span>
            </div>
          </div>
        </div>

        {/* ADMIN SUBSCRIPTION ITEMS ADD / REMOVE / EDIT LIST */}
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-stone-900">Active Live Subscription Catalog Items</span>
            <Button 
              onClick={() => {
                setEditingItem({
                  id: `sub-${Date.now()}`,
                  name: "Cold-Pressed Detox Juice",
                  price: 99,
                  imageUrl: "/live_menu/bookeato_coconut_glass_bottle.jpg",
                  category: "Daily Health Subscription",
                  inStock: true,
                  isVeg: true,
                  ingredients: ["Celery", "Green Apple", "Cucumber", "Lemon"],
                  brandStory: "Freshly cold-pressed raw juice delivered daily in reusable glass bottle.",
                  societyId: "global"
                });
                setIsEditorOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add New Subscription Item
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'Fresh Tender Coconut Water', category: 'Glass Bottle • 100% Pure Raw', price: '₹79 - ₹149', img: '/live_menu/bookeato_coconut_glass_bottle.jpg' },
              { title: 'Customizable Organic Salad Box', category: 'Custom Grains & Veggies', price: 'Base ₹99', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop' },
              { title: 'Overnight Protein Oats Mug', category: 'Milk, Fruits & Protein', price: 'Base ₹129', img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=400&auto=format&fit=crop' }
            ].map((sub, idx) => (
              <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-stone-200 relative overflow-hidden shrink-0">
                    <Image src={sub.img} alt={sub.title} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-xs">{sub.title}</h4>
                    <p className="text-[10px] text-stone-500 font-medium">{sub.category}</p>
                    <span className="text-[10px] font-black text-emerald-800">{sub.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className="bg-emerald-100 text-emerald-950 font-bold text-[9px]">Active</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <Card key={item.id} className={`rounded-2xl border-none shadow-lg shadow-stone-200/50 overflow-hidden relative group transition-all duration-300 ${!item.inStock ? 'opacity-60 grayscale-[0.5]' : ''} ${item.isTodaysDish ? 'ring-2 ring-amber-400' : ''}`}>
             <div className="absolute top-4 left-4 z-10">
                {item.isTodaysDish && (
                  <Badge className="bg-amber-500 text-stone-950 font-black backdrop-blur border-none shadow-lg shadow-amber-500/30">
                    <Star className="w-3 h-3 mr-1 fill-stone-950" /> Today's Dish
                  </Badge>
                )}
             </div>
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
             
             <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 gap-2 flex-wrap">
                 <Button onClick={() => toggleStock(item)} variant={item.inStock ? 'outline' : 'default'} className="flex-1 rounded-xl font-bold">
                    {item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                 </Button>
                 <Button 
                   onClick={() => toggleTodaysDish(item)} 
                   variant={item.isTodaysDish ? 'default' : 'outline'} 
                   className={item.isTodaysDish ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shrink-0 rounded-xl' : 'shrink-0 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50'}
                   title={item.isTodaysDish ? "Unmark Today's Dish" : "Mark as Today's Dish"}
                 >
                     <Star className={`w-4 h-4 ${item.isTodaysDish ? 'fill-stone-950' : ''}`} />
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
