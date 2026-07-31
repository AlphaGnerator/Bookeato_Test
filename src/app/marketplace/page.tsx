'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ShoppingBag, Star, ShieldCheck, 
    ArrowLeft, Plus, Minus, Info,
    Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { Store } from 'lucide-react';

const MARKETPLACE_PRODUCTS = [
    {
        id: 'ghee-001',
        name: 'A2 Cow Ghee (Bilona Churned)',
        price: 1250,
        sellerName: 'Swadeshi Organic Farm',
        rating: 4.9,
        reviewsCount: 142,
        image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
        description: 'Traditional Bilona churned Ghee from grass-fed A2 cows. Pure, aromatic, and medicinal.',
        ingredients: ['A2 Cow Milk', 'Traditional Culture'],
        isHealthy: true,
        unit: '500 ml'
    },
    {
        id: 'pickle-001',
        name: 'Homemade Spicy Mango Pickle',
        price: 280,
        sellerName: 'Amma\'s Kitchen Spices',
        rating: 4.8,
        reviewsCount: 98,
        image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600&auto=format&fit=crop',
        description: 'Authentic Andhra style green mango pickle made with mustard seeds, fenugreek, and cold-pressed sesame oil.',
        ingredients: ['Raw Green Mango', 'Cold-Pressed Sesame Oil', 'Red Chilli Powder', 'Mustard', 'Fenugreek'],
        isHealthy: true,
        unit: '350 g'
    },
    {
        id: 'laddu-001',
        name: 'Ragi & Dry Fruit Laddu',
        price: 450,
        sellerName: 'NutriBites Homemade',
        rating: 4.9,
        reviewsCount: 86,
        image: 'https://images.unsplash.com/photo-1734330931856-77cdf1b5bba9?q=80&w=600&auto=format&fit=crop',
        description: 'Power-packed nutritious laddus made with finger millet, organic jaggery, roasted almonds, and pure ghee.',
        ingredients: ['Finger Millet (Ragi)', 'Organic Jaggery', 'Almonds', 'Cashews', 'Cardamom', 'A2 Ghee'],
        isHealthy: true,
        unit: '250 g (6 pcs)'
    },
    {
        id: 'honey-001',
        name: 'Raw Forest Wildflower Honey',
        price: 590,
        sellerName: 'Himalayan Nectar',
        rating: 5.0,
        reviewsCount: 210,
        image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?q=80&w=600&auto=format&fit=crop',
        description: 'Unprocessed, unfiltered raw wild honey collected directly from natural forest beehives.',
        ingredients: ['100% Pure Wild Honey'],
        isHealthy: true,
        unit: '400 g'
    },
    {
        id: 'oil-001',
        name: 'Cold Pressed Wood-Churned Mustard Oil',
        price: 340,
        sellerName: 'Village Gramin Udyog',
        rating: 4.7,
        reviewsCount: 64,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop',
        description: 'Wood pressed (Kachi Ghani) yellow mustard oil retaining natural pungent aroma and vital nutrients.',
        ingredients: ['100% Yellow Mustard Seeds'],
        isHealthy: true,
        unit: '1 Litre'
    }
];

