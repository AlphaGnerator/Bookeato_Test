'use client';

import React, { useState } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { 
    ShoppingCart, Trash2, ChevronRight, 
    Clock, ChefHat, X, ArrowRight,
    ShoppingBag, Plus, Minus
} from 'lucide-react';
import Image from 'next/image';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

export function UnifiedCart() {
    const { 
        draftBookings, removeDraftBooking, 
        marketplaceCart, updateMarketplaceQuantity, removeFromMarketplaceCart 
    } = useCulinaryStore();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const serviceCount = draftBookings?.length || 0;
    const marketplaceCount = marketplaceCart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const cartCount = serviceCount + marketplaceCount;

    const marketplaceTotal = marketplaceCart?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;
    const isPersistentPage = pathname === '/dashboard' || pathname === '/marketplace';

    if (cartCount === 0 && !isPersistentPage) return null;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className="fixed bottom-24 right-6 z-50 animate-bounce-subtle">
                    <Button 
                        className={cn(
                            "h-16 w-16 rounded-full shadow-2xl shadow-stone-400 border-4 border-white flex flex-col items-center justify-center p-0 group overflow-hidden transition-all duration-500",
                            cartCount > 0 ? "bg-orange-500 scale-110" : "bg-stone-900"
                        )}
                    >
                        <div className="relative z-10 flex flex-col items-center gap-0.5">
                            <ShoppingBag className={cn("w-5 h-5 text-white transition-transform duration-300", cartCount > 0 && "scale-110")} />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[12px] font-black text-white">{cartCount}</span>
                                <span className="text-[7px] font-black text-white/80 uppercase tracking-widest">
                                    {cartCount === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>
                        </div>
                    </Button>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[3rem] h-[80vh] border-none shadow-2xl p-0 overflow-hidden">
                <div className="h-2 w-16 bg-stone-200 rounded-full mx-auto mt-4 mb-2" />
                <SheetHeader className="px-8 pt-4">
                    <div className="flex justify-between items-center">
                        <SheetTitle className="text-3xl font-black text-stone-950 tracking-tight">Your Cart</SheetTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full bg-stone-100 h-10 w-10">
                            <X className="w-5 h-5 text-stone-500" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="px-8 mt-8 space-y-6 overflow-y-auto max-h-[50vh] pb-10">
                    {/* Marketplace Items */}
                    {marketplaceCart.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Marketplace Products</h3>
                            {marketplaceCart.map((item, idx) => (
                                <div key={item.product.id} className="group flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 relative overflow-hidden">
                                                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-stone-900 text-lg leading-tight">{item.product.name}</h4>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                                                    ₹{item.product.price} • {item.product.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeFromMarketplaceCart(item.product.id)}
                                            className="text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pl-[72px]">
                                        <div className="flex items-center gap-4 bg-stone-50 rounded-xl p-1 border border-stone-100">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg"
                                                onClick={() => updateMarketplaceQuantity(item.product.id, item.quantity - 1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="font-black text-stone-950 text-sm">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg"
                                                onClick={() => updateMarketplaceQuantity(item.product.id, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <span className="font-black text-stone-900">₹{item.product.price * item.quantity}</span>
                                    </div>
                                    {idx < marketplaceCart.length - 1 && <Separator className="mt-4 opacity-50" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {serviceCount > 0 && marketplaceCount > 0 && <Separator className="my-8" />}

                    {/* Service Bookings */}
                    {draftBookings.map((draft, idx) => (
                        <div key={idx} className="group flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                                        <ChefHat className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-stone-900 text-lg leading-tight">{draft.mealType} Service</h4>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                                            {format(new Date(draft.bookingDate), 'EEE, MMM d • p')}
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeDraftBooking(draft.bookingDate)}
                                    className="text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pl-[72px]">
                                {draft.items.map((item, i) => (
                                    <Badge key={i} variant="secondary" className="bg-stone-50 text-stone-500 font-bold border-stone-100">
                                        {item.numberOfPortions}x {item.dishName}
                                    </Badge>
                                ))}
                            </div>
                            {idx < draftBookings.length - 1 && <Separator className="mt-4" />}
                        </div>
                    ))}
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-stone-100">
                    <div className="w-full space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Total Items</p>
                                <p className="text-3xl font-black text-stone-950">{cartCount} ITEMS</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Total Payable</p>
                                <p className="text-2xl font-black text-orange-600">
                                    ₹{marketplaceTotal.toLocaleString()}{serviceCount > 0 ? ' + Services' : ''}
                                </p>
                            </div>
                        </div>
                        <Button 
                            className="w-full h-16 rounded-[2rem] bg-stone-950 text-white font-black text-xl shadow-2xl shadow-stone-300 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-orange-600 transition-colors"
                            onClick={() => {
                                setIsOpen(false);
                                if (serviceCount > 0) {
                                    const latestDate = draftBookings[draftBookings.length - 1].bookingDate;
                                    router.push(`/booking/summary/${format(new Date(latestDate), 'yyyy-MM-dd')}`);
                                } else {
                                    router.push('/marketplace/checkout');
                                }
                            }}
                        >
                            Proceed to Checkout <ArrowRight className="w-6 h-6" />
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
