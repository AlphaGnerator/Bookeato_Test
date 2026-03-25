
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LandingHeader } from '@/components/landing-header';
import { ChefHat, Shield, Check, ArrowRight, IndianRupee, Flame, Soup, Activity, Loader2, Sparkles, Baby, HeartPulse } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import * as React from 'react';
import { MaidServiceTab } from '@/components/maid-service-tab';
import { MaidValueProps } from '@/components/maid-value-props';
import { MaidPricingPlans } from '@/components/maid-pricing-plans';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const heroCarouselDishes = [
    {
        id: 1,
        name: 'Avocado Toast',
        tags: ['Low-oil', 'Chef-curated', 'Delhi Cook'],
        image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop',
        hint: 'avocado toast',
        calories: 350,
        protein: 12,
        carbs: 25,
    },
    {
        id: 2,
        name: 'Grilled Salmon',
        tags: ['High-protein', 'Chef-curated', 'Mumbai Cook'],
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1770&auto=format&fit=crop',
        hint: 'grilled salmon',
        calories: 550,
        protein: 40,
        carbs: 5,
    },
    {
        id: 3,
        name: 'Quinoa Salad',
        tags: ['Vegan', 'Chef-curated', 'Bangalore Cook'],
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1770&auto=format&fit=crop',
        hint: 'quinoa salad',
        calories: 420,
        protein: 15,
        carbs: 35,
    },
    {
        id: 4,
        name: 'Chicken Curry',
        tags: ['Authentic', 'Chef-curated', 'Chennai Cook'],
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1674&auto=format&fit=crop',
        hint: 'chicken curry',
        calories: 600,
        protein: 35,
        carbs: 20,
    },
    {
        id: 5,
        name: 'Paneer Bowl',
        tags: ['High-protein', 'Chef-curated', 'Pune Cook'],
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1636&auto=format&fit=crop',
        hint: 'paneer bowl',
        calories: 480,
        protein: 25,
        carbs: 30,
    },
    {
        id: 6,
        name: 'Millet Khichdi',
        tags: ['Gut-friendly', 'Chef-curated', 'Hyderabad Cook'],
        image: 'https://picsum.photos/seed/khichdi/600/400',
        hint: 'millet khichdi',
        calories: 380,
        protein: 14,
        carbs: 45,
    }
];

const pricingPlans = [
  {
    name: "Daily Visit",
    price: "₹200",
    period: "/ visit",
    tagline: "Perfect for trying us out or unpredictable weeks.",
    features: [
      "One visit, one meal — no lock-in.",
      "Access to the chef-curated menu of the day.",
      "Same great ingredients and transparency as all other plans.",
      "Standard slot availability (subject to capacity).",
    ],
    cta: "Start Your Day",
    plan: "day",
    highlight: false,
  },
  {
    name: "Weekly Rhythm",
    price: "₹980",
    period: "/ week",
    tagline: "For households that want structure without long commitments.",
    features: [
      "7 scheduled visits for your chosen meal.",
      "Priority over Daily for slot booking.",
      "Per-meal savings vs Daily (≈30% cheaper).",
      "Disruption guarantee: backup cook arranged.",
      "Nutritionist-tuned weekly menu option.",
      "1 'pause day' per week with rollover credit.",
    ],
    cta: "Choose Weekly",
    plan: "weekly",
    highlight: true,
  },
  {
    name: "Monthly Peace Plan",
    price: "₹3,300",
    period: "/ month",
    tagline: "For people who never want to think about food again.",
    features: [
      "Up to 30 visits a month for your chosen meal.",
      "Top priority for time slots & favorite cooks.",
      "Best per-meal value (≈45% cheaper than Daily).",
      "Strongest disruption guarantee with fastest SLA.",
      "Complimentary nutritionist onboarding session.",
      "Stored nutrition profile for automatic cook guidance.",
      "Up to 4 'pause days' per month with rollover.",
      "Early access to new dishes and seasonal menus.",
    ],
    cta: "Go Monthly",
    plan: "monthly",
    highlight: false,
  },
]

