'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Flame, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  RefreshCw, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  ChevronRight,
  BookOpen,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Star,
  UploadCloud,
  UtensilsIcon,
  Sparkle,
  ImageUp,
  X
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, addDoc, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { LiveItem } from '@/types/bookeato-live';
import { ItemEditorDialog } from './menu/item-editor-dialog';

interface LiveOrder {
  id: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    details?: string;
    status?: string;
  }>;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Active Subscription';
  totalAmount: number;
  createdAt: string;
  deliveryDates?: string[];
  societyName?: string;
  flatNumber?: string;
}

const DEFAULT_MOCK_ORDERS: LiveOrder[] = [
  {
    id: 'ord-101',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 43210',
    deliveryAddress: 'Flat 402, My Home Vihanga, Gachibowli, Hyderabad - 500032',
    items: [
      { name: 'Fresh Tender Coconut Water (Glass Bottle 500ml)', price: 79, quantity: 5, status: 'Active Subscription' },
      { name: 'Customized Organic Salad Box', price: 174, quantity: 5, status: 'Active Subscription' }
    ],
    status: 'Preparing',
    totalAmount: 1265,
    createdAt: new Date().toISOString(),
    deliveryDates: ['Mon, 25 Aug', 'Tue, 26 Aug', 'Wed, 27 Aug', 'Thu, 28 Aug', 'Fri, 29 Aug'],
    societyName: 'My Home Vihanga'
  },
  {
    id: 'ord-102',
    customerName: 'Vikramaditya Rao',
    customerPhone: '+91 91234 56789',
    deliveryAddress: 'Tower B - 1204, Jayabheri Silicon County, Hitec City - 500081',
    items: [
      { name: 'Overnight Protein Oats Jar (Chocolate Whey)', price: 214, quantity: 7, status: 'Active Subscription' }
    ],
    status: 'Out for Delivery',
    totalAmount: 1498,
    createdAt: new Date().toISOString(),
    deliveryDates: ['Mon, 25 Aug', 'Tue, 26 Aug', 'Wed, 27 Aug', 'Thu, 28 Aug', 'Fri, 29 Aug', 'Sat, 30 Aug', 'Sun, 31 Aug'],
    societyName: 'Jayabheri Silicon'
  },
  {
    id: 'ord-103',
    customerName: 'Priya Nambiar',
    customerPhone: '+91 99887 76655',
    deliveryAddress: 'Villa 18, Aparna Sarovar Grande, Nallagandla - 500019',
    items: [
      { name: '(V) Indori Poha Special', price: 100, quantity: 2, status: 'Delivered' }
    ],
    status: 'Delivered',
    totalAmount: 200,
    createdAt: new Date().toISOString(),
    societyName: 'Aparna Sarovar'
  }
];

const DEFAULT_MOCK_ITEMS: Omit<LiveItem, 'id'>[] = [
  {
    name: 'Fresh Tender Coconut Water (Glass Bottle)',
    price: 79,
    imageUrl: '/live_menu/bookeato_coconut_glass_bottle.jpg',
    category: 'Daily Health Subscription',
    inStock: true,
    isVeg: true,
    isTodaysDish: false,
    ingredients: ['100% Pure Raw Coconut Water', 'Zero Sugar', 'Glass Bottle Sealed'],
    brandStory: 'Naturally isotonic, rich in electrolytes (Potassium & Magnesium). Harvested daily from coastal tender coconuts and delivered chilled in eco glass bottles.',
    societyId: 'global'
  },
  {
    name: 'Customizable Organic Salad Box',
    price: 99,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
    category: 'Healthy Signatures',
    inStock: true,
    isVeg: true,
    isTodaysDish: false,
    ingredients: ['Organic Chickpeas', 'Black-Eyed Peas (Lobiya)', 'Sprouted Green Moong', 'Red Onions', 'Crisp Tomatoes', 'Lemon Mint Vinaigrette'],
    brandStory: 'High-protein, fiber-dense salad bowls crafted to boost energy and metabolism without feeling heavy.',
    societyId: 'global'
  },
  {
    name: 'Overnight Protein Oats Jar',
    price: 129,
    imageUrl: '/live_menu/bookeato_oats_glass_jar.jpg',
    category: 'Healthy Signatures',
    inStock: true,
    isVeg: true,
    isTodaysDish: false,
    ingredients: ['Classic Rolled Oats', 'Almond Milk', '24g Whey Protein', 'Fresh Strawberries', 'Roasted Almonds'],
    brandStory: 'Slow-soaked overnight oats packed with 24g clean protein, healthy fats, and low glycemic index energy.',
    societyId: 'global'
  },
  {
    name: '(V) Indori Poha Special',
    price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop',
    category: 'Today\'s Special',
    inStock: true,
    isVeg: true,
    isTodaysDish: true,
    ingredients: ['Cold Press Oil', 'Organic Hand-Pounded Rice Poha', 'Jeeravan Masala', 'Fresh Pomegranate', 'Crunchy Sev'],
    brandStory: 'The beloved breakfast jewel of Indore, elevated. Made by cold press oil with organic hand-pounded rice and authentic Jeeravan masala.',
    societyId: 'global'
  }
];

