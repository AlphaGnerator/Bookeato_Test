'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { 
    ChefHat, Sparkles, Utensils, 
    CalendarDays, Star, Clock, 
    Search, Zap, Gem, Heart,
    MapPin, Timer, ChevronRight, 
    Bell, ShoppingCart, Info, 
    IndianRupee, BarChart3,
    ArrowRight, Gift, ShieldCheck,
    ShoppingBag, Activity, Dumbbell,
    Plus, CheckCircle2, PhoneCall, Calendar,
    Headset, MessageSquare, RefreshCw, HelpCircle,
    Wallet, CreditCard, ArrowUpRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from '@/components/ui/popover';
import { format, isSameDay } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ServiceRequestModal } from '@/components/dashboard/service-request-modal';
import { OffersCarousel } from '@/components/dashboard/offers-carousel';
import { useToast } from '@/hooks/use-toast';

// --- Header Sub-Component ---
function DashboardHeader({ address, timeEstimate, onUpdateAddress }: { address: string, timeEstimate: string, onUpdateAddress: (newAddr: string) => void }) {
    const [newAddr, setNewAddr] = useState(address);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="bg-stone-900 p-2.5 rounded-2xl shadow-lg shadow-stone-200 group-hover:scale-110 transition-transform">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Delivering to</span>
                                    <ChevronRight className="w-3 h-3 text-stone-300" />
                                </div>
                                <h2 className="text-sm font-black text-stone-950 truncate max-w-[170px] sm:max-w-[260px]">{address || "My Home Vihanga, Nanakramguda"}</h2>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 rounded-3xl border-stone-100 shadow-2xl p-5" align="start">
                        <div className="space-y-4">
                            <h4 className="font-black text-stone-900">Update Delivery Address</h4>
                            <div className="space-y-2">
                                <Input 
                                    value={newAddr} 
                                    onChange={(e) => setNewAddr(e.target.value)}
                                    placeholder="Enter your full address or society"
                                    className="rounded-2xl border-stone-200 bg-stone-50 font-semibold text-xs"
                                />
                                <Button 
                                    className="w-full rounded-2xl bg-stone-950 text-white font-black text-xs h-10"
                                    onClick={() => {
                                        onUpdateAddress(newAddr);
                                        setIsOpen(false);
                                    }}
                                >
                                    Save Address
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-emerald-50 px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-emerald-200/60">
                    <Timer className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight">{timeEstimate}</span>
                </div>
            </div>
        </div>
    );
}

// --- Service Button item definition ---
const DASHBOARD_SERVICES = [
    {
        id: 'Marketplace',
        name: 'Marketplace',
        subtitle: 'Pure Essentials',
        image: '/marketplace/icon_market.png',
        icon: ShoppingBag,
        colorBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        badge: 'Shop 24/7',
        isDirectRoute: true,
        route: '/marketplace'
    },
    {
        id: 'Bookeato Live',
        name: 'Bookeato Live',
        subtitle: 'Fresh Meals',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
        icon: Zap,
        colorBg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
        badge: 'Live',
        isDirectRoute: true,
        route: '/live'
    },
    {
        id: 'Cook',
        name: 'Cook Service',
        subtitle: 'Private Chef',
        image: '/images/chef_service.png',
        icon: ChefHat,
        colorBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        badge: 'Popular',
        isDirectRoute: false
    },
    {
        id: 'Maid',
        name: 'Maid Service',
        subtitle: 'House Help',
        image: '/images/maid_service.png',
        icon: Sparkles,
        colorBg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
        badge: 'Top Rated',
        isDirectRoute: false
    },
    {
        id: 'Elder Care',
        name: 'Elder Care',
        subtitle: 'Companion',
        image: '/icons/icon_elder.png',
        icon: Heart,
        colorBg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
        badge: 'Specialized',
        isDirectRoute: false
    },
    {
        id: 'Yoga & Wellness',
        name: 'Yoga & Wellness',
        subtitle: '1-on-1 Trainer',
        image: '/images/yoga_wellness.png',
        icon: Activity,
        colorBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
        badge: 'New',
        isDirectRoute: false
    },
    {
        id: 'Sports Coach',
        name: 'Sports Coach',
        subtitle: 'Personal Coach',
        image: '/images/sports_coach.png',
        icon: Dumbbell,
        colorBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        badge: 'Trainer',
        isDirectRoute: false
    }
];