function NewsletterForm() {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="mt-8 max-w-lg mx-auto h-12"></div>;
    }

    return (
        <form className="mt-8 max-w-lg mx-auto flex gap-2">
            <input type="email" placeholder="Enter your email" className="flex h-12 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-base ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
            <Button type="submit" variant="cta" size="lg" className="h-12 touch-manipulation active:scale-95">Subscribe</Button>
        </form>
    );
}

const painDetails = {
  money: {
    title: 'Daily delivery = empty wallet',
    body: 'One “quick order” a day and your monthly bill looks like a luxury subscription you never wanted.',
  },
  energy: {
    title: 'Zero energy left to cook',
    body: 'After calls and commute, even chopping onions feels like a side hustle.',
  },
  influencer: {
    title: 'Influencer recipes, never cooked',
    body: 'Saved a hundred reels, cooked exactly zero of them. Your fridge knows the truth.',
  },
  homefood: {
    title: 'Missing ghar ka khaana',
    body: 'Body is in the city, cravings are still in your childhood kitchen.',
  },
};

type PainKey = keyof typeof painDetails;

function PainTabs() {
    const [activeKey, setActiveKey] = React.useState<PainKey>('money');
    const [isPaused, setIsPaused] = React.useState(false);

    React.useEffect(() => {
        if (isPaused) return;

        const keys = Object.keys(painDetails) as PainKey[];
        const timer = setInterval(() => {
            setActiveKey(prev => {
                const idx = keys.indexOf(prev);
                return keys[(idx + 1) % keys.length];
            });
        }, 4000);

        return () => clearInterval(timer);
    }, [isPaused]);
    
    const active = painDetails[activeKey];

    return (
        <div 
            className="hero-pain-tabs touch-manipulation"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="hero-pain-chips">
                {(Object.keys(painDetails) as PainKey[]).map(key => (
                    <button 
                        key={key}
                        className={cn("pain-chip", activeKey === key && "active")} 
                        data-key={key}
                        onClick={() => setActiveKey(key)}
                    >
                        {painDetails[key].title}
                    </button>
                ))}
            </div>

            <div className="hero-pain-detail" id="hero-pain-detail">
                <strong>{active.title}</strong>
                <p>{active.body}</p>
            </div>
        </div>
    );
}

