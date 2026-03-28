'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ChefHat, Sparkles, Utensils, 
    CalendarDays, Star, Clock, 
    ChevronRight, Search, PlusCircle,
    Zap, Gem, Heart, ShoppingCart, 
    HeartHandshake, ShoppingBag, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ServiceBlockProps {
    icon: React.ElementType;
    label: string;
    description?: string;
    href: string;
    color?: string;
    isLarge?: boolean;
}

function ServiceBlock({ icon: Icon, label, description, href, color = "bg-stone-100 text-stone-600", isLarge = false }: ServiceBlockProps) {
    return (
        <Link href={href}>
            <Card className={cn(
                "rounded-[2rem] border-stone-100 shadow-sm hover:shadow-md transition-all group overflow-hidden h-full",
                isLarge ? "bg-stone-900" : "bg-white"
            )}>
                <CardContent className={cn("p-5 flex flex-col gap-3 h-full", isLarge ? "justify-between" : "justify-center items-center text-center")}>
                    <div className={cn(
                        "p-3 rounded-2xl transition-transform group-hover:scale-110",
                        isLarge ? "bg-stone-800 text-white w-fit" : color
                    )}>
                        <Icon className={cn(isLarge ? "w-8 h-8" : "w-6 h-6")} />
                    </div>
                    <div>
                        <h4 className={cn("font-black leading-tight", isLarge ? "text-white text-xl" : "text-stone-900 text-sm")}>{label}</h4>
                        {description && <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", isLarge ? "text-stone-400" : "text-stone-400")}>{description}</p>}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function ServicesPage() {
    const router = useRouter();

    return (
        <AppLayout pageTitle="Professional Services">
            <div className="max-w-xl mx-auto pb-32 space-y-8 px-2">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 pt-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full bg-stone-100 h-10 w-10 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Available Services</h1>
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Explore professional help</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="sticky top-4 z-20 bg-white/80 backdrop-blur-md p-2 rounded-[2rem] shadow-lg border border-stone-100 flex items-center gap-3 px-6 h-16">
                    <Search className="w-5 h-5 text-stone-400" />
                    <Input 
                        placeholder="Search for a service..." 
                        className="border-none bg-transparent focus-visible:ring-0 text-lg font-black placeholder:text-stone-300"
                    />
                </div>

                {/* Core Services */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4">Standard Offerings</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ServiceBlock 
                            icon={ChefHat} 
                            label="Home Cook" 
                            description="Pure Homemade Food" 
                            href="/booking/menu"
                            color="bg-orange-100 text-orange-600"
                            imageSrc="/images/chef_service.png"
                        />
                        <ServiceBlock 
                            icon={Sparkles} 
                            label="Maid Services" 
                            description="Deep clean or Daily" 
                            href="/booking/maid"
                            color="bg-green-100 text-green-600"
                            imageSrc="/images/maid_service.png"
                        />
                    </div>
                </div>

                {/* Marketplace */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4">Bookeato Marketplace</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Link href="/marketplace">
                             <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-xl shadow-blue-200/50 relative overflow-hidden group active:scale-[0.98] transition-transform">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div>
                                        <Badge className="bg-white/20 text-white font-black border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-widest mb-3">
                                            Live Now
                                        </Badge>
                                        <h4 className="text-3xl font-black text-white leading-[1.1]">Healthy Marketplace</h4>
                                        <p className="text-white/80 text-sm font-bold uppercase tracking-widest leading-relaxed mt-2 max-w-sm">
                                            Pure A2 Ghee, Ragi Laddus, and more delivered to your doorstep.
                                        </p>
                                    </div>
                                    <Button className="rounded-full bg-white text-blue-600 font-black h-12 px-8 hover:bg-stone-50 transition-all border-none shadow-lg">
                                        Shop Healthy <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Specialized Care */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-4">Dedicated Assistance</h3>
                    <div className="grid grid-cols-1 gap-4 opacity-75 grayscale-[0.5]">
                        <div className="relative group/geriatric cursor-not-allowed">
                            <Card className="rounded-[2.5rem] border-stone-100 bg-white shadow-sm overflow-hidden p-8 flex flex-col md:flex-row items-center gap-6">
                                <div className="p-4 rounded-3xl bg-red-50 text-red-600">
                                    <Heart className="w-10 h-10" />
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h4 className="text-2xl font-black text-stone-900 leading-tight">Geriatric Care</h4>
                                        <Badge className="bg-stone-100 text-stone-500 font-black border-none px-3 py-1 rounded-full text-[9px] uppercase tracking-widest">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest leading-relaxed">
                                        Professional, empathetic care for the elderly. Bringing peace of mind to your family.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