export default function CustomerDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isInitialized, bookings: storeBookings, updateUserProfile } = useCulinaryStore();

    // Modal state for custom service request form
    const [selectedModalService, setSelectedModalService] = useState<string | null>(null);
    const [customBookings, setCustomBookings] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter services based on search query
    const filteredServices = useMemo(() => {
        if (!searchQuery.trim()) return DASHBOARD_SERVICES;
        const q = searchQuery.toLowerCase();
        return DASHBOARD_SERVICES.filter(
            (s) => s.name.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    // Fetch locally saved custom bookings
    const loadCustomBookings = () => {
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem('bookeato_user_custom_bookings') || '[]');
            setCustomBookings(saved);
        }
    };

    useEffect(() => {
        loadCustomBookings();
        const handleUpdate = () => loadCustomBookings();
        window.addEventListener('bookeato_bookings_updated', handleUpdate);
        return () => window.removeEventListener('bookeato_bookings_updated', handleUpdate);
    }, []);

    // Combine store bookings & local custom bookings
    const allBookings = useMemo(() => {
        const combined = [...customBookings];
        if (storeBookings) {
            storeBookings.forEach(b => {
                if (!combined.some(c => c.id === b.id)) {
                    combined.push({
                        id: b.id,
                        serviceType: b.mealType ? 'Cook' : 'Maid',
                        bookingDate: b.bookingDate,
                        slotLabel: (b as any).timeSlot || b.slotLabel || '08:00 AM',
                        status: b.status || 'Confirmed',
                        customerName: user.name || 'Customer',
                        otp: b.otp || '4821',
                        amount: b.totalCost || 349
                    });
                }
            });
        }
        if (combined.length === 0) {
            combined.push({
                id: 'demo-booking-1',
                serviceType: 'Cook',
                bookingDate: new Date().toISOString(),
                slotLabel: '08:00 AM - 10:00 AM',
                status: 'Confirmed',
                customerName: user.name || 'Demo Customer',
                otp: '4821',
                amount: 349,
                selectedOptions: {
                    'Meal Plan': 'North & South Indian',
                    'People Count': '4 Members',
                    'Dietary': 'Pure Veg'
                }
            });
        }
        return combined;
    }, [customBookings, storeBookings, user.name]);

    if (!isInitialized) return null;

    const handleServiceClick = (srv: typeof DASHBOARD_SERVICES[0]) => {
        if (srv.isDirectRoute && srv.route) {
            router.push(srv.route);
        } else {
            setSelectedModalService(srv.id);
        }
    };

    return (
        <AppLayout pageTitle="Customer Dashboard">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 pt-2 px-2.5 sm:px-6">
                
                {/* 1. Standalone Top Search Bar */}
                <div className="relative w-full max-w-2xl mx-auto px-0.5">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services (Cook, Maid, Elder Care), dishes, marketplace..."
                        className="w-full bg-white border-stone-200 shadow-xs text-xs sm:text-sm pl-10 pr-9 h-10 sm:h-11 rounded-2xl focus-visible:ring-amber-400 font-semibold text-stone-950 placeholder:text-stone-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* 2. Latest Offers & Discounts Carousel */}
                <OffersCarousel />

                {/* 3. Current Wallet Balance Section */}
                <Card className="rounded-2xl border-stone-800 shadow-sm bg-stone-950 text-white p-3.5 sm:p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 shrink-0">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Wallet Balance</span>
                                <Badge className="bg-amber-400/20 text-amber-300 font-extrabold text-[8px] border-none px-1.5 py-0">
                                    +₹150 Cashback Active
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">₹1,250.00</span>
                                <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Ready to Use
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                            <Button 
                                onClick={() => toast({ title: "Wallet Add Money", description: "Payment gateway window launched. Balance updated instantly." })}
                                className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs h-8 sm:h-9 px-3 rounded-xl flex-1 sm:flex-initial active:scale-95 transition-all shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Money
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => router.push('/wallet')}
                                className="border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs h-8 sm:h-9 px-3 rounded-xl flex-1 sm:flex-initial active:scale-95 transition-all"
                            >
                                History
                                <ArrowUpRight className="w-3 h-3 ml-1 text-stone-400" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* 4. Upcoming Order Section */}
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                            Upcoming Order
                        </h2>
                        <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">1 Active Slot</span>
                    </div>

                    <Card className="rounded-2xl border-emerald-200/90 shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-stone-50/30 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                                        <ChefHat className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-stone-950 text-xs sm:text-base">Cook Request</h3>
                                            <Badge className="bg-emerald-100 text-emerald-800 font-extrabold border-none text-[9px] px-2 py-0.5 rounded-full">
                                                Confirmed
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-stone-500 font-medium flex items-center gap-1.5 mt-0.5">
                                            <Calendar className="w-3 h-3 text-stone-400" />
                                            <span>Aug 20, 2026</span>
                                            <span>•</span>
                                            <Clock className="w-3 h-3 text-stone-400" />
                                            <span>08:00 AM - 10:00 AM</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Share OTP:</span>
                                        <Badge variant="outline" className="bg-stone-950 text-amber-400 font-black text-xs px-2 py-0.5 border-stone-800">
                                            4821
                                        </Badge>
                                    </div>
                                    <span className="text-xs sm:text-base font-black text-stone-950 mt-0.5">₹349</span>
                                </div>
                            </div>

                            <div className="px-4 py-2.5 bg-stone-50/70 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] sm:text-xs font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Chef Ramesh Kumar Assigned</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 sm:h-8 rounded-xl text-[10px] sm:text-xs font-bold border-stone-200 hover:bg-stone-100"
                                    onClick={() => toast({ title: "Contacting Assigned Chef", description: "Connecting call to Chef Ramesh Kumar..." })}
                                >
                                    <PhoneCall className="w-3 h-3 mr-1 text-emerald-600" />
                                    Contact Chef
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 5. Bookeato Services Quick Grid */}
                <div className="space-y-1.5 sm:space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                            Bookeato Services
                        </h2>
                        <span className="text-[9px] sm:text-[10px] font-bold text-stone-400">
                            {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-3">
                        {filteredServices.map((srv) => {
                            const ServiceIconComp = srv.icon;
                            return (
                                <button
                                    key={srv.id}
                                    onClick={() => handleServiceClick(srv)}
                                    className={`p-1.5 sm:p-3 rounded-lg sm:rounded-2xl border ${srv.colorBg} transition-all duration-300 flex flex-col items-center justify-between text-center gap-1 group shadow-xs hover:shadow-md cursor-pointer active:scale-95 min-h-[76px] sm:min-h-[110px] relative overflow-hidden`}
                                >
                                    {srv.badge && (
                                        <Badge className="absolute top-0.5 right-0.5 bg-stone-950 text-white font-black text-[6px] sm:text-[8px] px-1 py-0 border-none rounded-xs uppercase">
                                            {srv.badge}
                                        </Badge>
                                    )}

                                    <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white p-1 sm:p-1.5 shadow-xs group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                                        {srv.image ? (
                                            <div className="relative w-full h-full">
                                                <Image src={srv.image} alt={srv.name} fill sizes="48px" className="object-cover rounded-xs sm:rounded-md" />
                                            </div>
                                        ) : (
                                            <ServiceIconComp className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800" />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-[9px] sm:text-xs font-extrabold text-stone-900 leading-tight group-hover:text-amber-700 transition-colors">
                                            {srv.name}
                                        </h3>
                                        <p className="text-[7px] sm:text-[9px] font-semibold text-stone-500 line-clamp-1">
                                            {srv.subtitle}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Service Request Modal */}
                {selectedModalService && (
                    <ServiceRequestModal 
                        isOpen={!!selectedModalService}
                        onClose={() => setSelectedModalService(null)}
                        serviceId={selectedModalService}
                    />
                )}
            </div>
        </AppLayout>
    );
}