const DEFAULT_SALAD_GRAINS = [
  { id: 'chickpeas', name: 'Chickpeas (Kabuli Chana)', price: 30, icon: '🫘' },
  { id: 'lobiya', name: 'Black-Eyed Peas (Lobiya)', price: 30, icon: '🌱' },
  { id: 'moong', name: 'Sprouted Green Moong', price: 25, icon: '🌿' },
  { id: 'paneer', name: 'Organic Paneer Cubes', price: 35, icon: '🧀' },
  { id: 'tofu', name: 'High-Protein Tofu', price: 35, icon: '🟩' }
];

const DEFAULT_SALAD_VEGGIES = [
  { id: 'onions', name: 'Red Onions', price: 15, icon: '🧅' },
  { id: 'tomatoes', name: 'Crisp Tomatoes', price: 15, icon: '🍅' },
  { id: 'cherry_tomatoes', name: 'Cherry Tomatoes', price: 20, icon: '🍒' },
  { id: 'peanuts', name: 'Roasted Peanuts', price: 15, icon: '🥜' },
  { id: 'capsicum', name: 'Capsicum (Bell Pepper)', price: 15, icon: '🫑' },
  { id: 'lettuce', name: 'Fresh Lettuce', price: 15, icon: '🥬' },
  { id: 'cucumber', name: 'Crispy Cucumber', price: 15, icon: '🥒' },
  { id: 'corn', name: 'Sweet Corn', price: 15, icon: '🌽' }
];

const DEFAULT_SALAD_DRESSINGS = [
  { id: 'lemon_mint', name: 'Lemon Mint Vinaigrette', price: 20, icon: '🍋' },
  { id: 'honey_mustard', name: 'Honey Mustard', price: 25, icon: '🍯' },
  { id: 'sesame_tahini', name: 'Roasted Sesame Tahini', price: 25, icon: '🥜' }
];

const DEFAULT_OATS_MILK = [
  { id: 'almond_milk', name: 'Almond Milk', price: 25 },
  { id: 'cow_milk', name: 'Organic Cow Milk', price: 15 },
  { id: 'oat_milk', name: 'Oat Milk', price: 30 }
];

const DEFAULT_OATS_PROTEIN_FLAVORS = [
  { id: 'belgian_chocolate', name: 'Belgian Chocolate Whey (24g)', price: 45 },
  { id: 'vanilla_bean', name: 'Vanilla Bean Whey (24g)', price: 45 },
  { id: 'unflavored_clean', name: 'Unflavored Clean Whey (24g)', price: 40 }
];

const DEFAULT_OATS_FRUITS = [
  { id: 'strawberries', name: 'Fresh Strawberries', price: 30 },
  { id: 'banana', name: 'Banana Slices', price: 20 },
  { id: 'blueberries', name: 'Organic Blueberries', price: 35 }
];

const DEFAULT_OATS_NUTS = [
  { id: 'almonds', name: 'Roasted Almonds', price: 20 },
  { id: 'peanut_butter', name: 'Peanut Butter', price: 25 },
  { id: 'chia_seeds', name: 'Chia & Flax Seeds', price: 20 }
];

