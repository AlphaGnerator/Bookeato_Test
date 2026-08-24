'use client';

import React from 'react';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem 
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Tag, ArrowRight, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay";
import { useToast } from '@/hooks/use-toast';

const OFFERS = [
    {
        id: 'offer-1',
        tag: 'SPECIAL DISCOUNT',
        title: 'FLAT 30% OFF',
        subtitle: 'On your first professional home cook booking',
        code: 'WELCOME30',
        bgGradient: 'from-orange-600 via-amber-600 to-orange-700',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop',
        ctaText: 'Use Code'
    },
    {
        id: 'offer-2',
        tag: 'SUBSCRIPTION CASHBACK',
        title: '₹500 INSTANT CASHBACK',
        subtitle: 'Subscribe to monthly maid cleaning plan',
        code: 'CLEAN500',
        bgGradient: 'from-emerald-700 via-teal-700 to-emerald-800',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop',
        ctaText: 'Claim Cashback'
    },
    {
        id: 'offer-3',
        tag: 'MARKETPLACE DEAL',
        title: '20% OFF A2 BILONA GHEE',
        subtitle: 'Pure grass-fed cow ghee directly from organic farms',
        code: 'PUREGHEE',
        bgGradient: 'from-blue-700 via-indigo-700 to-blue-800',
        image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
        ctaText: 'Shop Ghee'
    },
    {
        id: 'offer-4',
        tag: 'COMPLIMENTARY VISIT',
        title: 'FREE TRIAL ELDER CARE',
        subtitle: 'First 2-hour companion session for your loved ones',
        code: 'ELDERCARE',
        bgGradient: 'from-rose-700 via-pink-700 to-rose-800',
        image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=600&auto=format&fit=crop',
        ctaText: 'Book Free Trial'
    }
];

export function OffersCarousel() {
    const { toast } = useToast();
    const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

    const plugin = React.useRef(
        Autoplay({ delay: 3500, stopOnInteraction: false })
    );

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({
            title: `Promo Code ${code} Copied!`,
            description: "Apply this code at checkout for instant savings.",
        });
        setTimeout(() => setCopiedCode(null), 2500);
    };

    return (
        <div className="w-full space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between px-1 sm:px-2">
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                    Latest Offers & Discounts
                </h3>
                <Badge className="bg-amber-400 text-stone-950 font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider border-none px-1.5 py-0">
                    Updated Daily
                </Badge>
            </div>

            <Carousel 
                plugins={[plugin.current]}
                className="w-full"
                opts={{
                    align: "start",
                    loop: true,
                }}
            >
                <CarouselContent className="-ml-1.5 sm:-ml-2">
                    {OFFERS.map((offer) => (
                        <CarouselItem key={offer.id} className="pl-1.5 sm:pl-2 basis-[75%] sm:basis-[70%]">
                            <div className={`relative h-26 sm:h-44 w-full rounded-xl sm:rounded-3xl overflow-hidden bg-gradient-to-r ${offer.bgGradient} p-2.5 sm:p-5 text-white shadow-md flex justify-between items-center group`}>
                                {/* Background Image Overlay */}
                                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 mix-blend-overlay">
                                    <Image 
                                        src={offer.image} 
                                        alt={offer.title} 
                                        fill 
                                        priority
                                        sizes="(max-width: 768px) 75vw, 50vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                    />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 space-y-0.5 sm:space-y-2 max-w-[80%] sm:max-w-[65%]">
                                    <Badge className="bg-white/20 text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest border-none px-1.5 py-0">
                                        {offer.tag}
                                    </Badge>
                                    <h4 className="text-xs sm:text-xl font-black tracking-tight leading-tight drop-shadow-md">
                                        {offer.title}
                                    </h4>
                                    <p className="text-[9px] sm:text-xs text-white/90 font-medium line-clamp-1">
                                        {offer.subtitle}
                                    </p>

                                    <div className="pt-0.5 flex items-center gap-2">
                                        <button 
                                            onClick={() => handleCopyCode(offer.code)}
                                            className="bg-white text-stone-950 hover:bg-amber-300 font-extrabold text-[9px] sm:text-xs px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            {copiedCode === offer.code ? (
                                                <>
                                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600" />
                                                    <span>{offer.code}</span>
                                                    <Copy className="w-2 h-2 sm:w-2.5 sm:h-2.5 opacity-60" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side Visual Badge */}
                                <div className="relative z-10 shrink-0 hidden sm:flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                    <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1">Verified Offer</span>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
