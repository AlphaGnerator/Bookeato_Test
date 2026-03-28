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
    ArrowRight, Gift, ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem, 
    CarouselNext, 
    CarouselPrevious 
} from "@/components/ui/carousel";
import { format, isSameDay, addDays } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';

// --- Sub-Components ---

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
                                <h2 className="text-sm font-black text-stone-950 truncate max-w-[150px]">{address || "Set Address"}</h2>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 rounded-[2rem] border-stone-100 shadow-2xl p-6" align="start">
                        <div className="space-y-4">
                            <h4 className="font-black text-stone-900">Update Delivery Address</h4>
                            <div className="space-y-2">
                                <Input 
                                    value={newAddr} 
                                    onChange={(e) => setNewAddr(e.target.value)}
                                    placeholder="Enter your full address"
                                    className="rounded-2xl border-stone-100 bg-stone-50 font-bold"
                                />
                                <Button 
                                    className="w-full rounded-2xl bg-stone-950 text-white font-black"
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
                <div className="bg-stone-100 px-3 py-2 rounded-2xl flex items-center gap-2 border border-stone-200/50">
                    <Timer className="w-4 h-4 text-stone-600 animate-pulse" />
                    <span className="text-[11px] font-black text-stone-900 uppercase tracking-tight">{timeEstimate}</span>
                </div>
                <Button variant="ghost" className="h-10 w-10 rounded-full bg-stone-50 border border-stone-100 p-0 hover:bg-white shadow-sm">
                    <Bell className="w-5 h-5 text-stone-600" />
                </Button>
            </div>
        </div>
    );
}

