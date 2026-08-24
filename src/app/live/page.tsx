'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  MapPin, ChefHat, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Search, Star, 
  Sparkles, Plus, Minus, Flame, Info, Check, Calendar as CalendarIcon, 
  CheckCircle2, ShoppingBag, Droplets, Utensils, Coffee,
  BadgeCheck, Settings, Tag, X, RefreshCw, AlertCircle, Wallet, User, Phone, Home, ShieldCheck, Mail, Lock, SlidersHorizontal, Edit3
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { LiveSociety, LiveItem, LiveOrder } from '@/types/bookeato-live';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ItemDialog } from '@/components/live/item-dialog';
import { BulkCateringRequest } from '@/components/live/bulk-catering-request';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

const DEFAULT_SALAD_GRAINS = [
  { id: 'chickpeas', name: 'Chickpeas (Kabuli Chana)', price: 30, icon: '🫘' },
  { id: 'lobiya', name: 'Black-Eyed Peas (Lobiya)', price: 30, icon: '🌱' },
  { id: 'moong', name: 'Sprouted Green Moong', price: 25, icon: '🌿' },
  { id: 'paneer', name: 'Organic Paneer Cubes', price: 35, icon: '🧀' },
  { id: 'tofu', name: 'High-Protein Tofu', price: 35, icon: '🟩' },
];

const DEFAULT_SALAD_VEGGIES = [
  { id: 'onions', name: 'Red Onions', price: 15, icon: '🧅' },
  { id: 'tomatoes', name: 'Crisp Tomatoes', price: 15, icon: '🍅' },
  { id: 'cherry_tomatoes', name: 'Cherry Tomatoes', price: 20, icon: '🍒' },
  { id: 'peanuts', name: 'Roasted Peanuts', price: 15, icon: '🥜' },
  { id: 'capsicum', name: 'Capsicum (Bell Pepper)', price: 15, icon: '🫑' },
  { id: 'lettuce', name: 'Fresh Lettuce', price: 15, icon: '🥬' },
  { id: 'cucumber', name: 'Crispy Cucumber', price: 15, icon: '🥒' },
  { id: 'corn', name: 'Sweet Corn', price: 15, icon: '🌽' },
];

const DEFAULT_SALAD_DRESSINGS = [
  { id: 'lemon_mint', name: 'Lemon Mint Vinaigrette', price: 20, icon: '🍋' },
  { id: 'honey_mustard', name: 'Honey Mustard Dressing', price: 20, icon: '🍯' },
  { id: 'olive_herb', name: 'Olive Oil & Herb Dressing', price: 25, icon: '🫒' },
  { id: 'feta', name: 'Crumbled Feta Cheese', price: 25, icon: '🧀' },
];

const DEFAULT_OATS_MILK = [
  { id: 'almond_milk', name: 'Almond Milk', price: 25, icon: '🥛' },
  { id: 'oat_milk', name: 'Oat Milk', price: 25, icon: '🌾' },
  { id: 'full_cream', name: 'Full Cream Dairy Milk', price: 0, icon: '🥛' },
  { id: 'toned_milk', name: 'Skimmed Toned Milk', price: 0, icon: '🥛' },
];

const DEFAULT_OATS_PROTEIN_FLAVORS = [
  { id: 'belgian_chocolate', name: 'Belgian Chocolate Whey (24g Protein)', price: 45, icon: '🍫' },
  { id: 'french_vanilla', name: 'French Vanilla Bean (24g Protein)', price: 45, icon: '🍦' },
  { id: 'wild_strawberry', name: 'Wild Strawberry Cream (24g Protein)', price: 45, icon: '🍓' },
  { id: 'salted_caramel', name: 'Salted Caramel Peanut (24g Protein)', price: 45, icon: '🥜' },
  { id: 'unflavored_whey', name: 'Unflavored Organic Whey (24g Protein)', price: 40, icon: '🌿' },
  { id: 'vegan_plant', name: 'Pea & Rice Vegan Protein (24g Protein)', price: 45, icon: '🌱' },
];

const DEFAULT_OATS_FRUITS = [
  { id: 'strawberries', name: 'Fresh Strawberries', price: 30, icon: '🍓' },
  { id: 'blueberries', name: 'Wild Blueberries', price: 35, icon: '🫐' },
  { id: 'banana', name: 'Banana Slices', price: 20, icon: '🍌' },
  { id: 'apple', name: 'Crisp Apple Cubes', price: 20, icon: '🍎' },
  { id: 'pomegranate', name: 'Pomegranate Seeds', price: 25, icon: '🔴' },
];

const DEFAULT_OATS_NUTS = [
  { id: 'almonds', name: 'Roasted Almond Flakes', price: 20, icon: '🥜' },
  { id: 'walnuts', name: 'Crushed Walnuts', price: 25, icon: '🌰' },
  { id: 'peanut_butter', name: 'Peanut Butter Scoop', price: 25, icon: '🥜' },
  { id: 'dark_choco', name: 'Dark Choco Chips (70%)', price: 20, icon: '🍫' },
];

