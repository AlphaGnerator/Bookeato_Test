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

const MARKETPLACE_PRODUCTS = [
    {
        id: 'ghee-001',
        name: 'A2 Cow Ghee',
        price: 1250,
        image: '/marketplace/a2-ghee.png',
        description: 'Traditional Bilona churned Ghee from grass-fed A2 cows. Pure, aromatic, and medicinal.',
        ingredients: ['A2 Cow Milk', 'Traditional Culture'],
        isHealthy: true,
        unit: '500ml'
    },
    {
        id: 'laddu-001',
        name: 'Ragi Laddu',
        price: 450,
        image: '/marketplace/ragi-laddu.png',
        description: 'Power-packed nutritious laddus made with finger millet, organic jaggery, and cold-pressed oil.',
        ingredients: ['Finger Millet (Ragi)', 'Organic Jaggery', 'Cold-pressed Coconut Oil', 'Almonds', 'Cardamom'],
        isHealthy: true,
        unit: '250g (6 pcs)'
    }
];

function ProductCard({ product }: { product: typeof MARKETPLACE_PRODUCTS[0] }) {
    const { marketplaceCart, addToMarketplaceCart, updateMarketplaceQuantity } = useCulinaryStore();
    const cartItem = marketplaceCart.find(item => item.product.id === product.id);
    const quantity = cartItem?.quantity || 0;

    return (
        <Card className="rounded-[2.5rem] border-stone-100 shadow-xl shadow-stone-200/50 overflow-hidden bg-white group">
            <div className="relative h-64 w-full bg-stone-50 overflow-hidden">
                <Image 
                    src={product.image} 
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-md text-green-700 font-black border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Leaf className="w-3 h-3" />
                        Healthy Choice
                    </Badge>
                </div>
            </div>
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-stone-950 tracking-tight">{product.name}</h3>
                        <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">{product.unit}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-stone-950">₹{product.price}</p>
                    </div>
                </div>

                <p className="text-stone-500 text-sm font-medium leading-relaxed">
                    {product.description}
                </p>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Key Ingredients
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {product.ingredients.map((ing, i) => (
                            <Badge key={i} variant="secondary" className="bg-stone-50 text-stone-600 font-bold border-stone-100 rounded-lg py-1">
                                {ing}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-stone-100 rounded-2xl p-1 h-14">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl hover:bg-white text-stone-600 shadow-none"
                                onClick={() => updateMarketplaceQuantity(product.id, quantity - 1)}
                            >
                                <Minus className="w-5 h-5" />
                            </Button>
                            <span className="font-black text-stone-950 text-xl">{quantity}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl hover:bg-white text-stone-600 shadow-none"
                                onClick={() => updateMarketplaceQuantity(product.id, quantity + 1)}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            className="w-full h-14 rounded-2xl bg-stone-950 text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-stone-200"
                            onClick={() => addToMarketplaceCart(product as any)}
                        >
                            Add to Cart
                        </Button>
                    )}
                </div>
            </CardContent>
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