function HeroCarousel({ onNavigate }: { onNavigate?: () => void }) {
    const [api, setApi] = React.useState<CarouselApi>();
    const plugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    // Listen for custom event to scroll to slide
    React.useEffect(() => {
        const handleScroll = (e: any) => {
            if (api && e.detail.index !== undefined) {
                api.scrollTo(e.detail.index);
                plugin.current.stop();
            }
        };
        window.addEventListener('dashboard-scroll-carousel', handleScroll);
        return () => window.removeEventListener('dashboard-scroll-carousel', handleScroll);
    }, [api]);

    const slides = [
        { 
            title: "Expert Private Chefs", 
            subtitle: "30% OFF on your first professional cook service.", 
            cta: "View Menu", 
            color: "bg-orange-500", 
            image: "/marketplace/chef_bg_clean.png",
            href: "/booking/menu"
        },
        { 
            title: "Instant Maid Service", 
            subtitle: "Professional help ready in minutes. Subscription coming soon!", 
            cta: "Book Now", 
            color: "bg-stone-900", 
            image: "/marketplace/maid_bg_clean.png",
            href: "/booking/maid"
        },
        { 
            title: "Healthy Marketplace", 
            subtitle: "Pure A2 Ghee and Ragi Laddus delivered to your door.", 
            cta: "Shop Now", 
            color: "bg-blue-600", 
            image: "/marketplace/market_bg_clean.png",
            href: "/marketplace"
        },
        { 
            title: "Geriatric Care", 
            subtitle: "Professional, empathetic care for the elderly. Coming Soon.", 
            cta: "Coming Soon", 
            color: "bg-red-600", 
            image: "/marketplace/elder_bg_clean.png",
            href: "/services"
        }
    ];

    return (
        <Carousel 
            setApi={setApi}
            plugins={[plugin.current]}
            className="w-full -mx-4"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
                align: "start",
                loop: true,
            }}
        >
            <CarouselContent className="-ml-2 px-4">
                {slides.map((slide, index) => (
                    <CarouselItem key={index} className="pl-4 basis-[90%] sm:basis-full">
                        <Link href={slide.href} onClick={onNavigate}>
                            <div className={cn(
                                "relative h-72 sm:h-96 w-full rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-xl",
                                slide.color
                            )}>
                                <Image 
                                    src={slide.image} 
                                    alt={slide.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-1000 opacity-95"
                                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-x-0 bottom-0 min-h-[70%] bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 sm:p-12 flex flex-col justify-end">
                                    <div className="space-y-2 sm:space-y-4">
                                        <h3 className="text-3xl sm:text-6xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">{slide.title}</h3>
                                        <p className="text-white/90 text-sm sm:text-2xl font-bold max-w-[260px] sm:max-w-xl leading-snug drop-shadow-xl">{slide.subtitle}</p>
                                        <div className="mt-4 sm:mt-6 bg-white text-stone-950 w-fit px-8 py-3 rounded-full font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:translate-x-2">
                                            {slide.cta} <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}

function ServiceIcon({ iconSrc, label, color, href, onClick, badge }: { iconSrc: string, label: string, color: string, href?: string, onClick?: () => void, badge?: string }) {
    const content = (
        <div className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95 transition-all" onClick={onClick}>
            <div className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-2 border-white group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden",
                color
            )}>
                {iconSrc.startsWith('/') ? (
                    <Image src={iconSrc} alt={label} fill className="object-cover p-1" />
                ) : (
                    <div className="text-stone-600">
                        {/* Fallback for icons if needed */}
                    </div>
                )}
                {badge && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                        {badge}
                    </div>
                )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-black text-stone-900 uppercase tracking-[0.15em] text-center">{label}</span>
        </div>
    );

    if (href) return <Link href={href} onClick={onClick}>{content}</Link>;
    return content;
}

function LiveTaskCard({ booking }: { booking: any }) {
    const isMaid = booking.type === 'maid';
    const isConfirmed = booking.status === 'confirmed';
    const isInProgress = booking.status === 'in_progress';

    return (
        <Card className="rounded-[2.5rem] border-stone-200 shadow-xl shadow-stone-200/40 bg-white overflow-hidden border-2">
            <CardContent className="p-0">
                <div className={cn(
                    "p-4 flex justify-between items-center text-white",
                    isInProgress ? "bg-green-600" : "bg-orange-500"
                )}>
                    <div className="flex items-center gap-2">
                        {isInProgress ? <Timer className="w-5 h-5 animate-spin-slow" /> : <Clock className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {isInProgress ? "Session in Progress" : "Partner Assigned"}
                        </span>
                    </div>
                    {isInProgress && (
                        <Badge className="bg-white/20 text-white border-white/40 font-black text-[9px] uppercase tracking-widest">
                            Live Tracking Active
                        </Badge>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                isMaid ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                            )}>
                                {isMaid ? <Sparkles className="w-8 h-8" /> : <ChefHat className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className="font-black text-stone-950 text-xl tracking-tight">
                                    {isMaid ? (booking.maidName || "Service Partner") : (booking.mealType || "Custom Meal")}
                                </h4>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                                    {isMaid ? "Professional Maid Service" : "Cook is preparing your meal"}
                                </p>
                            </div>
                        </div>
                        {isConfirmed && booking.otp && (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Share OTP</span>
                                <div className="bg-stone-100 px-4 py-2 rounded-xl border-2 border-dashed border-stone-200 font-black text-2xl tracking-[0.2em] text-stone-900">
                                    {booking.otp}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Task Progress / Details */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                {isMaid ? "Chores to be completed" : "Meal Readiness"}
                            </span>
                            {isInProgress && (
                                <span className="text-xs font-black text-green-600">Active Session</span>
                            )}
                        </div>
                        
                        {isMaid ? (
                            <div className="flex flex-wrap gap-2">
                                {booking.items?.map((item: any, idx: number) => (
                                    <Badge key={idx} variant="outline" className="bg-stone-50 border-stone-100 text-stone-600 font-bold py-1 px-3 rounded-full">
                                        {item.choreName || item.dishName}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Progress value={isInProgress ? 65 : 0} className="h-2 rounded-full bg-stone-100" />
                        )}
                    </div>

                    {isInProgress && (
                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm">
                                <Timer className="w-4 h-4" />
                            </div>
                            <p className="text-[11px] font-bold text-green-800 leading-tight">
                                Task started at {booking.startTime ? format(new Date(booking.startTime), 'hh:mm a') : 'just now'}. 
                                <br/><span className="opacity-70">Focus on your work, we'll notify you when it's done.</span>
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Main Dashboard ---

export default function DashboardPage() {
    const { user, isInitialized, bookings, updateUserProfile } = useCulinaryStore();
    const router = useRouter();
    const [isChefModalOpen, setIsChefModalOpen] = useState(false);

    const ongoingBooking = useMemo(() => {
        if (!bookings) return null;
        const now = new Date();
        // Priority: In Progress > Confirmed (Assigned)
        return bookings.find(b => 
            isSameDay(new Date(b.bookingDate), now) && 
            ['in_progress', 'confirmed'].includes(b.status)
        );
    }, [bookings]);

    if (!isInitialized) return null;

    const activePlan = (user.subscription?.status === 'active' || user.subscription?.status === 'upcoming') ? user.subscription.planId : 'none';

    return (
        <AppLayout pageTitle="Home Hub">
            <div className="max-w-xl mx-auto space-y-10 pb-32 pt-4 px-4 sm:px-6">
                
                {/* Custom UC Header */}
                <DashboardHeader 
                    address={user.address || "Select Location"} 
                    timeEstimate="42 mins" 
                    onUpdateAddress={(newAddr) => updateUserProfile({ address: newAddr })}
                />

                {/* Sub-Header / Search */}
                <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md p-2 rounded-[2rem] shadow-xl shadow-stone-200/30 border border-stone-100 flex items-center gap-3 px-6 h-16">
                    <Search className="w-5 h-5 text-stone-300" strokeWidth={3} />
                    <Input 
                        placeholder="What do you want to eat?" 
                        className="border-none bg-transparent focus-visible:ring-0 text-lg font-black tracking-tight placeholder:text-stone-300 h-full w-full"
                    />
                    <div className="h-8 w-[2px] bg-stone-100 rounded-full mx-1" />
                    <Badge className="bg-stone-50 text-stone-400 border-stone-100 font-black px-3 py-1.5 rounded-xl uppercase tracking-widest text-[8px]">All Services</Badge>
                </div>

                {/* Live Task Tracking (If active) */}
                {ongoingBooking && (
                    <div className="px-1">
                        <LiveTaskCard booking={ongoingBooking} />
                    </div>
                )}

                {/* Hero Carousel */}
                <div className="w-full">
                    <HeroCarousel onNavigate={() => setIsNavigating(true)} />
                </div>

                {/* Services Grid (Bookeato categories) */}
                <div className="space-y-6 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-2">Professional Services</h3>
                    <div className="grid grid-cols-4 gap-y-10 gap-x-4">
                        <ServiceIcon 
                            iconSrc="/images/chef_service.png" 
                            label="Chef" 
                            color="bg-orange-50" 
                            onClick={() => setIsChefModalOpen(true)} 
                        />
                        <ServiceIcon 
                            iconSrc="/images/maid_service.png" 
                            label="Maid" 
                            color="bg-green-50" 
                            href="/booking/maid" 
                        />
                        <ServiceIcon 
                            iconSrc="/icons/icon_elder.png" 
                            label="Geriatric" 
                            color="bg-red-50" 
                            onClick={() => router.push('/services')}
                            badge="Soon" 
                        />
                        <ServiceIcon 
                            iconSrc="/marketplace/icon_market.png" 
                            label="Market" 
                            color="bg-blue-50" 
                            onClick={() => router.push('/marketplace')} 
                        />
                    </div>
                </div>

                {/* Active Membership / Subscription UI */}
                {activePlan !== 'none' && user.subscription && (
                    <div className="px-1">
                        <Card className="bg-gradient-to-br from-stone-900 to-stone-800 border-none rounded-[2.5rem] p-6 shadow-2xl text-white relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                              <Sparkles className="w-32 h-32" />
                           </div>
                           <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge className="bg-white/20 text-white font-black border-none px-3 py-1 rounded-full text-[9px] uppercase tracking-widest mb-1">
                                            {user.subscription.status === 'upcoming' ? 'Queued' : 'Active'}
                                        </Badge>
                                        <h3 className="text-2xl font-black tracking-tight">{activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} Membership</h3>
                                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">
                                             {user.subscription.status === 'upcoming' 
                                                ? `Starting on ${format(new Date(user.subscription.startDate), 'MMM d')}` 
                                                : `Valid until ${format(new Date(user.subscription.expiryDate), 'MMM d')}`}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Gem className="w-5 h-5 text-amber-400" />
                                    </div>
                                </div>

                                {user.subscription.totalVisits && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Membership Usage</span>
                                            <span className="text-xs font-black text-white">{user.subscription.usedVisits || 0} / {user.subscription.totalVisits} Sessions</span>
                                        </div>
                                        <Progress 
                                            value={Math.min(100, ((user.subscription.usedVisits || 0) / user.subscription.totalVisits) * 100)} 
                                            className="h-2.5 rounded-full bg-white/10 border border-white/5 overflow-hidden" 
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button asChild variant="ghost" className="bg-white text-stone-900 hover:bg-stone-100 font-extrabold rounded-2xl flex-1 h-12">
                                        <Link href="/account">Manage Plan</Link>
                                    </Button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-black rounded-2xl px-5 h-12">
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 rounded-[2rem] border-stone-100 p-6 shadow-2xl">
                                             <div className="space-y-4">
                                                <h4 className="font-black text-stone-950 flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4" /> Membership Logic
                                                </h4>
                                                <p className="text-xs text-stone-500 leading-relaxed font-bold">
                                                    Your subscription includes **Base Visits** (Standard prep time) at no extra cost. Overage is calculated for complex meals.
                                                </p>
                                                <Button asChild variant="link" className="p-0 h-auto text-xs font-black text-stone-900 underline decoration-stone-200">
                                                    <Link href="/services#pricing-guide">View Full Pricing Guide →</Link>
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                           </div>
                        </Card>
                    </div>
                )}

            </div>
            
            {/* Chef Selection Modal */}
            <Dialog open={isChefModalOpen} onOpenChange={setIsChefModalOpen}>
                <DialogContent className="rounded-[3rem] border-none p-0 overflow-hidden max-w-md">
                    <DialogTitle className="sr-only">Choose Your Experience</DialogTitle>
                    <div className="relative h-48 w-full">
                        <Image src="/images/chef_service.png" alt="Home Cook" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
                        <div className="absolute bottom-6 left-8">
                            <h2 className="text-3xl font-black text-white tracking-tighter">Choose Your Experience</h2>
                        </div>
                    </div>
                    <div className="p-8 space-y-4 bg-white">
                        <Card 
                            className="border-2 border-stone-100 p-5 rounded-[2rem] hover:border-orange-500 cursor-pointer transition-all group active:scale-95"
                            onClick={() => {
                                setIsChefModalOpen(false);
                                router.push('/booking/menu?type=trial');
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                                    <Utensils className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-stone-900 tracking-tight">One-time Trial</h4>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Try our service for a single meal</p>
                                </div>
                                <ChevronRight className="ml-auto w-5 h-5 text-stone-300" />
                            </div>
                        </Card>

                        <Card 
                            className="border-2 border-stone-100 p-5 rounded-[2rem] hover:border-orange-500 cursor-pointer transition-all group active:scale-95"
                            onClick={() => {
                                setIsChefModalOpen(false);
                                router.push('/booking/menu?type=membership');
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                                    <Star className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-stone-900 tracking-tight">Membership Plan</h4>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Regular home-cooked food at best price</p>
                                </div>
                                <ChevronRight className="ml-auto w-5 h-5 text-stone-300" />
                            </div>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