// FORMATTED MONTH CALENDAR PICKER COMPONENT
function FormattedCalendarPicker({
  selectedDates,
  onToggleDate
}: {
  selectedDates: string[];
  onToggleDate: (dateStr: string) => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentMonthDate(new Date());
  }, []);

  const monthName = currentMonthDate ? currentMonthDate.toLocaleString('default', { month: 'long' }) : 'Current Month';
  const year = currentMonthDate ? currentMonthDate.getFullYear() : 2026;

  const daysInMonth = currentMonthDate ? new Date(year, currentMonthDate.getMonth() + 1, 0).getDate() : 30;
  const firstDayOfWeek = currentMonthDate ? new Date(year, currentMonthDate.getMonth(), 1).getDay() : 0;

  const calendarCells = useMemo(() => {
    if (!currentMonthDate) return [];
    const cells = [];
    const todayNum = new Date().getDate();

    const startOffset = (firstDayOfWeek + 6) % 7;
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dayNum: null, isSelectable: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, currentMonthDate.getMonth(), day);
      const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthNameShort = d.toLocaleDateString('en-US', { month: 'short' });
      const fullLabel = `${dayNameShort}, ${day} ${monthNameShort}`;
      
      const isSelectable = day >= todayNum && day <= (todayNum + 14);
      cells.push({
        dayNum: day,
        fullLabel,
        isSelectable,
        isSelected: selectedDates.includes(fullLabel)
      });
    }

    return cells;
  }, [year, currentMonthDate, daysInMonth, firstDayOfWeek, selectedDates]);

  if (!isMounted) {
    return (
      <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 text-center text-xs text-stone-500 font-bold">
        Loading Calendar...
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/60 space-y-2.5 text-xs text-left">
      <div className="flex items-center justify-between font-extrabold text-stone-900">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-orange-600" />
          <span className="text-xs sm:text-sm font-black">{monthName} {year}</span>
        </div>
        <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-orange-200 font-black text-orange-950 shadow-xs">
          {selectedDates.length} Days Scheduled
        </span>
      </div>

      <div className="grid grid-cols-7 text-center font-black text-[10px] text-stone-500 uppercase tracking-wider">
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
        <span>Su</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          if (!cell.dayNum) {
            return <div key={idx} className="h-9 rounded-lg bg-stone-100/50" />;
          }

          if (!cell.isSelectable) {
            return (
              <div 
                key={idx} 
                className="h-9 rounded-lg bg-stone-100 text-stone-300 flex items-center justify-center font-bold text-xs cursor-not-allowed"
              >
                {cell.dayNum}
              </div>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => cell.fullLabel && onToggleDate(cell.fullLabel)}
              className={`h-9 rounded-xl border text-center transition-all flex flex-col items-center justify-center p-0.5 ${
                cell.isSelected ? 'bg-orange-500 text-stone-950 border-orange-600 shadow-sm font-black' : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 font-semibold'
              }`}
            >
              <span className="text-xs font-black">{cell.dayNum}</span>
              <span className="text-[8px] uppercase tracking-tighter leading-none opacity-90">
                {cell.isSelected ? 'Deliver' : 'Skip'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookeatoLiveLanding() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'todays-special' | 'subscription-plan'>('subscription-plan');

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [todaysDish, setTodaysDish] = useState<LiveItem>(DEFAULT_INDORI_POHA);
  const [quantity, setQuantity] = useState(1);
  const [selectedItem, setSelectedItem] = useState<LiveItem | null>(null);

  // Customer Session & Wallet Balance State
  const [customer, setCustomer] = useState<{name: string, phone: string, address?: string, pincode?: string, city?: string, walletBalance: number} | null>(null);
  
  // Modals State
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [activeCalendarItem, setActiveCalendarItem] = useState<'coconut' | 'salad' | 'oats'>('coconut');
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment'>('info');
  
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Info Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPincode, setCustPincode] = useState('');
  const [custCity, setCustCity] = useState('');

  // Collapsible Customization Dropdowns Open States
  const [isSaladCustomOpen, setIsSaladCustomOpen] = useState(true);
  const [isOatsCustomOpen, setIsOatsCustomOpen] = useState(true);

  // Pending Order Data
  const [pendingOrder, setPendingOrder] = useState<{
    title: string;
    price: number;
    details: string;
    dates: string[];
    imgUrl: string;
  } | null>(null);

  // Dynamic Upcoming 14 Days
  const upcoming14Days = useMemo(() => {
    if (!isMounted) return [];
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const fullLabel = `${dayName}, ${dayNum} ${monthName}`;
      days.push({ id: fullLabel, dayName, dayNum, monthName, fullLabel });
    }
    return days;
  }, [isMounted]);

  // Prices
  const [saladGrains, setSaladGrains] = useState(DEFAULT_SALAD_GRAINS);
  const [saladVeggies, setSaladVeggies] = useState(DEFAULT_SALAD_VEGGIES);
  const [saladDressings, setSaladDressings] = useState(DEFAULT_SALAD_DRESSINGS);
  const [oatsMilk, setOatsMilk] = useState(DEFAULT_OATS_MILK);
  const [oatsProteinFlavors, setOatsProteinFlavors] = useState(DEFAULT_OATS_PROTEIN_FLAVORS);
  const [oatsFruits, setOatsFruits] = useState(DEFAULT_OATS_FRUITS);
  const [oatsNuts, setOatsNuts] = useState(DEFAULT_OATS_NUTS);
  
  const [coconutPrices, setCoconutPrices] = useState({ '500ml': 79, '1ltr': 149 });
  const [saladBasePrice, setSaladBasePrice] = useState(99);
  const [oatsBasePrice, setOatsBasePrice] = useState(129);

  // CUSTOMIZATION SELECTIONS & CALENDAR DATES
  const [coconutSize, setCoconutSize] = useState<'500ml' | '1ltr'>('500ml');
  const [coconutCustomDates, setCoconutCustomDates] = useState<string[]>([]);
  const [saladCustomDates, setSaladCustomDates] = useState<string[]>([]);
  const [selectedGrains, setSelectedGrains] = useState<string[]>(['chickpeas', 'lobiya']);
  const [selectedVeggies, setSelectedVeggies] = useState<string[]>(['onions', 'tomatoes', 'peanuts', 'capsicum', 'lettuce']);
  const [selectedDressings, setSelectedDressings] = useState<string[]>(['lemon_mint']);

  const [oatsCustomDates, setOatsCustomDates] = useState<string[]>([]);
  const [selectedMilk, setSelectedMilk] = useState<string>('almond_milk');
  const [selectedProteinFlavor, setSelectedProteinFlavor] = useState<string>('belgian_chocolate');
  const [selectedFruits, setSelectedFruits] = useState<string[]>(['strawberries', 'banana']);
  const [selectedNuts, setSelectedNuts] = useState<string[]>(['almonds', 'peanut_butter']);

  useEffect(() => {
    if (upcoming14Days.length > 0) {
      const defaultActive = upcoming14Days.slice(0, 5).map(d => d.id);
      setCoconutCustomDates(defaultActive);
      setSaladCustomDates(defaultActive);
      setOatsCustomDates(defaultActive);
    }
  }, [upcoming14Days]);

  const firestore = useFirestore();

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('bookeato_live_customer');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setCustomer({
          ...parsed,
          walletBalance: parsed.walletBalance || 2500
        });
        if (parsed.name) setCustName(parsed.name);
        if (parsed.phone) setCustPhone(parsed.phone);
        if (parsed.address) setCustAddress(parsed.address);
        if (parsed.pincode) setCustPincode(parsed.pincode);
        if (parsed.city) setCustCity(parsed.city);
      }
    } catch (e) {}
  }, []);

  // Real-Time Admin Sync with LiveMenuManager
  useEffect(() => {
    const syncPrices = () => {
      try {
        const savedAdminPrices = localStorage.getItem('bookeato_subscription_prices');
        if (savedAdminPrices) {
          const parsed = JSON.parse(savedAdminPrices);
          if (parsed.coconutPrices) setCoconutPrices(parsed.coconutPrices);
          if (parsed.saladBasePrice) setSaladBasePrice(parsed.saladBasePrice);
          if (parsed.oatsBasePrice) setOatsBasePrice(parsed.oatsBasePrice);
          if (parsed.saladGrains) setSaladGrains(parsed.saladGrains);
          if (parsed.saladVeggies) setSaladVeggies(parsed.saladVeggies);
          if (parsed.saladDressings) setSaladDressings(parsed.saladDressings);
          if (parsed.oatsMilk) setOatsMilk(parsed.oatsMilk);
          if (parsed.oatsProteinFlavors) setOatsProteinFlavors(parsed.oatsProteinFlavors);
          if (parsed.oatsFruits) setOatsFruits(parsed.oatsFruits);
          if (parsed.oatsNuts) setOatsNuts(parsed.oatsNuts);
          if (parsed.subscriptionImages) setSubscriptionImages(prev => ({ ...prev, ...parsed.subscriptionImages }));
        }

        const cachedItems = localStorage.getItem('bookeato_live_items_override');
        if (cachedItems) {
          const items = JSON.parse(cachedItems) as LiveItem[];
          const featured = items.find(i => i.isTodaysDish) || items[0];
          if (featured) setTodaysDish(featured);
        }
      } catch (e) {}
    };

    syncPrices();
    window.addEventListener('storage', syncPrices);
    return () => window.removeEventListener('storage', syncPrices);
  }, []);

  useEffect(() => {
    if (!firestore) return;
    let unsubscribe: (() => void) | null = null;
    try {
      const q = collection(firestore, 'liveItems');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedItems: LiveItem[] = [];
        snapshot.forEach(docSnap => {
          fetchedItems.push({ ...docSnap.data(), id: docSnap.id } as LiveItem);
        });

        if (fetchedItems.length > 0) {
          const featured = fetchedItems.find(i => i.isTodaysDish) || fetchedItems[0];
          if (featured) setTodaysDish(featured);
          try {
            localStorage.setItem('bookeato_live_items_override', JSON.stringify(fetchedItems));
          } catch (e) {}
        }
      }, (_err) => {
        // Silent — falls back to localStorage cache when Firestore is unavailable
      });
    } catch (_e) {}
    return () => { if (unsubscribe) unsubscribe(); };
  }, [firestore]);

  // Dynamic Price Calculations
  const currentCoconutPrice = coconutPrices[coconutSize] || (coconutSize === '500ml' ? 79 : 149);

  const saladPrice = useMemo(() => {
    const grainsCost = selectedGrains.reduce((sum, id) => sum + (saladGrains.find(g => g.id === id)?.price || 0), 0);
    const veggiesCost = selectedVeggies.reduce((sum, id) => sum + (saladVeggies.find(v => v.id === id)?.price || 0), 0);
    const dressingsCost = selectedDressings.reduce((sum, id) => sum + (saladDressings.find(d => d.id === id)?.price || 0), 0);
    return saladBasePrice + grainsCost + veggiesCost + dressingsCost;
  }, [selectedGrains, selectedVeggies, selectedDressings, saladBasePrice, saladGrains, saladVeggies, saladDressings]);

  const oatsPrice = useMemo(() => {
    const milkCost = oatsMilk.find(m => m.id === selectedMilk)?.price || 0;
    const proteinCost = oatsProteinFlavors.find(p => p.id === selectedProteinFlavor)?.price || 0;
    const fruitsCost = selectedFruits.reduce((sum, id) => sum + (oatsFruits.find(f => f.id === id)?.price || 0), 0);
    const nutsCost = selectedNuts.reduce((sum, id) => sum + (oatsNuts.find(n => n.id === id)?.price || 0), 0);
    return oatsBasePrice + milkCost + proteinCost + fruitsCost + nutsCost;
  }, [selectedMilk, selectedProteinFlavor, selectedFruits, selectedNuts, oatsBasePrice, oatsMilk, oatsProteinFlavors, oatsFruits, oatsNuts]);

  const toggleArrayItem = (arr: string[], id: string, setArr: React.Dispatch<React.SetStateAction<string[]>>) => {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOpenCalendar = (itemKey: 'coconut' | 'salad' | 'oats') => {
    setActiveCalendarItem(itemKey);
    setIsCalendarPickerOpen(true);
  };

  // LOGIC FOR SUBSCRIBE CLICK
  const handleInitiateSubscribe = (itemTitle: string, price: number, details: string, dates: string[], imgUrl: string) => {
    const orderData = { title: itemTitle, price, details, dates, imgUrl };
    setPendingOrder(orderData);

    // If customer is already logged in with saved address
    if (customer && customer.name && customer.address) {
      setCheckoutStep('payment');
    } else {
      setCheckoutStep('info');
    }

    setIsAddressModalOpen(true);
  };

  // SAVE NEW CUSTOMER DETAILS AND PROCEED TO PAYMENT
  const handleSaveInfoAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || !custAddress || !custPincode) return;

    const newCustomer = {
      name: custName,
      phone: custPhone,
      address: custAddress,
      pincode: custPincode,
      city: custCity || 'Hyderabad',
      walletBalance: customer?.walletBalance || 2500
    };

    localStorage.setItem('bookeato_live_customer', JSON.stringify(newCustomer));
    setCustomer(newCustomer);
    setIsEditingAddress(false);
    setCheckoutStep('payment'); // Take customer directly to payment step!
  };

  // CONFIRM SUBSCRIPTION AND DEDUCT WALLET BALANCE
  const handleFinalPaymentConfirm = async () => {
    if (!pendingOrder || !customer) return;

    setIsSubmitting(true);

    const totalDays = pendingOrder.dates.length || 1;
    const grandTotal = pendingOrder.price * totalDays;
    const previousBalance = customer.walletBalance || 2500;
    const updatedBalance = Math.max(0, previousBalance - grandTotal);

    const updatedCustomer = {
      ...customer,
      walletBalance: updatedBalance
    };

    localStorage.setItem('bookeato_live_customer', JSON.stringify(updatedCustomer));
    setCustomer(updatedCustomer);

    if (firestore) {
      try {
        await addDoc(collection(firestore, 'liveOrders'), {
          customer: {
            name: customer.name,
            phone: customer.phone,
            address: `${customer.address}, Pincode: ${customer.pincode}, ${customer.city || 'Hyderabad'}`
          },
          items: [{
            name: pendingOrder.title,
            price: pendingOrder.price,
            quantity: totalDays,
            status: "Active Subscription"
          }],
          status: "Active Subscription",
          totalAmount: grandTotal,
          createdAt: new Date().toISOString(),
          deliveryDates: pendingOrder.dates
        });
      } catch (err) {
        console.error("Firestore order log error", err);
      }
    }

    setIsSubmitting(false);
    setIsOrderSuccess(true);
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-100 items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-2"></div>
        <span className="text-xs font-bold text-stone-600">Loading Bookeato Live...</span>
      </div>
    );
  }

  return (
    // LIGHT THEME BACKGROUND WITH ORANGE ACCENTS
    <div className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
      {/* Header */}
      <header className="px-4 md:px-12 py-3 flex justify-between items-center bg-stone-950 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
         <div className="flex items-center gap-2.5">
            <Link href="/" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors mr-0.5">
               <ChevronLeft className="w-4 h-4 text-stone-300" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
               <ChefHat className="w-4.5 h-4.5 text-stone-950" />
            </div>
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white">
               bookeato <span className="text-orange-400 font-['Caveat'] text-2xl font-normal relative top-0.5">Live</span>
            </h1>
         </div>

         {/* Customer Session & Wallet Balance Badge in Header */}
         <div className="flex items-center gap-2">
            {customer ? (
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-stone-900 border border-stone-700 px-3 py-1.5 rounded-full">
                     <Wallet className="w-4 h-4 text-orange-400" />
                     <div className="text-right leading-tight">
                        <span className="text-[9px] text-stone-400 uppercase font-extrabold block">{customer.name.split(' ')[0]}'s Wallet</span>
                        <span className="text-xs font-black text-orange-400">₹{customer.walletBalance.toLocaleString('en-IN')}</span>
                     </div>
                  </div>
                  <button 
                     onClick={() => {
                        localStorage.removeItem('bookeato_live_customer');
                        setCustomer(null);
                     }}
                     className="text-[10px] font-bold text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-800"
                     title="Logout"
                  >
                     Logout
                  </button>
               </div>
            ) : (
               <Button 
                  onClick={() => {
                     setCheckoutStep('info');
                     setIsAddressModalOpen(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black text-xs rounded-full px-4 h-8 shadow-sm"
               >
                  <User className="w-3.5 h-3.5 mr-1" /> Login / Sign Up
               </Button>
            )}
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-2.5 sm:px-6 py-4 sm:py-8 relative">
         <div className="max-w-4xl w-full text-center space-y-4 sm:space-y-6">
            {/* Main Page Header */}
            <div className="space-y-1">
               <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200 inline-block">
                  ⚡ Organic Health & Kitchen Bar
               </span>
               <h2 className="text-2xl sm:text-5xl font-black text-stone-950 tracking-tight">
                  Fresh Daily <span className="text-orange-600">Health Subscriptions</span>
               </h2>
               <p className="text-xs sm:text-base text-stone-600 font-semibold max-w-xl mx-auto">
                  Click calendar icon to pick dates, open drop-downs to customize ingredients, then subscribe!
               </p>
            </div>

            {/* 2 MAIN OPTIONS TABS */}
            <div className="flex justify-center p-1 bg-white border border-stone-200 rounded-xl sm:rounded-full max-w-md mx-auto shadow-sm">
               <button
                  onClick={() => setActiveTab('subscription-plan')}
                  className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                     activeTab === 'subscription-plan'
                        ? 'bg-orange-500 text-stone-950 shadow-md'
                        : 'text-stone-500 hover:text-stone-900'
                  }`}
               >
                  <Sparkles className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                  Subscription Plans 🥗
               </button>
               <button
                  onClick={() => setActiveTab('todays-special')}
                  className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                     activeTab === 'todays-special'
                        ? 'bg-orange-500 text-stone-950 shadow-md'
                        : 'text-stone-500 hover:text-stone-900'
                  }`}
               >
                  <Flame className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                  Today's Special Dish
               </button>
            </div>

            {/* 🌟 REAL-TIME LIVE KITCHEN COUNTER SUMMARY BAR 🌟 */}
            <div className="bg-stone-950 text-white rounded-2xl p-4 border border-orange-500/50 shadow-lg text-left space-y-3">
               <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                     <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                     </span>
                     <span className="text-xs font-black uppercase tracking-wider text-orange-400">⚡ Live Counter Breakdown</span>
                  </div>
                  <Badge className="bg-orange-500 text-stone-950 font-black text-[9.5px]">Admin Prices Synced</Badge>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-medium">
                  {/* Coconut Water Live Counter */}
                  <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
                     <span className="font-extrabold text-white text-xs block">🥥 Tender Coconut Water</span>
                     <p className="text-[11px] text-stone-300">{coconutSize} Glass Bottle @ ₹{currentCoconutPrice}/bottle</p>
                     <span className="text-[10px] text-orange-400 font-bold block">📅 {coconutCustomDates.length} Active Delivery Days</span>
                  </div>

                  {/* Salad Box Live Counter */}
                  <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
                     <span className="font-extrabold text-white text-xs block">🥗 Organic Salad Box</span>
                     <p className="text-[11px] text-stone-300">Base ₹{saladBasePrice} + {selectedGrains.length} Proteins + {selectedVeggies.length} Veggies</p>
                     <span className="text-[10px] text-orange-400 font-bold block">Rate: ₹{saladPrice}/meal • {saladCustomDates.length} Days</span>
                  </div>

                  {/* Oats Jar Live Counter */}
                  <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
                     <span className="font-extrabold text-white text-xs block">🫙 Overnight Oats Jar</span>
                     <p className="text-[11px] text-stone-300">Base ₹{oatsBasePrice} + {oatsProteinFlavors.find(p => p.id === selectedProteinFlavor)?.name.split(' ')[0]} Whey (24g)</p>
                     <span className="text-[10px] text-orange-400 font-bold block">Rate: ₹{oatsPrice}/jar • {oatsCustomDates.length} Days</span>
                  </div>
               </div>
            </div>

            {/* TAB 1: SUBSCRIPTION PLAN SECTION */}
            {activeTab === 'subscription-plan' && (
               <div className="space-y-4 sm:space-y-6 text-left animate-in fade-in duration-300">
                  <div className="bg-gradient-to-r from-stone-900 via-orange-950 to-stone-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-white shadow-md space-y-0.5 text-center border border-orange-900/50">
                     <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">🌿 Daily Morning Delivery</span>
                     <h3 className="text-lg sm:text-2xl font-black">Calendar Date Picker & Customization Dropdowns</h3>
                  </div>

                  {/* ITEM 1: FRESH TENDER COCONUT WATER */}
                  <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 p-3.5 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
                     <div className="flex flex-row items-center sm:items-start justify-between border-b border-stone-100 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                           <div className="relative w-20 h-20 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden border border-orange-200 shrink-0 shadow-sm bg-orange-50">
                              <Image 
                                 src="/live_menu/bookeato_coconut_glass_bottle.jpg" 
                                 alt="Bookeato Natural Coconut Water Glass Bottle" 
                                 fill 
                                 className="object-cover" 
                              />
                           </div>
                           <div className="space-y-0.5">
                              <Badge className="bg-orange-100 text-orange-950 font-black text-[9px] uppercase border border-orange-300">Glass Bottle</Badge>
                              <h3 className="text-base sm:text-2xl font-black text-stone-900 leading-tight">Fresh Tender Coconut Water</h3>
                              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">Pure raw tender coconut water in glass bottle with Bookeato sticker label.</p>
                           </div>
                        </div>

                        {/* REAL TIME PRICE DISPLAY */}
                        <div className="text-right shrink-0">
                           <span className="text-[9px] uppercase font-bold text-stone-400 block">Rate / Bottle</span>
                           <span className="text-xl sm:text-3xl font-black text-orange-600">₹{currentCoconutPrice}</span>
                        </div>
                     </div>

                     <div className="space-y-3 text-xs">
                        {/* CLICKABLE CALENDAR ICON BUTTON */}
                        <button
                           onClick={() => handleOpenCalendar('coconut')}
                           className="w-full p-3 bg-orange-50 border-2 border-orange-400 hover:border-orange-500 rounded-2xl flex items-center justify-between transition-all group shadow-sm"
                        >
                           <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-orange-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                                 <CalendarIcon className="w-4 h-4 text-stone-950" />
                              </div>
                              <div className="text-left">
                                 <span className="font-black text-xs text-orange-950 block">📅 Delivery Calendar Dates</span>
                                 <span className="text-[11px] text-orange-800 font-semibold">{coconutCustomDates.length} Active Days Selected (Click to change dates)</span>
                              </div>
                           </div>
                           <span className="bg-orange-500 text-stone-950 font-black text-[10px] px-3 py-1 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                              Open Calendar 📅
                           </span>
                        </button>

                        {/* Bottle Size */}
                        <div className="space-y-1">
                           <label className="text-[11px] font-bold uppercase text-stone-700 block">Bottle Size Choice</label>
                           <div className="grid grid-cols-2 gap-2">
                              <button
                                 onClick={() => setCoconutSize('500ml')}
                                 className={`p-2 rounded-xl border-2 font-black text-xs flex items-center justify-between transition-all ${
                                    coconutSize === '500ml'
                                       ? 'border-orange-500 bg-orange-50 text-orange-950'
                                       : 'border-stone-200 bg-stone-50 text-stone-600'
                                 }`}
                              >
                                 <span>500 ml</span>
                                 <span className="text-orange-600 font-black">₹{coconutPrices['500ml']}</span>
                              </button>
                              <button
                                 onClick={() => setCoconutSize('1ltr')}
                                 className={`p-2 rounded-xl border-2 font-black text-xs flex items-center justify-between transition-all ${
                                    coconutSize === '1ltr'
                                       ? 'border-orange-500 bg-orange-50 text-orange-950'
                                       : 'border-stone-200 bg-stone-50 text-stone-600'
                                 }`}
                              >
                                 <span>1 Litre</span>
                                 <span className="text-orange-600 font-black">₹{coconutPrices['1ltr']}</span>
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center flex-wrap gap-2">
                        <span className="text-[11px] text-stone-500 font-semibold">Total: ₹{currentCoconutPrice * coconutCustomDates.length} ({coconutCustomDates.length} Deliveries)</span>
                        <Button 
                           onClick={() => handleInitiateSubscribe(`Fresh Tender Coconut Water (${coconutSize})`, currentCoconutPrice, `${coconutCustomDates.length} Deliveries`, coconutCustomDates, "/live_menu/bookeato_coconut_glass_bottle.jpg")}
                           className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl px-5 py-2.5 h-10 text-xs shadow-md"
                        >
                           Subscribe Now (₹{currentCoconutPrice * coconutCustomDates.length})
                        </Button>
                     </div>
                  </div>

                  {/* ITEM 2: CUSTOMIZABLE SALAD BOX */}
                  <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 p-3.5 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
                     <div className="flex flex-row items-center sm:items-start justify-between border-b border-stone-100 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                           <div className="relative w-20 h-20 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden border border-amber-200 shrink-0 shadow-sm bg-amber-50">
                              <Image 
                                 src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop" 
                                 alt="Customizable Organic Salad Box" 
                                 fill 
                                 className="object-cover" 
                              />
                           </div>
                           <div className="space-y-0.5">
                              <Badge className="bg-amber-100 text-amber-950 font-black text-[9px] uppercase border border-amber-300">Base Price: ₹{saladBasePrice}</Badge>
                              <h3 className="text-base sm:text-2xl font-black text-stone-900 leading-tight">Customizable Salad Box</h3>
                              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">Select dates via calendar icon, expand dropdowns to customize ingredients.</p>
                           </div>
                        </div>

                        <div className="text-right shrink-0 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                           <span className="text-[9px] uppercase font-black text-orange-600 block">Price / Meal</span>
                           <span className="text-xl sm:text-3xl font-black text-orange-950 transition-all">₹{saladPrice}</span>
                        </div>
                     </div>

                     {/* CLICKABLE CALENDAR ICON BUTTON FOR SALAD BOX */}
                     <button
                        onClick={() => handleOpenCalendar('salad')}
                        className="w-full p-3 bg-orange-50 border-2 border-orange-400 hover:border-orange-500 rounded-2xl flex items-center justify-between transition-all group shadow-sm"
                     >
                        <div className="flex items-center gap-2.5">
                           <div className="w-8 h-8 rounded-xl bg-orange-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                              <CalendarIcon className="w-4 h-4 text-stone-950" />
                           </div>
                           <div className="text-left">
                              <span className="font-black text-xs text-orange-950 block">📅 Delivery Calendar Dates</span>
                              <span className="text-[11px] text-orange-800 font-semibold">{saladCustomDates.length} Active Days Selected (Click to change dates)</span>
                           </div>
                        </div>
                        <span className="bg-orange-500 text-stone-950 font-black text-[10px] px-3 py-1 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                           Open Calendar 📅
                        </span>
                     </button>

                     {/* COLLAPSIBLE DROPDOWN CUSTOMIZATION OPTIONS */}
                     <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
                        <button
                           onClick={() => setIsSaladCustomOpen(!isSaladCustomOpen)}
                           className="w-full p-3 bg-stone-100 hover:bg-stone-200/80 font-black text-xs text-stone-900 flex items-center justify-between border-b border-stone-200 transition-colors"
                        >
                           <span className="flex items-center gap-2">
                              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                              ⚙️ Customize Ingredients (Proteins, Veggies & Dressings)
                           </span>
                           <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSaladCustomOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSaladCustomOpen && (
                           <div className="p-3.5 space-y-3 animate-in fade-in duration-200">
                              {/* Grains Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-amber-900 block">1. Proteins & Grains (Click to Add)</label>
                                 <div className="space-y-1.5">
                                    {saladGrains.map(g => {
                                       const isSelected = selectedGrains.includes(g.id);
                                       return (
                                          <div 
                                             key={g.id}
                                             className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                                isSelected ? 'border-amber-400 bg-amber-50/70' : 'border-stone-200 bg-white'
                                             }`}
                                          >
                                             <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                                <span>{g.icon}</span> <span>{g.name}</span>
                                             </span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                                   +₹{g.price}
                                                </span>
                                                <button
                                                   onClick={() => toggleArrayItem(selectedGrains, g.id, setSelectedGrains)}
                                                   className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                      isSelected
                                                         ? 'bg-orange-500 text-stone-950 shadow-sm'
                                                         : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                   }`}
                                                >
                                                   {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>

                              {/* Veggies Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-amber-900 block">2. Veggies & Crunch (Click to Add)</label>
                                 <div className="space-y-1.5">
                                    {saladVeggies.map(v => {
                                       const isSelected = selectedVeggies.includes(v.id);
                                       return (
                                          <div 
                                             key={v.id}
                                             className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                                isSelected ? 'border-amber-400 bg-amber-50/70' : 'border-stone-200 bg-white'
                                             }`}
                                          >
                                             <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                                <span>{v.icon}</span> <span>{v.name}</span>
                                             </span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                                   +₹{v.price}
                                                </span>
                                                <button
                                                   onClick={() => toggleArrayItem(selectedVeggies, v.id, setSelectedVeggies)}
                                                   className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                      isSelected
                                                         ? 'bg-orange-500 text-stone-950 shadow-sm'
                                                         : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                   }`}
                                                >
                                                   {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>

                              {/* Dressings Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-amber-900 block">3. House Dressings (Click to Add)</label>
                                 <div className="space-y-1.5">
                                    {saladDressings.map(d => {
                                       const isSelected = selectedDressings.includes(d.id);
                                       return (
                                          <div 
                                             key={d.id}
                                             className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                                isSelected ? 'border-amber-400 bg-amber-50/70' : 'border-stone-200 bg-white'
                                             }`}
                                          >
                                             <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                                <span>{d.icon}</span> <span>{d.name}</span>
                                             </span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                                   +₹{d.price}
                                                </span>
                                                <button
                                                   onClick={() => toggleArrayItem(selectedDressings, d.id, setSelectedDressings)}
                                                   className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                      isSelected
                                                         ? 'bg-orange-500 text-stone-950 shadow-sm'
                                                         : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                   }`}
                                                >
                                                   {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="pt-3 border-t border-stone-100 flex justify-between items-center flex-wrap gap-2">
                        <span className="text-xs font-black text-stone-900">
                           Meal Rate: <span className="text-orange-600">₹{saladPrice}</span>
                        </span>
                        <Button 
                           onClick={() => handleInitiateSubscribe(`Customized Organic Salad Box`, saladPrice, `${saladCustomDates.length} Custom Meals`, saladCustomDates, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop")}
                           className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl px-5 py-2.5 h-10 text-xs shadow-md"
                        >
                           Subscribe Salad (₹{saladPrice * saladCustomDates.length})
                        </Button>
                     </div>
                  </div>

                  {/* ITEM 3: OVERNIGHT PROTEIN OATS MUG */}
                  <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 p-3.5 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
                     <div className="flex flex-row items-center sm:items-start justify-between border-b border-stone-100 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                           <div className="relative w-20 h-20 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden border border-purple-200 shrink-0 shadow-sm bg-purple-50">
                              <Image 
                                 src="/live_menu/bookeato_oats_glass_jar.jpg" 
                                 alt="Bookeato Overnight Protein Oats Glass Jar" 
                                 fill 
                                 className="object-cover" 
                              />
                           </div>
                           <div className="space-y-0.5">
                              <Badge className="bg-purple-100 text-purple-950 font-black text-[9px] uppercase border border-purple-300">Base Price: ₹{oatsBasePrice}</Badge>
                              <h3 className="text-base sm:text-2xl font-black text-stone-900 leading-tight">Overnight Protein Oats Jar</h3>
                              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">Slow-soaked oats with 24g protein powder & superfood toppings.</p>
                           </div>
                        </div>

                        <div className="text-right shrink-0 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
                           <span className="text-[9px] uppercase font-black text-purple-900 block">Price / Jar</span>
                           <span className="text-xl sm:text-3xl font-black text-purple-950 transition-all">₹{oatsPrice}</span>
                        </div>
                     </div>

                     {/* CLICKABLE CALENDAR ICON BUTTON FOR OATS JAR */}
                     <button
                        onClick={() => handleOpenCalendar('oats')}
                        className="w-full p-3 bg-purple-50 border-2 border-purple-400 hover:border-purple-500 rounded-2xl flex items-center justify-between transition-all group shadow-sm"
                     >
                        <div className="flex items-center gap-2.5">
                           <div className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                              <CalendarIcon className="w-4 h-4 text-white" />
                           </div>
                           <div className="text-left">
                              <span className="font-black text-xs text-purple-950 block">📅 Delivery Calendar Dates</span>
                              <span className="text-[11px] text-purple-800 font-semibold">{oatsCustomDates.length} Active Days Selected (Click to change dates)</span>
                           </div>
                        </div>
                        <span className="bg-purple-900 text-white font-black text-[10px] px-3 py-1 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                           Open Calendar 📅
                        </span>
                     </button>

                     {/* COLLAPSIBLE DROPDOWN CUSTOMIZATION OPTIONS FOR OATS JAR */}
                     <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
                        <button
                           onClick={() => setIsOatsCustomOpen(!isOatsCustomOpen)}
                           className="w-full p-3 bg-purple-50/60 hover:bg-purple-100/80 font-black text-xs text-purple-950 flex items-center justify-between border-b border-purple-200 transition-colors"
                        >
                           <span className="flex items-center gap-2">
                              <SlidersHorizontal className="w-4 h-4 text-purple-800" />
                              ⚙️ Customize Oats Jar (Protein Flavors, Milk, Fruits & Nuts)
                           </span>
                           <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOatsCustomOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOatsCustomOpen && (
                           <div className="p-3.5 space-y-3 animate-in fade-in duration-200">
                              {/* Protein Flavor Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-purple-900 block flex items-center gap-1">
                                    <span>⚡ 1. Select 24g Protein Powder Flavor</span>
                                 </label>
                                 <div className="space-y-1.5">
                                    {oatsProteinFlavors.map(p => (
                                       <div 
                                          key={p.id}
                                          className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                             selectedProteinFlavor === p.id ? 'border-purple-600 bg-purple-50' : 'border-stone-200 bg-white'
                                          }`}
                                       >
                                          <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                             <span>{p.icon}</span> <span>{p.name}</span>
                                          </span>
                                          <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                                +₹{p.price}
                                             </span>
                                             <button
                                                onClick={() => setSelectedProteinFlavor(p.id)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                   selectedProteinFlavor === p.id
                                                      ? 'bg-purple-900 text-white shadow-sm'
                                                      : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                }`}
                                             >
                                                {selectedProteinFlavor === p.id ? '✓ Selected' : 'Select'}
                                             </button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Milk Base Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-purple-900 block">2. Select Milk Base</label>
                                 <div className="space-y-1.5">
                                    {oatsMilk.map(m => (
                                       <div 
                                          key={m.id}
                                          className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                             selectedMilk === m.id ? 'border-purple-500 bg-purple-50/70' : 'border-stone-200 bg-white'
                                          }`}
                                       >
                                          <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                             <span>{m.icon}</span> <span>{m.name}</span>
                                          </span>
                                          <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                                {m.price > 0 ? `+₹${m.price}` : 'Included'}
                                             </span>
                                             <button
                                                onClick={() => setSelectedMilk(m.id)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                   selectedMilk === m.id
                                                      ? 'bg-purple-900 text-white shadow-sm'
                                                      : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                }`}
                                             >
                                                {selectedMilk === m.id ? '✓ Selected' : 'Select'}
                                             </button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Fruits Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-purple-900 block">3. Add Fresh Fruits (Click to Add)</label>
                                 <div className="space-y-1.5">
                                    {oatsFruits.map(f => {
                                       const isSelected = selectedFruits.includes(f.id);
                                       return (
                                          <div 
                                             key={f.id}
                                             className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                                isSelected ? 'border-purple-500 bg-purple-50/70' : 'border-stone-200 bg-white'
                                             }`}
                                          >
                                             <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                                <span>{f.icon}</span> <span>{f.name}</span>
                                             </span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                                   +₹{f.price}
                                                </span>
                                                <button
                                                   onClick={() => toggleArrayItem(selectedFruits, f.id, setSelectedFruits)}
                                                   className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                      isSelected
                                                         ? 'bg-purple-900 text-white shadow-sm'
                                                         : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                   }`}
                                                >
                                                   {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>

                              {/* Nuts & Toppings Dropdown */}
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-black uppercase text-purple-900 block">4. Nuts & Butter Toppings (Click to Add)</label>
                                 <div className="space-y-1.5">
                                    {oatsNuts.map(n => {
                                       const isSelected = selectedNuts.includes(n.id);
                                       return (
                                          <div 
                                             key={n.id}
                                             className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                                isSelected ? 'border-purple-500 bg-purple-50/70' : 'border-stone-200 bg-white'
                                             }`}
                                          >
                                             <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                                                <span>{n.icon}</span> <span>{n.name}</span>
                                             </span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                                   +₹{n.price}
                                                </span>
                                                <button
                                                   onClick={() => toggleArrayItem(selectedNuts, n.id, setSelectedNuts)}
                                                   className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                      isSelected
                                                         ? 'bg-purple-900 text-white shadow-sm'
                                                         : 'bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200'
                                                   }`}
                                                >
                                                   {isSelected ? '✓ Added' : '+ Add'}
                                                </button>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="pt-3 border-t border-stone-100 flex justify-between items-center flex-wrap gap-2">
                        <div className="text-xs font-black text-purple-950">
                           Jar Rate: <span className="text-purple-900">₹{oatsPrice}</span>
                        </div>
                        <Button 
                           onClick={() => handleInitiateSubscribe(`Overnight Protein Oats Jar`, oatsPrice, `${oatsCustomDates.length} Custom Jars`, oatsCustomDates, "/live_menu/bookeato_oats_glass_jar.jpg")}
                           className="bg-purple-900 hover:bg-purple-950 text-white font-black rounded-xl px-5 py-2.5 h-10 text-xs shadow-md"
                        >
                           Subscribe Oats Jar (₹{oatsPrice * oatsCustomDates.length})
                        </Button>
                     </div>
                  </div>
               </div>
            )}

            {/* TAB 2: TODAY'S SPECIAL DISH */}
            {activeTab === 'todays-special' && (
               <div className="space-y-6 text-left animate-in fade-in duration-300">
                  <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-stone-200 p-3.5 sm:p-6 shadow-md relative overflow-hidden transition-all duration-300 group">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="bg-amber-400 text-stone-950 font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
                              <Star className="w-3 h-3 fill-stone-950" /> Today's Special
                           </span>
                        </div>
                        <button 
                           onClick={() => setSelectedItem(todaysDish)} 
                           className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                        >
                           <Info className="w-4 h-4 text-stone-700" />
                        </button>
                     </div>

                     <div className="flex flex-row items-center gap-4">
                        <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-2xl overflow-hidden relative shrink-0 bg-stone-100 border border-stone-200 shadow-inner flex items-center justify-center">
                           {todaysDish.imageUrl && (todaysDish.imageUrl.startsWith('/') || todaysDish.imageUrl.startsWith('http') || todaysDish.imageUrl.startsWith('data:')) ? (
                              <img 
                                 src={todaysDish.imageUrl} 
                                 alt={todaysDish.name} 
                                 className="w-full h-full object-cover" 
                              />
                           ) : (
                              <ChefHat className="w-10 h-10 text-amber-500" />
                           )}
                        </div>

                        <div className="flex-1 space-y-2 w-full">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h3 className="text-base sm:text-2xl font-black text-stone-950 leading-tight">
                                    {todaysDish.name}
                                 </h3>
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mt-0.5">
                                    {todaysDish.category}
                                 </p>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-lg sm:text-2xl font-black text-orange-950">₹{todaysDish.price}</span>
                              </div>
                           </div>

                           <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-full p-0.5">
                                    <button 
                                       onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                                       disabled={quantity <= 1}
                                       className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-stone-800"
                                    >
                                       <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-black text-stone-950 w-5 text-center text-xs">{quantity}</span>
                                    <button 
                                       onClick={() => setQuantity(quantity + 1)} 
                                       className="w-6 h-6 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center font-bold"
                                    >
                                       <Plus className="w-3 h-3 font-black" />
                                    </button>
                                 </div>
                              </div>

                              <Button 
                                 onClick={() => handleInitiateSubscribe(todaysDish.name, todaysDish.price, "Single Order", [new Date().toLocaleDateString()], todaysDish.imageUrl)}
                                 className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl px-4 py-2 h-9 text-xs shadow-md"
                              >
                                 Order Special (₹{todaysDish.price * quantity})
                              </Button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <BulkCateringRequest />
               </div>
            )}
         </div>

         {/* CALENDAR DATE PICKER MODAL */}
         <Dialog open={isCalendarPickerOpen} onOpenChange={setIsCalendarPickerOpen}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-stone-200">
               <DialogHeader className="space-y-1 text-left border-b border-stone-100 pb-3">
                  <Badge className="bg-orange-100 text-orange-950 font-black text-[9px] uppercase w-fit">Delivery Schedule</Badge>
                  <DialogTitle className="text-xl font-black text-stone-950">Select Delivery Dates</DialogTitle>
                  <DialogDescription className="text-xs text-stone-500 font-medium">
                     Click any date in the calendar below to toggle delivery on or off.
                  </DialogDescription>
               </DialogHeader>

               <div className="pt-2">
                  {activeCalendarItem === 'coconut' && (
                     <FormattedCalendarPicker 
                        selectedDates={coconutCustomDates}
                        onToggleDate={(d) => toggleArrayItem(coconutCustomDates, d, setCoconutCustomDates)}
                     />
                  )}
                  {activeCalendarItem === 'salad' && (
                     <FormattedCalendarPicker 
                        selectedDates={saladCustomDates}
                        onToggleDate={(d) => toggleArrayItem(saladCustomDates, d, setSaladCustomDates)}
                     />
                  )}
                  {activeCalendarItem === 'oats' && (
                     <FormattedCalendarPicker 
                        selectedDates={oatsCustomDates}
                        onToggleDate={(d) => toggleArrayItem(oatsCustomDates, d, setOatsCustomDates)}
                     />
                  )}

                  <div className="pt-4">
                     <Button 
                        onClick={() => setIsCalendarPickerOpen(false)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl h-11 text-xs shadow-md"
                     >
                        Done & Save Calendar Dates ✓
                     </Button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>

         {/* 🌟 LOGGED IN VS NEW CUSTOMER CHECKOUT MODAL 🌟 */}
         <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
            <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
               {!isOrderSuccess ? (
                  <>
                     <DialogHeader className="space-y-1 text-left border-b border-stone-100 pb-3">
                        <Badge className="bg-orange-100 text-orange-950 font-black text-[9px] uppercase w-fit">
                           {checkoutStep === 'payment' ? 'Order Payment & Wallet' : 'Customer Registration'}
                        </Badge>
                        <DialogTitle className="text-xl font-black text-stone-950">
                           {checkoutStep === 'payment' ? 'Confirm Subscription & Wallet Pay' : 'New Customer Delivery Address'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500 font-medium">
                           {checkoutStep === 'payment' 
                              ? 'Review your delivery address, wallet balance, and confirm subscription.'
                              : 'Please enter your contact & delivery address details to proceed to payment.'}
                        </DialogDescription>
                     </DialogHeader>

                     {/* 🌟 STEP 1: NEW CUSTOMER INFORMATION FORM (ASKED ONLY IF NOT LOGGED IN OR EDITING) 🌟 */}
                     {checkoutStep === 'info' || isEditingAddress ? (
                        <form onSubmit={handleSaveInfoAndProceed} className="space-y-3.5 pt-2 text-left text-xs">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                 <label className="font-bold text-stone-700">Full Name *</label>
                                 <div className="relative">
                                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input 
                                       required 
                                       value={custName} 
                                       onChange={e => setCustName(e.target.value)} 
                                       placeholder="e.g. Ananya Sharma" 
                                       className="pl-8 h-10 text-xs rounded-xl border-stone-300"
                                    />
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <label className="font-bold text-stone-700">Contact Phone Number *</label>
                                 <div className="relative">
                                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input 
                                       required 
                                       type="tel"
                                       value={custPhone} 
                                       onChange={e => setCustPhone(e.target.value)} 
                                       placeholder="+91 98765 43210" 
                                       className="pl-8 h-10 text-xs rounded-xl border-stone-300"
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-1">
                              <label className="font-bold text-stone-700">Full Delivery Address (Flat/House No, Building, Street, Area) *</label>
                              <div className="relative">
                                 <Home className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                                 <textarea
                                    required
                                    rows={2}
                                    value={custAddress}
                                    onChange={e => setCustAddress(e.target.value)}
                                    placeholder="e.g. Flat 402, Block A, Prestige High Fields, Nanakramguda"
                                    className="w-full pl-8 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 font-medium"
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                 <label className="font-bold text-stone-700">Pincode *</label>
                                 <Input 
                                    required 
                                    value={custPincode} 
                                    onChange={e => setCustPincode(e.target.value)} 
                                    placeholder="e.g. 500032" 
                                    className="h-10 text-xs rounded-xl border-stone-300"
                                 />
                              </div>

                              <div className="space-y-1">
                                 <label className="font-bold text-stone-700">City / Landmark</label>
                                 <Input 
                                    value={custCity} 
                                    onChange={e => setCustCity(e.target.value)} 
                                    placeholder="e.g. Hyderabad" 
                                    className="h-10 text-xs rounded-xl border-stone-300"
                                 />
                              </div>
                           </div>

                           <div className="pt-2">
                              <Button 
                                 type="submit" 
                                 className="w-full bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl h-11 text-xs shadow-md"
                              >
                                 Save Address & Proceed to Payment →
                              </Button>
                           </div>
                        </form>
                     ) : (
                        /* 🌟 STEP 2: LOGGED-IN CUSTOMER CHECKOUT & WALLET PAYMENT PAGE 🌟 */
                        <div className="space-y-4 text-left pt-2 text-xs">
                           {/* Item Summary */}
                           {pendingOrder && (
                              <div className="flex items-center gap-3 bg-orange-50/70 p-3 rounded-2xl border border-orange-200">
                                 <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 border border-orange-200">
                                    <Image src={pendingOrder.imgUrl} alt={pendingOrder.title} fill className="object-cover" />
                                 </div>
                                 <div className="flex-1">
                                    <h4 className="font-extrabold text-stone-900 text-xs">{pendingOrder.title}</h4>
                                    <p className="text-[10px] text-stone-500 font-medium">{pendingOrder.dates.length} Calendar Days Active</p>
                                    <span className="text-xs font-black text-orange-600">Total: ₹{pendingOrder.price * pendingOrder.dates.length}</span>
                                 </div>
                              </div>
                           )}

                           {/* Saved Customer Delivery Address Banner */}
                           <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                              <div className="flex justify-between items-center">
                                 <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-orange-600" /> Delivery Address
                                 </span>
                                 <button 
                                    onClick={() => setIsEditingAddress(true)}
                                    className="text-[10px] font-black text-orange-600 hover:underline flex items-center gap-1"
                                 >
                                    <Edit3 className="w-3 h-3" /> Change Address
                                 </button>
                              </div>
                              <div className="text-[11px] text-stone-700 space-y-0.5 font-medium pl-5">
                                 <p className="font-bold text-stone-900">{customer?.name} ({customer?.phone})</p>
                                 <p>{customer?.address}, Pincode: {customer?.pincode}, {customer?.city}</p>
                              </div>
                           </div>

                           {/* Bookeato Pay Wallet Balance Breakdown */}
                           {pendingOrder && (
                              <div className="p-4 bg-stone-950 text-white rounded-2xl space-y-2 border border-orange-950">
                                 <div className="flex justify-between items-center text-orange-400 font-bold">
                                    <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-orange-400" /> Bookeato Pay Wallet Balance</span>
                                    <span className="font-black text-sm text-orange-400">₹{(customer?.walletBalance || 2500).toLocaleString('en-IN')}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs text-stone-300 pt-1 border-t border-stone-800">
                                    <span>Subscription Total ({pendingOrder.dates.length} Deliveries)</span>
                                    <span className="font-bold text-white">- ₹{pendingOrder.price * pendingOrder.dates.length}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-800">
                                    <span className="font-bold text-stone-200">Wallet Balance After Deduction</span>
                                    <span className="font-black text-orange-400 text-sm">
                                       ₹{Math.max(0, (customer?.walletBalance || 2500) - (pendingOrder.price * pendingOrder.dates.length)).toLocaleString('en-IN')}
                                    </span>
                                 </div>
                              </div>
                           )}

                           <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                              <span>Delivered fresh by 7:00 AM daily. Pause or skip dates anytime from your dashboard.</span>
                           </div>

                           <Button 
                              onClick={handleFinalPaymentConfirm} 
                              disabled={isSubmitting || !pendingOrder}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl h-12 text-sm shadow-md"
                           >
                              {isSubmitting ? 'Confirming Order...' : `Confirm & Pay ₹${(pendingOrder?.price || 0) * (pendingOrder?.dates.length || 0)}`}
                           </Button>
                        </div>
                     )}
                  </>
               ) : (
                  <div className="py-6 text-center space-y-4 animate-in zoom-in duration-300">
                     <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600">
                        <CheckCircle2 className="w-10 h-10" />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-stone-900">Subscription Active! 🎉</h3>
                        <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
                           Your daily morning subscription has been placed successfully. Fresh delivery begins by 7:00 AM to your address.
                        </p>
                     </div>

                     <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold text-stone-700 text-left space-y-1">
                        <div className="flex justify-between">
                           <span>Order ID:</span>
                           <span className="font-mono text-orange-600">#SUB-{Math.floor(100000 + Math.random() * 900000)}</span>
                        </div>
                        <div className="flex justify-between">
                           <span>Customer:</span>
                           <span>{customer?.name} ({customer?.phone})</span>
                        </div>
                        <div className="flex justify-between">
                           <span>Address:</span>
                           <span className="truncate max-w-[180px]">{customer?.address}, {customer?.pincode}</span>
                        </div>
                     </div>

                     <Button 
                        onClick={() => {
                           setIsOrderSuccess(false);
                           setIsAddressModalOpen(false);
                        }} 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl h-11 text-xs"
                     >
                        Done & Return to Kitchen Bar
                     </Button>
                  </div>
               )}
            </DialogContent>
         </Dialog>

         {/* Item Details Popup */}
         <ItemDialog item={selectedItem} isOpen={selectedItem !== null} onClose={() => setSelectedItem(null)} />
      </main>
    </div>
  );
}