function BookeatoLiveUnifiedHub() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<LiveOrder[]>(DEFAULT_MOCK_ORDERS);
  const [items, setItems] = useState<LiveItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingItems, setIsLoadingLoadingItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Item Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LiveItem | null>(null);

  // Portion Prices & Customizable Ingredients State
  const [coconutPrices, setCoconutPrices] = useState({ '500ml': 79, '1ltr': 149 });
  const [saladBasePrice, setSaladBasePrice] = useState(99);
  const [oatsBasePrice, setOatsBasePrice] = useState(129);

  const [saladGrains, setSaladGrains] = useState(DEFAULT_SALAD_GRAINS);
  const [saladVeggies, setSaladVeggies] = useState(DEFAULT_SALAD_VEGGIES);
  const [saladDressings, setSaladDressings] = useState(DEFAULT_SALAD_DRESSINGS);
  const [oatsMilk, setOatsMilk] = useState(DEFAULT_OATS_MILK);
  const [oatsProteinFlavors, setOatsProteinFlavors] = useState(DEFAULT_OATS_PROTEIN_FLAVORS);
  const [oatsFruits, setOatsFruits] = useState(DEFAULT_OATS_FRUITS);
  const [oatsNuts, setOatsNuts] = useState(DEFAULT_OATS_NUTS);

  // Subscription Item Images
  const [subscriptionImages, setSubscriptionImages] = useState({
    coconut: '/live_menu/bookeato_coconut_glass_bottle.jpg',
    salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
    oats: '/live_menu/bookeato_oats_glass_jar.jpg',
  });

  // 1. Fetch Orders Stream — silent fallback on permission errors
  useEffect(() => {
    setIsLoadingOrders(false);
    if (!firestore) return;
    let unsubscribe: (() => void) | null = null;
    try {
      const q = query(collection(firestore, 'liveOrders'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: LiveOrder[] = [];
        snapshot.forEach(docSnap => {
          fetched.push({ ...docSnap.data(), id: docSnap.id } as LiveOrder);
        });
        if (fetched.length > 0) setOrders(fetched);
        setIsLoadingOrders(false);
      }, (_err) => {
        // Silent — orders fall back to local state when permissions are unavailable
        setIsLoadingOrders(false);
      });
    } catch (_e) {
      setIsLoadingOrders(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [firestore]);

  // 2. Fetch Menu Items Stream
  useEffect(() => {
    const cached = localStorage.getItem('bookeato_live_items_override');
    if (cached) {
      try { setItems(JSON.parse(cached)); } catch (e) {}
    } else {
      setItems(DEFAULT_MOCK_ITEMS.map((m, idx) => ({ ...m, id: `mock-${idx + 1}` })));
    }

    const savedPrices = localStorage.getItem('bookeato_subscription_prices');
    if (savedPrices) {
      try {
        const p = JSON.parse(savedPrices);
        if (p.coconutPrices) setCoconutPrices(p.coconutPrices);
        if (p.saladBasePrice) setSaladBasePrice(p.saladBasePrice);
        if (p.oatsBasePrice) setOatsBasePrice(p.oatsBasePrice);
        if (p.saladGrains) setSaladGrains(p.saladGrains);
        if (p.saladVeggies) setSaladVeggies(p.saladVeggies);
        if (p.saladDressings) setSaladDressings(p.saladDressings);
        if (p.oatsMilk) setOatsMilk(p.oatsMilk);
        if (p.oatsProteinFlavors) setOatsProteinFlavors(p.oatsProteinFlavors);
        if (p.oatsFruits) setOatsFruits(p.oatsFruits);
        if (p.oatsNuts) setOatsNuts(p.oatsNuts);
        if (p.subscriptionImages) setSubscriptionImages(prev => ({ ...prev, ...p.subscriptionImages }));
      } catch (e) {}
    }

    setIsLoadingLoadingItems(false);
    if (!firestore) return;
    let unsubscribe: (() => void) | null = null;
    try {
      const q = collection(firestore, 'liveItems');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: LiveItem[] = [];
        snapshot.forEach(docSnap => {
          fetched.push({ ...docSnap.data(), id: docSnap.id } as LiveItem);
        });
        if (fetched.length > 0) {
          setItems(fetched);
          try {
            localStorage.setItem('bookeato_live_items_override', JSON.stringify(fetched));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}
        }
        setIsLoadingLoadingItems(false);
      }, (_err) => {
        // Silent — items fall back to localStorage/mock when permissions are unavailable
        setIsLoadingLoadingItems(false);
      });
    } catch (_e) {
      setIsLoadingLoadingItems(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [firestore]);

  // Order Status Update
  const updateOrderStatus = async (orderId: string, newStatus: LiveOrder['status']) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveOrders', orderId);
      await updateDoc(docRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: 'Status Updated', description: `Order status set to ${newStatus}.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update order status.' });
    }
  };

  // Item Actions
  const toggleStock = async (item: LiveItem) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveItems', item.id);
      const nextState = !item.inStock;
      await updateDoc(docRef, { inStock: nextState });
      const updated = items.map(i => i.id === item.id ? { ...i, inStock: nextState } : i);
      setItems(updated);
      localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      toast({ title: 'Stock Updated', description: `${item.name} is now ${nextState ? 'In Stock' : 'Out of Stock'}.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update stock.' });
    }
  };

  const toggleTodaysDish = async (item: LiveItem) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveItems', item.id);
      const nextState = !item.isTodaysDish;
      await updateDoc(docRef, { isTodaysDish: nextState });
      const updated = items.map(i => {
        if (i.id === item.id) return { ...i, isTodaysDish: nextState };
        return nextState ? { ...i, isTodaysDish: false } : i;
      });
      setItems(updated);
      localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      toast({ title: nextState ? "Set as Today's Dish" : "Unmarked Today's Dish", description: `Updated "${item.name}" status live for customers.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update Today\'s Dish.' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    if (firestore) {
      try { await deleteDoc(doc(firestore, 'liveItems', id)); } catch (e) {}
    }
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    toast({ title: 'Deleted', description: 'Item removed from live catalog.' });
  };

  const saveItem = async (itemData: Omit<LiveItem, 'id'>) => {
    let updated: LiveItem[];
    if (editingItem && firestore) {
      try {
        const docRef = doc(firestore, 'liveItems', editingItem.id);
        await updateDoc(docRef, itemData);
      } catch (e) {}
      updated = items.map(i => i.id === editingItem.id ? { id: editingItem.id, ...itemData } : i);
    } else {
      let newId = `item-${Date.now()}`;
      if (firestore) {
        try {
          const res = await addDoc(collection(firestore, 'liveItems'), itemData);
          newId = res.id;
        } catch (e) {}
      }
      updated = [...items, { id: newId, ...itemData }];
    }
    setItems(updated);
    localStorage.setItem('bookeato_live_items_override', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    toast({ title: 'Saved', description: 'Menu item details saved and synced live to customer page.' });
  };

  const savePortionPrices = () => {
    const config = {
      coconutPrices,
      saladBasePrice,
      oatsBasePrice,
      saladGrains,
      saladVeggies,
      saladDressings,
      oatsMilk,
      oatsProteinFlavors,
      oatsFruits,
      oatsNuts,
      subscriptionImages
    };
    localStorage.setItem('bookeato_subscription_prices', JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Portion Prices, Images & Ingredients Saved", description: "Updated images, ingredient names, prices, and portion rates are now live on Bookeato Live page." });
  };

  // Handle subscription image file upload (converts to base64 data URL)
  const handleSubscriptionImageUpload = (key: keyof typeof subscriptionImages, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSubscriptionImages(prev => ({ ...prev, [key]: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const name = o.customerName || o.customer?.name || '';
      const phone = o.customerPhone || o.customer?.phone || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800 gap-4">
        <div>
           <Badge className="bg-orange-500 text-stone-950 font-black text-xs uppercase mb-2">Bookeato Live Hub</Badge>
           <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2 tracking-tight">
             Bookeato Live Orders & Menu Master <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
           </h1>
           <p className="text-stone-400 mt-1 font-medium text-xs sm:text-sm">
             Kitchen Display System, Subscription Orders Stream, and Live Menu Master (Synced Real-Time with `/live`).
           </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button onClick={() => setActiveTab('orders')} className={`rounded-full font-extrabold text-xs px-5 h-10 ${activeTab === 'orders' ? 'bg-orange-500 text-stone-950 shadow-md' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'}`}>
            <ShoppingBag className="w-4 h-4 mr-2" /> Live KDS Orders ({orders.length})
          </Button>
          <Button onClick={() => setActiveTab('menu')} className={`rounded-full font-extrabold text-xs px-5 h-10 ${activeTab === 'menu' ? 'bg-orange-500 text-stone-950 shadow-md' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'}`}>
            <BookOpen className="w-4 h-4 mr-2" /> Menu & Price Config ({items.length})
          </Button>
        </div>
      </div>

      {/* 🌟 TAB 1: KITCHEN DISPLAY SYSTEM & LIVE ORDERS 🌟 */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <Input 
                placeholder="Search by customer name or phone..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-stone-50 border-stone-200 font-semibold text-xs rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Preparing', 'Out for Delivery', 'Delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all ${
                    statusFilter === st ? 'bg-stone-950 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map(order => {
              const custName = order.customerName || order.customer?.name || 'Live Customer';
              const custPhone = order.customerPhone || order.customer?.phone || '+91 98765 43210';
              const address = order.deliveryAddress || order.customer?.address || 'My Home Vihanga, Hyderabad';

              return (
                <Card key={order.id} className="rounded-3xl border-stone-200 shadow-md bg-white overflow-hidden flex flex-col justify-between">
                  <CardHeader className="bg-stone-950 text-white p-5 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="bg-orange-500 text-stone-950 font-black text-[9px] uppercase mb-1">
                          {order.societyName || 'Live Subscription'}
                        </Badge>
                        <CardTitle className="text-base font-black leading-tight text-white">{custName}</CardTitle>
                        <p className="text-xs text-stone-400 flex items-center gap-1 font-medium mt-0.5">
                          <Phone className="w-3 h-3 text-orange-400" /> {custPhone}
                        </p>
                      </div>
                      <Badge className={`font-black text-[10px] uppercase px-2.5 py-1 ${
                        order.status === 'Delivered' ? 'bg-emerald-500 text-white' :
                        order.status === 'Out for Delivery' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-stone-950'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4 flex-1">
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-stone-700 font-bold text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="line-clamp-2">{address}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Subscribed Items</span>
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 text-xs">
                          <div className="flex items-center gap-2">
                            <Utensils className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-extrabold text-stone-900">{it.name}</span>
                          </div>
                          <span className="font-black text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">₹{it.price}</span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryDates && order.deliveryDates.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-stone-400 block">Scheduled Delivery Dates</span>
                        <div className="flex flex-wrap gap-1">
                          {order.deliveryDates.map((d, i) => (
                            <span key={i} className="text-[9.5px] font-bold bg-orange-50 text-orange-950 border border-orange-200 px-2 py-0.5 rounded-md">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 flex justify-between items-center gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-black text-stone-400 block">Total Rate</span>
                      <span className="text-base font-black text-stone-950">₹{order.totalAmount}</span>
                    </div>

                    <div className="flex gap-1.5">
                      {order.status !== 'Delivered' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, order.status === 'Preparing' ? 'Out for Delivery' : 'Delivered')}
                          className="bg-stone-950 hover:bg-stone-900 text-white font-black text-xs rounded-xl h-9 px-3"
                        >
                          Mark {order.status === 'Preparing' ? 'Out for Delivery' : 'Delivered'}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 🌟 TAB 2: LIVE MENU MASTER & PORTION PRICE CONFIGURATOR 🌟 */}
      {activeTab === 'menu' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* BACKEND SUBSCRIPTION PORTION PRICE CONTROLS */}
          <Card className="rounded-[2.5rem] border-stone-200 shadow-md bg-white p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <Badge className="bg-emerald-100 text-emerald-950 font-black text-[10px] uppercase">Backend Admin Master Control</Badge>
                <h2 className="text-xl md:text-2xl font-black text-stone-900 mt-0.5">Subscription Items & Portion Price Configurator</h2>
                <p className="text-xs text-stone-500 font-medium mt-0.5">Edit images, base prices, portion rates, and customizable ingredients. Changes reflect live instantly.</p>
              </div>
              <Button 
                onClick={savePortionPrices}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl h-10 px-5 shrink-0 shadow-lg"
              >
                <ImageUp className="w-4 h-4 mr-1.5" /> Save Prices, Images & Ingredients
              </Button>
            </div>

            {/* SUBSCRIPTION ITEM IMAGES EDITOR */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ImageUp className="w-4 h-4 text-orange-500" />
                <span className="font-black text-stone-900 text-sm">Subscription Item Images</span>
                <span className="text-[10px] text-stone-400 font-medium">Upload or paste URL — synced live to customer page</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { key: 'coconut' as const, label: '🥥 Coconut Water', accent: 'emerald' },
                  { key: 'salad' as const, label: '🥗 Salad Box', accent: 'amber' },
                  { key: 'oats' as const, label: '🫙 Oats Jar', accent: 'purple' },
                ] as const).map(({ key, label, accent }) => (
                  <div key={key} className={`bg-${accent}-50/40 border border-${accent}-200 rounded-2xl p-3 space-y-2`}>
                    <span className="font-black text-xs text-stone-800 block">{label}</span>
                    {/* Image Preview */}
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group/imgprev">
                      {subscriptionImages[key] ? (
                        <img src={subscriptionImages[key]} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <UtensilsIcon className="w-6 h-6" />
                        </div>
                      )}
                      {/* Clear button */}
                      {subscriptionImages[key] && (
                        <button
                          type="button"
                          onClick={() => setSubscriptionImages(prev => ({ ...prev, [key]: '' }))}
                          className="absolute top-1 right-1 bg-stone-950/70 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/imgprev:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {/* Upload button */}
                    <label className="flex items-center gap-1.5 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-lg px-2.5 py-1.5 w-full justify-center transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload New Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSubscriptionImageUpload(key, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {/* URL Input */}
                    <Input
                      value={subscriptionImages[key]}
                      onChange={(e) => setSubscriptionImages(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="https://... or /live_menu/..."
                      className="h-7 text-[10px] font-mono border-stone-200 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Base Rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                <span className="font-extrabold text-stone-900 block text-sm">1. Coconut Water Prices</span>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700">500 ml Bottle (₹)</span>
                  <Input 
                    type="number"
                    value={coconutPrices['500ml'] || 79}
                    onChange={e => setCoconutPrices({ ...coconutPrices, '500ml': Number(e.target.value) })}
                    className="w-24 h-8 text-right font-black text-emerald-800 bg-emerald-50/40 border-emerald-200"
                  />
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700">1 Litre Bottle (₹)</span>
                  <Input 
                    type="number"
                    value={coconutPrices['1ltr'] || 149}
                    onChange={e => setCoconutPrices({ ...coconutPrices, '1ltr': Number(e.target.value) })}
                    className="w-24 h-8 text-right font-black text-emerald-800 bg-emerald-50/40 border-emerald-200"
                  />
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                <span className="font-extrabold text-stone-900 block text-sm">2. Base Salad Box Rate</span>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700">Base Salad Box (₹)</span>
                  <Input 
                    type="number"
                    value={saladBasePrice}
                    onChange={e => setSaladBasePrice(Number(e.target.value))}
                    className="w-24 h-8 text-right font-black text-amber-800 bg-amber-50/40 border-amber-200"
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-bold">Includes standard base veggies & vinaigrette dressing.</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                <span className="font-extrabold text-stone-900 block text-sm">3. Base Oats Jar Rate</span>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700">Base Oats Jar (₹)</span>
                  <Input 
                    type="number"
                    value={oatsBasePrice}
                    onChange={e => setOatsBasePrice(Number(e.target.value))}
                    className="w-24 h-8 text-right font-black text-purple-950 bg-purple-50/40 border-purple-200"
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-bold">Includes classic rolled oats & milk base.</p>
              </div>
            </div>

            {/* CUSTOMIZABLE SALAD BOX INGREDIENTS EDITOR */}
            <div className="space-y-4 border-t border-stone-200 pt-5">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
                  🥗 Customizable Organic Salad Box Ingredients & Add-on Prices
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Salad Grains */}
                <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-amber-950 text-xs">Grains & Protein Options</span>
                    <Button 
                      onClick={() => setSaladGrains([...saladGrains, { id: `grain-${Date.now()}`, name: 'New Protein Grain', price: 25, icon: '🫘' }])}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Grain
                    </Button>
                  </div>
                  {saladGrains.map((g, idx) => (
                    <div key={g.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-amber-200">
                      <Input 
                        value={g.name}
                        onChange={e => {
                          const copy = [...saladGrains];
                          copy[idx].name = e.target.value;
                          setSaladGrains(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={g.price}
                          onChange={e => {
                            const copy = [...saladGrains];
                            copy[idx].price = Number(e.target.value);
                            setSaladGrains(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-amber-900 border-amber-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setSaladGrains(saladGrains.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Salad Veggies */}
                <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-emerald-950 text-xs">Veggies & Crunch Options</span>
                    <Button 
                      onClick={() => setSaladVeggies([...saladVeggies, { id: `veg-${Date.now()}`, name: 'New Crunchy Veggie', price: 15, icon: '🥗' }])}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Veggie
                    </Button>
                  </div>
                  {saladVeggies.map((v, idx) => (
                    <div key={v.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-emerald-200">
                      <Input 
                        value={v.name}
                        onChange={e => {
                          const copy = [...saladVeggies];
                          copy[idx].name = e.target.value;
                          setSaladVeggies(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={v.price}
                          onChange={e => {
                            const copy = [...saladVeggies];
                            copy[idx].price = Number(e.target.value);
                            setSaladVeggies(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-emerald-900 border-emerald-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setSaladVeggies(saladVeggies.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Salad Dressings */}
                <div className="bg-yellow-50/30 p-4 rounded-2xl border border-yellow-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-yellow-950 text-xs">Vinaigrettes & Dressings</span>
                    <Button 
                      onClick={() => setSaladDressings([...saladDressings, { id: `dressing-${Date.now()}`, name: 'New Dressing', price: 20, icon: '🍋' }])}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Dressing
                    </Button>
                  </div>
                  {saladDressings.map((d, idx) => (
                    <div key={d.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-yellow-200">
                      <Input 
                        value={d.name}
                        onChange={e => {
                          const copy = [...saladDressings];
                          copy[idx].name = e.target.value;
                          setSaladDressings(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={d.price}
                          onChange={e => {
                            const copy = [...saladDressings];
                            copy[idx].price = Number(e.target.value);
                            setSaladDressings(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-yellow-900 border-yellow-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setSaladDressings(saladDressings.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CUSTOMIZABLE OATS JAR INGREDIENTS EDITOR */}
            <div className="space-y-4 border-t border-stone-200 pt-5">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
                  🫙 Customizable Overnight Protein Oats Jar Ingredients & Whey Rates
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Protein Flavors */}
                <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-purple-950 text-xs">24g Whey Protein Flavors</span>
                    <Button 
                      onClick={() => setOatsProteinFlavors([...oatsProteinFlavors, { id: `whey-${Date.now()}`, name: 'New Whey Flavor (24g)', price: 45 }])}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Flavor
                    </Button>
                  </div>
                  {oatsProteinFlavors.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-purple-200">
                      <Input 
                        value={p.name}
                        onChange={e => {
                          const copy = [...oatsProteinFlavors];
                          copy[idx].name = e.target.value;
                          setOatsProteinFlavors(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={p.price}
                          onChange={e => {
                            const copy = [...oatsProteinFlavors];
                            copy[idx].price = Number(e.target.value);
                            setOatsProteinFlavors(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-purple-900 border-purple-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setOatsProteinFlavors(oatsProteinFlavors.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Milk Bases */}
                <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-blue-950 text-xs">Milk & Plant Milk Bases</span>
                    <Button 
                      onClick={() => setOatsMilk([...oatsMilk, { id: `milk-${Date.now()}`, name: 'New Milk Base', price: 20 }])}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Milk Base
                    </Button>
                  </div>
                  {oatsMilk.map((m, idx) => (
                    <div key={m.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-blue-200">
                      <Input 
                        value={m.name}
                        onChange={e => {
                          const copy = [...oatsMilk];
                          copy[idx].name = e.target.value;
                          setOatsMilk(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={m.price}
                          onChange={e => {
                            const copy = [...oatsMilk];
                            copy[idx].price = Number(e.target.value);
                            setOatsMilk(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-blue-900 border-blue-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setOatsMilk(oatsMilk.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Fruits & Nuts Toppings */}
                <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-200/70 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-rose-950 text-xs">Fruits & Nuts Toppings</span>
                    <Button 
                      onClick={() => setOatsFruits([...oatsFruits, { id: `topping-${Date.now()}`, name: 'New Fruit/Nut Topping', price: 25 }])}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black h-6 px-2 rounded-lg"
                    >
                      + Add Topping
                    </Button>
                  </div>
                  {oatsFruits.map((ft, idx) => (
                    <div key={ft.id || idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-rose-200">
                      <Input 
                        value={ft.name}
                        onChange={e => {
                          const copy = [...oatsFruits];
                          copy[idx].name = e.target.value;
                          setOatsFruits(copy);
                        }}
                        className="h-7 text-xs font-bold text-stone-900 flex-1 border-stone-200"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-black text-stone-500 text-[11px]">₹</span>
                        <Input 
                          type="number"
                          value={ft.price}
                          onChange={e => {
                            const copy = [...oatsFruits];
                            copy[idx].price = Number(e.target.value);
                            setOatsFruits(copy);
                          }}
                          className="w-14 h-7 text-right text-xs font-black text-rose-900 border-rose-200"
                        />
                      </div>
                      <Button 
                        onClick={() => setOatsFruits(oatsFruits.filter((_, i) => i !== idx))} 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ACTIVE DISHES GRID */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-stone-950">Active Stall & Subscription Catalog Items ({items.length})</h3>
            <Button 
              onClick={() => { setEditingItem(null); setIsEditorOpen(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black text-xs rounded-xl h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add New Item
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map(item => (
              <Card key={item.id} className={`rounded-2xl border-stone-200 shadow-sm overflow-hidden relative group transition-all duration-300 ${!item.inStock ? 'opacity-60 grayscale-[0.5]' : ''} ${item.isTodaysDish ? 'ring-2 ring-amber-400' : ''}`}>
                 {/* Top badges */}
                 <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
                    {item.isTodaysDish && (
                      <Badge className="bg-amber-500 text-stone-950 font-black border-none shadow text-[9px] px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-stone-950" /> Today
                      </Badge>
                    )}
                    <Badge variant={item.inStock ? "default" : "secondary"} className={`text-[9px] px-1.5 py-0.5 ${item.inStock ? 'bg-emerald-500 text-white border-none' : 'bg-stone-500 text-white border-none'}`}>
                       {item.inStock ? '✓' : '✗'}
                    </Badge>
                 </div>

                 {/* Image — compact height */}
                 <div className="h-28 w-full bg-stone-950 relative flex items-center justify-center overflow-hidden group/img">
                   {item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') || item.imageUrl.startsWith('data:')) ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105 opacity-90" />
                   ) : (
                      <UtensilsIcon className="w-8 h-8 text-orange-400" />
                   )}
                   {/* Hover: change image */}
                   <button 
                     type="button"
                     onClick={() => { setEditingItem(item); setIsEditorOpen(true); }}
                     className="absolute inset-0 bg-stone-950/65 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-white font-black text-[10px]"
                   >
                     <UploadCloud className="w-5 h-5 text-orange-400" />
                     <span>Change Image</span>
                   </button>
                 </div>

                 {/* Info — compact */}
                 <div className="p-2.5">
                    <div className="flex justify-between items-start gap-1 mb-0.5">
                       <span className="font-black text-[11px] leading-tight text-stone-950 line-clamp-2">{item.name}</span>
                       <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">₹{item.price}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500 block">{item.category}</span>
                 </div>

                 {/* Actions — compact icon row */}
                 <div className="px-2 pb-2.5 flex items-center gap-1.5">
                     <Button
                       onClick={() => toggleStock(item)}
                       variant={item.inStock ? 'outline' : 'default'}
                       className="flex-1 rounded-lg font-bold text-[9px] h-7 px-1"
                     >
                        {item.inStock ? 'Out' : 'In Stock'}
                     </Button>
                     <Button 
                       onClick={() => toggleTodaysDish(item)} 
                       variant={item.isTodaysDish ? 'default' : 'outline'} 
                       className={`shrink-0 rounded-lg h-7 w-7 p-0 ${item.isTodaysDish ? 'bg-amber-500 hover:bg-amber-600 text-stone-950' : 'border-amber-300 text-amber-600 hover:bg-amber-50'}`}
                     >
                        <Star className={`w-3 h-3 ${item.isTodaysDish ? 'fill-stone-950' : ''}`} />
                     </Button>
                     <Button onClick={() => { setEditingItem(item); setIsEditorOpen(true); }} variant="secondary" className="shrink-0 rounded-lg h-7 w-7 p-0">
                        <Pencil className="w-3 h-3" />
                     </Button>
                     <Button onClick={() => deleteItem(item.id)} variant="ghost" className="shrink-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3" />
                     </Button>
                 </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ITEM EDITOR DIALOG */}
      <ItemEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={saveItem}
        editingItem={editingItem}
      />
    </div>
  );
}

export default function BookeatoLiveUnifiedPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Bookeato Live Hub - Orders & Menu">
          <BookeatoLiveUnifiedHub />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