function HeroBookingDialog() {
  const { user, isUserLoading } = useUser();
  const [open, setOpen] = React.useState(false);
  const [familySize, setFamilySize] = React.useState("2");
  const [pincode, setPincode] = React.useState("");
  const { setGuestConfig } = useCulinaryStore();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length >= 5) {
      setGuestConfig({
        pincode,
        familySize: parseInt(familySize, 10),
      });
      router.push('/booking/menu');
      setOpen(false);
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <Button variant="cta" size="cta" disabled className="w-full sm:w-auto relative z-30 opacity-50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        LOADING...
      </Button>
    );
  }

  if (user) {
    return (
      <Button
          variant="cta"
          size="cta"
          onClick={() => router.push('/dashboard')}
          className="w-full sm:w-auto relative z-30 touch-manipulation shadow-xl active:scale-95"
      >
          GO TO DASHBOARD
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cta" size="cta" className="w-full sm:w-auto relative z-30 touch-manipulation shadow-xl active:scale-95">
            BOOK NOW
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Check Availability</DialogTitle>
          <DialogDescription>
            Enter your details to see what's cooking in your area.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label>Household Size</Label>
            <RadioGroup
              value={familySize}
              onValueChange={setFamilySize}
              className="grid grid-cols-3 gap-2"
            >
              {[1, 2, 3, 4, 5, 6].map(size => (
                <Label key={size} htmlFor={`size-${size}`} className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer touch-manipulation active:scale-95", familySize === String(size) ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                  <RadioGroupItem value={String(size)} id={`size-${size}`} className="sr-only" />
                  <span className="text-lg font-bold">{size}</span>
                  <span className="text-[10px] uppercase">people</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Area Pincode</Label>
            <Input
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 110011"
              maxLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="cta" className="w-full h-12 text-lg font-bold touch-manipulation active:scale-95" disabled={pincode.length < 5}>
              Explore Menu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const defaultHeroImages = [
    { title: 'Healthy Salad', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1770&auto=format&fit=crop' },
    { title: 'Gajar Ka Halwa', imageUrl: 'https://images.unsplash.com/photo-1628189508545-df9314467c64?q=80&w=1080&auto=format&fit=crop' },
    { title: 'Rajma Chawal', imageUrl: 'https://images.unsplash.com/photo-1606491589023-0b63e0b484a7?q=80&w=1080&auto=format&fit=crop' },
    { title: 'Makki ki Roti', imageUrl: 'https://images.unsplash.com/photo-1598514983318-76c8a2a96934?q=80&w=1080&auto=format&fit=crop' }
];

export default function WelcomePage() {
  const firestore = useFirestore();
  const carouselRef = useMemoFirebase(() => firestore ? collection(firestore, 'carouselImages') : null, [firestore]);
  const { data: dbImages } = useCollection<{ title: string; imageUrl: string }>(carouselRef);
  
  const [activeService, setActiveService] = React.useState('Cook');

  // Persistence Logic
  React.useEffect(() => {
    const savedService = localStorage.getItem('bookeato_active_service');
    if (savedService) {
      setActiveService(savedService);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('bookeato_active_service', activeService);
  }, [activeService]);

  const carouselImages = React.useMemo(() => {
      if (dbImages && dbImages.length > 0) return dbImages;
      return defaultHeroImages;
  }, [dbImages]);

  const services = [
    { id: 'Cook', name: 'Cook', icon: '/icons/icon_cook.png', color: 'bg-orange-500/10 text-orange-600 ring-orange-500/20' },
    { id: 'Maid', name: 'Maid', icon: '/icons/icon_maid.png', color: 'bg-green-500/10 text-green-600 ring-green-500/20' },
    { id: 'Child help', name: 'Child help', icon: '/icons/icon_child.png', color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20' },
    { id: 'Elder help', name: 'Elder help', icon: '/icons/icon_elder.png', color: 'bg-purple-500/10 text-purple-600 ring-purple-500/20' },
  ];

  return (
    <>
      <LandingHeader />
      <div>
        <main>
          {/* New Top Hero Section */}
          <section className="relative bg-surface overflow-hidden section min-h-[80vh] flex items-center pt-20">
            {/* ... hero content ... */}
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="space-y-6 text-center md:text-left max-w-xl mx-auto md:mx-0">
                  <Badge className="bg-badge-bg text-badge-text font-medium py-1 px-4 text-sm border-none">Home-cooked. Chef-designed. Stress-free.</Badge>
                   <h1 className="hero-title">
                        <span className="hero-word-main">Urban Food</span><br />
                        <span className="hero-word-orange">Problems,</span>
                        <span className="hero-word-green">Sorted.</span>
                    </h1>
                  
                  <p className="hero-intro">
                    New city, long workdays, and food apps on speed dial?
                  </p>
                  
                  <PainTabs />

                  <p className="hero-solution">
                    We send a trusted home cook to your kitchen, following chef-designed, nutrition-first
                    menus with ingredients you approve — full plates, real comfort, total
                    <em> paisa vasool</em>.
                  </p>

                  <div className="pt-4">
                    <HeroBookingDialog />
                  </div>
                </div>
                <div className="relative flex items-center justify-center p-4">
                   <div className="absolute -right-1/4 -top-1/4 w-[500px] h-[500px] bg-green-primary/10 rounded-full" />
                  <div className="w-full max-w-md lg:max-w-lg relative z-10 rounded-full overflow-hidden aspect-square border-8 border-white/50 shadow-2xl bg-white">
                    <Carousel
                        key={carouselImages.length}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 4000,
                                stopOnInteraction: false,
                            }),
                        ]}
                        className="w-full h-full"
                    >
                        <CarouselContent className="h-full">
                            {carouselImages.map((image, idx) => (
                                <CarouselItem key={image.imageUrl + idx} className="h-full">
                                    <div className="relative w-full h-full">
                                        <Image 
                                            data-ai-hint="hero food image"
                                            src={image.imageUrl}
                                            alt={image.title}
                                            fill
                                            className="object-cover"
                                            priority={idx === 0}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Service Hub Section - 2x2 Grid for Mobile Fluidity */}
          <section className="bg-white pt-16 md:pt-24 pb-8 relative z-20">
            <div className="container mx-auto px-6 text-center mb-10 md:mb-12">
               <Badge className="bg-primary/10 text-primary font-bold py-1 px-4 text-[10px] md:text-xs uppercase tracking-widest border-none mb-4">Explore Our Services</Badge>
               <h2 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">What do you need help with today?</h2>
            </div>

            <div className="container mx-auto px-4 md:px-6">
              {/* Grid layout: 2 cols on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
                {services.map((service) => {
                  const isActive = activeService === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => setActiveService(service.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-2 md:border-4 transition-all duration-500 group relative overflow-hidden h-[160px] md:h-[280px]",
                        isActive 
                          ? `bg-white shadow-xl ${service.color.split(' ')[2]} ring-4 md:ring-8 ring-stone-50 scale-[1.02] z-10` 
                          : "bg-stone-50/50 border-transparent hover:bg-white hover:border-stone-100 opacity-70 hover:opacity-100"
                      )}
                    >
                      {isActive && (
                        <div className={cn("absolute inset-0 opacity-10 pointer-events-none", service.color.split(' ')[0])} />
                      )}

                      <div className={cn(
                        "relative w-16 h-16 md:w-32 md:h-32 rounded-xl md:rounded-[2rem] transition-all duration-700 p-1",
                        isActive ? "scale-110 shadow-lg" : "grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      )}>
                        <Image 
                          src={service.icon}
                          alt={service.name}
                          fill
                          className="object-contain"
                        />
                      </div>

                      <div className="text-center mt-3 md:mt-4">
                        <span className={cn(
                          "font-black text-sm md:text-2xl transition-all block tracking-tight leading-none",
                          isActive ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600"
                        )}>
                          {service.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Connecting Pointer (NOTCH) - Desktop Only */}
            <div className="hidden lg:block container mx-auto px-6 relative h-12 max-w-6xl">
               <div 
                 className="absolute bottom-0 transition-all duration-500 ease-in-out flex justify-center"
                 style={{ 
                   width: '25%', 
                   left: `${services.findIndex(s => s.id === activeService) * 25}%` 
                 }}
               >
                 <div className={cn(
                   "w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[20px] transition-colors duration-500",
                   services.find(s => s.id === activeService)?.color.split(' ')[1].replace('text-', 'border-b-') || 'border-b-primary'
                 )}></div>
               </div>
            </div>
          </section>

          {/* Dynamic Content Container with Thematic Border & Mobile Badge */}
          <div className={cn(
            "relative z-10 border-t-[6px] md:border-t-[8px] transition-colors duration-500 py-12 md:py-20 bg-background",
            services.find(s => s.id === activeService)?.color.split(' ')[1].replace('text-', 'border-') || 'border-primary'
          )}>
            {/* Mobile Context Badge */}
            <div className="container mx-auto px-6 flex justify-center -translate-y-16">
               <div className={cn(
                 "px-6 py-2 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2",
                 services.find(s => s.id === activeService)?.color.split(' ')[1].replace('text-', 'bg-') || 'bg-primary'
               )}>
                 <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                 Now Viewing: {activeService}
               </div>
            </div>

            {activeService === 'Cook' && (
              <section className="dish-slider">
                <div className="container slider-header text-center mb-12">
                  <h2 className="section-title">Today’s chef-crafted picks</h2>
                  <p className="slider-subtitle max-w-2xl mx-auto mt-4 text-text-secondary text-lg">
                    A peek into what our cooks are plating right now — balanced, colourful, and tuned to real-life cravings.
                  </p>
                </div>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[
                        Autoplay({
                          delay: 3500,
                          stopOnInteraction: true,
                        }),
                    ]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4 px-4">
                        {heroCarouselDishes.map((dish) => (
                            <CarouselItem key={dish.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/4">
                                 <div className="p-1 h-full">
                                    <Card className="overflow-hidden rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border-none h-full bg-surface">
                                        <CardContent className="p-0 flex flex-col h-full">
                                            <Image 
                                                data-ai-hint={dish.hint}
                                                src={dish.image} 
                                                alt={dish.name} 
                                                width={400}
                                                height={300}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="p-5 bg-[#fde047] flex-1 flex flex-col">
                                                <h3 className="font-semibold text-lg text-text-primary mb-2">{dish.name}</h3>
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                {dish.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-none">{tag}</Badge>
                                                ))}
                                                </div>
                                                 <div className="grid grid-cols-3 gap-2 text-center mt-auto pt-4 border-t border-black/10">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Kcal</p>
                                                        <p className="text-sm font-bold text-foreground">{dish.calories}</p>
                                                    </div>
                                                    <div className="border-x border-black/10 px-1">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Prot</p>
                                                        <p className="text-sm font-bold text-foreground">{dish.protein}g</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Carb</p>
                                                        <p className="text-sm font-bold text-foreground">{dish.carbs}g</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="left-8 shadow-lg touch-manipulation active:scale-90" />
                        <CarouselNext className="right-8 shadow-lg touch-manipulation active:scale-90" />
                    </div>
                </Carousel>
                 <div className="text-center mt-12 px-4">
                  <Button asChild variant="cta" size="lg" className="w-full sm:w-auto h-14 px-12 font-bold text-lg shadow-xl touch-manipulation active:scale-95 transition-all">
                    <Link href="/pricing">Explore Today's Menu</Link>
                  </Button>
                </div>
              </section>
            )}

            {activeService === 'Maid' && (
              <MaidServiceTab />
            )}

            {activeService === 'Child help' && (
              <section className="container mx-auto px-6 text-center py-10">
                <Badge className="bg-primary/10 text-primary font-bold py-1 px-4 text-xs uppercase tracking-widest border-none mb-4">Coming Soon</Badge>
                <h2 className="section-title">Reliable Child Help</h2>
                <p className="text-text-secondary max-w-2xl mx-auto mt-4 text-lg">
                  Peace of mind for parents. Our child care assistants are thoroughly vetted and trained to provide a safe, nurturing environment for your little ones.
                </p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="flex gap-6 text-left p-6 rounded-3xl bg-surface border shadow-sm">
                    <div className="bg-primary/10 text-primary p-4 rounded-2xl h-fit shrink-0">
                      <Baby className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">After-School Care</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Help with snacks, homework, and playtime until you get home from work.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-left p-6 rounded-3xl bg-surface border shadow-sm">
                    <div className="bg-primary/10 text-primary p-4 rounded-2xl h-fit shrink-0">
                      <Baby className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Toddler Supervision</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Engaging and safe supervision for younger children during the day.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeService === 'Elder help' && (
              <section className="container mx-auto px-6 text-center py-10">
                <Badge className="bg-primary/10 text-primary font-bold py-1 px-4 text-xs uppercase tracking-widest border-none mb-4">Coming Soon</Badge>
                <h2 className="section-title">Compassionate Elder Care</h2>
                <p className="text-text-secondary max-w-2xl mx-auto mt-4 text-lg">
                  Dedicated support for your loved ones. Our elder care specialists provide companionship and assistance with daily living activities.
                </p>
                <div className="mt-12 space-y-6 max-w-3xl mx-auto">
                  <div className="bg-surface border-2 border-primary/10 p-6 rounded-3xl flex items-center justify-between text-left group hover:border-primary/30 transition-all">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">Companion Care</h3>
                      <p className="text-sm text-muted-foreground mt-1">Mental stimulation and companionship through shared activities and conversation.</p>
                    </div>
                    <HeartPulse className="h-10 w-10 text-primary/20 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="bg-surface border-2 border-primary/10 p-6 rounded-3xl flex items-center justify-between text-left group hover:border-primary/30 transition-all">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">Assistance with Chores</h3>
                      <p className="text-sm text-muted-foreground mt-1">Light housekeeping and assistance with errands to ensure comfort and safety.</p>
                    </div>
                    <HeartPulse className="h-10 w-10 text-primary/20 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </section>
            )}
          </div>

          
          {/* Why Choose Us Section */}
          {activeService === 'Cook' && (
            <>
              <section className="section bg-primary/5">
            <div className="container mx-auto px-6 text-center">
              <Badge className="bg-badge-bg text-badge-text font-medium py-1 px-4 text-sm border-none">Why People Choose Us</Badge>
              <h2 className="section-title mt-2">Designed for Safety, Taste & Trust</h2>
              <p className="text-text-secondary max-w-3xl mx-auto mt-4">Every part of your meal — from curation to cooking to delivery — is built for consistency, transparency, and peace of mind.</p>
              <div className="grid md:grid-cols-3 gap-8 mt-12 text-left px-4">
                <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
                        <ChefHat className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">Chef-Curated Menus</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">Designed by experienced chefs and cooked by vetted home cooks. Real ingredients. Real nutrition. Real taste.</p>
                </article>
                <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
                        <Shield className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B1A2E] mb-3">Zero Compromise</h3>
                    <p className="text-sm leading-relaxed text-[#355067]">Enjoy portions tailored to you. Since everything is cooked fresh in your kitchen, you always eat fully, without paying extra.</p>
                </article>
                <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
                        <IndianRupee className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">Healthy & Fresh</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">Track ingredients and hygiene in real time. No hidden shortcuts, no mystery oils — just pure home cooking.</p>
                </article>
              </div>
            </div>
          </section>

          {/* New Pricing Section */}
          <section className="section bg-background">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto px-4">
                  <Badge className="bg-badge-bg text-badge-text font-medium py-1 px-4 text-sm border-none">Plans & Pricing</Badge>
                  <h2 className="section-title mt-2">Flexible Plans for Real Life</h2>
                  <p className="text-text-secondary mt-4">
                    Choose how deeply you want to plug us into your routine. Whether you want to try us for a day, settle into a weekly rhythm, or forget about food planning for the entire month — we’ve got a plan that keeps taste and nutrition on the same plate.
                  </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 mt-12 items-stretch px-4">
                  {pricingPlans.map((plan) => (
                      <Card 
                          key={plan.name} 
                          className={cn(
                              "flex flex-col rounded-[2.5rem] shadow-none transition-all duration-300 border-2",
                              plan.highlight ? "lg:scale-105 bg-surface border-green-primary/30 shadow-xl" : "bg-surface/70 border-surface-border hover:border-primary/20"
                          )}
                      >
                          <CardHeader className="p-8 relative">
                              {plan.highlight && (
                                <Badge className="absolute top-0 -translate-y-1/2 bg-primary text-white font-bold py-1 px-4 text-xs uppercase tracking-widest border-none">Most Popular</Badge>
                              )}
                              <h3 className="font-bold text-2xl text-text-primary">{plan.name}</h3>
                              <div className="flex items-baseline gap-1 pt-2">
                                <span className="text-4xl font-black text-text-primary">{plan.price}</span>
                                <span className="text-text-secondary font-bold text-sm">{plan.period}</span>
                              </div>
                              <CardDescription className="text-text-secondary pt-2 text-sm font-medium leading-relaxed">{plan.tagline}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-8 pt-0 flex-1">
                              <ul className="space-y-4">
                                  {plan.features.map((feature, i) => (
                                      <li key={i} className="flex items-start gap-3">
                                          <Check className="h-5 w-5 text-green-primary mt-0.5 shrink-0" />
                                          <span className="text-text-secondary text-sm font-medium">{feature}</span>
                                      </li>
                                  ))}
                              </ul>
                          </CardContent>
                          <CardFooter className="p-8 pt-0">
                               <Button asChild variant="cta" size="lg" className="w-full h-14 text-base font-bold rounded-2xl touch-manipulation active:scale-95 shadow-lg">
                                  <Link href={`/booking?plan=${plan.plan}`}>{plan.cta}</Link>
                              </Button>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
              <div className="text-center mt-12 space-y-4 px-4">
                  <Button asChild size="lg" variant="cta" className="w-full sm:w-auto h-12 px-10 font-bold shadow-xl touch-manipulation active:scale-95">
                      <Link href="/pricing">Get Started with a Plan <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <p className="text-sm text-text-muted font-medium">
                      Not sure which plan fits you? <a href="/contact" className="underline hover:text-primary transition-colors">Talk to us.</a>
                  </p>
              </div>
            </div>
          </section>
            </>
          )}

          {activeService === 'Maid' && (
            <>
              <MaidValueProps />
              <MaidPricingPlans />
            </>
          )}

          {/* Newsletter Section */}
          <section className="section relative overflow-hidden bg-surface py-20">
             <div className="container mx-auto px-6 text-center relative z-10">
                <h2 className="section-title tracking-tight">Stay updated with fresh menus</h2>
                <p className="text-text-secondary mt-2 font-medium">Get the latest seasonal specials and early-access deals.</p>
                 <NewsletterForm />
             </div>
          </section>
        </main>
        
        <div className="md:hidden pb-16"></div>
        <BottomNav isGuest={true} />

        {/* Footer */}
        <footer className="bg-[#0F172A] text-[#9CA3AF] relative pt-32 pb-12 overflow-hidden px-4">
            <div className="absolute top-0 left-0 w-full h-32 bg-surface" style={{clipPath: "ellipse(100% 55% at 48% 44%)"}}></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-5 gap-12 text-center md:text-left">
                    <div className="col-span-2 md:col-span-2">
                        <h3 className="font-black text-2xl text-white tracking-tighter">Bookeato</h3>
                        <p className="text-sm opacity-80 mt-4 max-w-xs leading-relaxed">Connecting food lovers with talented home cooks. Healthy, fresh, and authentically yours.</p>
                        <div className="flex gap-4 mt-6 justify-center md:justify-start">
                            <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-white/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                             <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-white/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-white text-sm uppercase tracking-widest">Support</h3>
                        <ul className="space-y-2 mt-4 text-sm font-medium">
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-bold text-white text-sm uppercase tracking-widest">Company</h3>
                        <ul className="space-y-2 mt-4 text-sm font-medium">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm uppercase tracking-widest">Portals</h3>
                        <ul className="space-y-2 mt-4 text-sm font-medium">
                            <li><Link href="/cook/login" className="hover:text-white transition-colors">Cook Login</Link></li>
                            <li><Link href="/cook/signup" className="hover:text-white transition-colors">Join as Cook</Link></li>
                            <li><Link href="/maid/dashboard" className="hover:text-white transition-colors">Maid Dashboard</Link></li>
                            <li><Link href="/maid/signup" className="hover:text-white transition-colors">Join as Maid Partner</Link></li>
                            <li><Link href="/admin/login" className="hover:text-white transition-colors">Admin Panel</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-16 pt-8 text-center text-xs font-bold uppercase tracking-widest opacity-40">
                    <p>&copy; 2024 Bookeato. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
      </div>
    </>
  );
}