function ProductCard({ product }: { product: typeof MARKETPLACE_PRODUCTS[0] }) {
    const { marketplaceCart, addToMarketplaceCart, updateMarketplaceQuantity } = useCulinaryStore();
    const cartItem = marketplaceCart.find(item => item.product.id === product.id);
    const quantity = cartItem?.quantity || 0;

    return (
        <Card className="rounded-2xl sm:rounded-[2.5rem] border-stone-200/80 shadow-md shadow-stone-200/40 overflow-hidden bg-white group hover:border-emerald-500/40 transition-all">
            <div className="flex flex-row sm:flex-col p-3 sm:p-0 gap-3 sm:gap-0 items-start sm:items-stretch">
                {/* Image Section: Left on mobile, Top on desktop */}
                <div className="relative w-28 h-28 sm:w-full sm:h-64 shrink-0 rounded-xl sm:rounded-none bg-stone-100 overflow-hidden">
                    <Image 
                        src={product.image} 
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex gap-1 sm:top-4 sm:left-4">
                        <Badge className="bg-white/90 backdrop-blur-md text-green-700 font-black border-none px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Leaf className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Healthy
                        </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 sm:top-4 sm:right-4 sm:bottom-auto">
                        <Badge className="bg-stone-900/85 backdrop-blur-md text-yellow-400 font-bold border-none px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            {product.rating}
                        </Badge>
                    </div>
                </div>

                {/* Content Section: Right on mobile, Bottom on desktop */}
                <CardContent className="p-0 sm:p-6 flex-1 space-y-1.5 sm:space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1 text-blue-600 text-[10px] sm:text-xs font-bold">
                            <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="line-clamp-1">{product.sellerName}</span>
                        </div>

                        <div className="flex justify-between items-start gap-1 mt-0.5">
                            <div>
                                <h3 className="text-sm sm:text-xl font-extrabold text-stone-950 leading-tight">{product.name}</h3>
                                <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider">{product.unit}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-base sm:text-2xl font-black text-stone-950">₹{product.price}</p>
                            </div>
                        </div>

                        <p className="text-stone-500 text-xs sm:text-sm font-medium leading-snug line-clamp-2 mt-1 hidden sm:block">
                            {product.description}
                        </p>

                        <div className="hidden sm:space-y-2 sm:block mt-3">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Key Ingredients
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {product.ingredients.map((ing, i) => (
                                    <Badge key={i} variant="secondary" className="bg-stone-50 text-stone-600 font-bold border-stone-100 rounded-lg py-0.5 text-xs">
                                        {ing}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-1 sm:pt-2">
                        {quantity > 0 ? (
                            <div className="flex items-center justify-between bg-stone-100 rounded-xl sm:rounded-2xl p-1 h-9 sm:h-14">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl hover:bg-white text-stone-600 shadow-none"
                                    onClick={() => updateMarketplaceQuantity(product.id, quantity - 1)}
                                >
                                    <Minus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </Button>
                                <span className="font-black text-stone-950 text-sm sm:text-xl">{quantity}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl hover:bg-white text-stone-600 shadow-none"
                                    onClick={() => updateMarketplaceQuantity(product.id, quantity + 1)}
                                >
                                    <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                className="w-full h-9 sm:h-14 rounded-xl sm:rounded-2xl bg-stone-950 text-white font-bold text-xs sm:text-lg active:scale-95 transition-all shadow-md"
                                onClick={() => addToMarketplaceCart(product as any)}
                            >
                                Add to Cart
                            </Button>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}

export default function MarketplacePage() {
    const router = useRouter();

    return (
        <AppLayout pageTitle="Marketplace">
            <div className="max-w-xl mx-auto pb-32 px-4 space-y-8">
                {/* Header Section */}
                <div className="flex items-center gap-4 pt-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full bg-stone-100 h-10 w-10"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-stone-950 tracking-tight">Healthy Marketplace</h1>
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Pure ingredients for your home</p>
                    </div>
                </div>

                {/* Banner */}
                <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden shadow-xl">
                    <Image 
                        src="/marketplace/market-banner.png" 
                        alt="Marketplace Offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <Badge className="w-fit bg-stone-950 text-white font-black border-none px-4 py-1.5 rounded-full mb-2">30% OFF</Badge>
                        <h2 className="text-2xl font-black text-white leading-tight">First Order Bonus</h2>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {MARKETPLACE_PRODUCTS.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-stone-50 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-stone-400" />
                        </div>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Quality Tested</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-stone-50 rounded-2xl">
                            <Leaf className="w-6 h-6 text-stone-400" />
                        </div>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">100% Natural</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-stone-50 rounded-2xl">
                            <Star className="w-6 h-6 text-stone-400" />
                        </div>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Premium Sourced</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
