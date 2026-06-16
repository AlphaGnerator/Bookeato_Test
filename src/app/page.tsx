
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const heroCarouselDishes = [
    {
        id: 1,
        name: 'Dal Makhani',
        tags: ['Creamy', 'Chef-curated', 'Delhi Cook'],
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1770&auto=format&fit=crop',
        hint: 'dal makhani',
        calories: 320,
        protein: 14,
        carbs: 35,
    },
    {
        id: 2,
        name: 'Paneer Butter Masala',
        tags: ['Rich', 'Chef-curated', 'Mumbai Cook'],
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1636&auto=format&fit=crop',
        hint: 'paneer butter masala',
        calories: 450,
        protein: 20,
        carbs: 15,
    },
    {
        id: 3,
        name: 'Authentic Biryani',
        tags: ['Spiced', 'Chef-curated', 'Hyderabad Cook'],
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1770&auto=format&fit=crop',
        hint: 'authentic biryani',
        calories: 480,
        protein: 24,
        carbs: 40,
    },
    {
        id: 4,
        name: 'Palak Paneer',
        tags: ['Healthy', 'Chef-curated', 'Bangalore Cook'],
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1770&auto=format&fit=crop',
        hint: 'palak paneer',
        calories: 390,
        protein: 18,
        carbs: 12,
    },
    {
        id: 5,
        name: 'Chole Bhature',
        tags: ['Indulgent', 'Chef-curated', 'Delhi Cook'],
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1770&auto=format&fit=crop',
        hint: 'chole bhature',
        calories: 550,
        protein: 16,
        carbs: 65,
    },
    {
        id: 6,
        name: 'Masala Dosa',
        tags: ['Crispy', 'Chef-curated', 'Chennai Cook'],
        image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?q=80&w=1770&auto=format&fit=crop',
        hint: 'masala dosa',
        calories: 280,
        protein: 6,
        carbs: 42,
    }
];

const pricingPlans = [
  {
    name: "One-Time Visit",
    price: "₹299",
    period: "/ visit",
    tagline: "Perfect for emergencies or trying out our service quality.",
    features: [
      "Single visit without any long-term commitment.",
      "Vetted background-checked professionals.",
      "Access to standard slot availability.",
      "Pay-per-use, completely flexible.",
    ],
    cta: "Book a Visit",
    plan: "day",
    highlight: false,
  },
  {
    name: "Monthly Disruption-Free",
    price: "₹4,999",
    period: "/ month",
    tagline: "The ultimate premium peace of mind for your household.",
    features: [
      "Zero-Disruption Guarantee: We send a substitute instantly if someone is on leave.",
      "Dedicated multi-cuisine cook or premium maid assigned.",
      "Highest priority for scheduling and customized instructions.",
      "Free access to nutritionist consultation (for cooks).",
      "Complimentary access to Nourish Store early deals.",
      "Save up to 40% compared to daily visits.",
    ],
    cta: "Subscribe Now",
    plan: "monthly",
    highlight: true,
  },
  {
    name: "Weekly Flex Plan",
    price: "₹1,499",
    period: "/ week",
    tagline: "For those needing structured help without a full month lock-in.",
    features: [
      "7 consecutive scheduled visits.",
      "Priority slot booking over direct walk-ins.",
      "Option to pause for 1 day a week without penalty.",
      "Flexible task assignment based on daily needs.",
    ],
    cta: "Choose Weekly",
    plan: "weekly",
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

const heroSlides = [
    { 
        id: 'cook',
        title: 'Eat Healthy, Exactly Your Way', 
        subtitle: 'Prepared by Trained Experts. Real taste, pure hygiene.',
        badge: 'Disruption-Free Monthly Plans',
        cta: 'Book Cook Now',
        link: '/booking',
        imageUrl: '/carousel/carousel_cook_bg.png',
        hasBurnedText: false,
        features: [
          "Trained Culinary Experts: Professional cooks skilled in hygiene.",
          "Expert-Curated Healthy Menus: Nutritious and customized meal plans.",
          "30-Day Guaranteed Service: Automatic backup if your cook is on leave.",
          "No Questions Asked Replacement: Instant replacement if you are unsatisfied."
        ]
    },
    { 
        id: 'maid',
        title: 'Finally, House Help That Shows Up', 
        subtitle: 'Every Single Day. Spotless home infrastructure on autopilot.',
        badge: '100% Disruption-Free Guarantee',
        cta: 'Book Maid Now',
        link: '/booking/maid',
        imageUrl: '/carousel/carousel_maid_bg.png',
        hasBurnedText: false,
        features: [
          "30-Day Service Guarantee: Backup maid arranged if yours is on leave.",
          "No Questions Asked Replacement: Instant maid replacement if unsatisfied.",
          "Exact Time Booking: Maid stays and cleans for the full booked duration."
        ]
    },
    { 
        id: 'elder',
        title: 'Compassionate Elder Care', 
        subtitle: 'Warm, trained specialists for your loved ones at home.',
        badge: 'Trained & Vetted Caregivers',
        cta: 'Request Care',
        link: '#services-grid',
        imageUrl: '/carousel/carousel_elderly_bg.png',
        hasBurnedText: false,
        features: [
          "Certified Specialists: Warm, professional caregivers trained in elder care.",
          "Direct Callbacks: Customized support matching your needs.",
          "Safety & Trust: Background verified and continuously monitored."
        ]
    },
    { 
        id: 'pantry',
        title: 'Just Nourish Store', 
        subtitle: 'A2 Kulfis, ancient grains, and cold-pressed oils. Zero chemical adulteration.',
        badge: 'Zero Chemicals',
        cta: 'Visit Nourish Store',
        link: '#services-grid',
        imageUrl: '/carousel/carousel_pantry_bg.png',
        hasBurnedText: false,
        features: [
          "Zero Chemicals: Pure ingredients sourced directly from organic farms.",
          "Ancient Grains: Handpicked millets and traditional nutrient-dense varieties.",
          "Cold-Pressed Oils: Retaining natural aroma, nutrients, and purity."
        ]
    }
];

function ElderCareRequestForm() {
  const firestore = useFirestore();
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    patientName: '',
    patientAge: '',
    patientGender: 'male',
    careDuration: '12_hours',
    existingAilments: '',
    preferredStartDate: '',
  });

  const [specialNeeds, setSpecialNeeds] = React.useState({
    mobility: false,
    feeding: false,
    medication: false,
    companionship: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof typeof specialNeeds) => {
    setSpecialNeeds(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        patientAge: parseInt(formData.patientAge, 10) || 0,
        specialNeeds: Object.keys(specialNeeds).filter(key => specialNeeds[key as keyof typeof specialNeeds]),
        status: 'pending',
        createdAt: serverTimestamp ? serverTimestamp() : new Date(),
      };
      if (firestore) {
        await addDoc(collection(firestore, 'elderCareRequests'), payload);
      } else {
        const existing = JSON.parse(localStorage.getItem('bookeato_elder_requests') || '[]');
        existing.push({ ...payload, createdAt: new Date().toISOString() });
        localStorage.setItem('bookeato_elder_requests', JSON.stringify(existing));
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting elder care request:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-purple-100 rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-purple-100/30 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Check className="w-8 h-8" strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black text-stone-900 tracking-tight">Request Received Successfully!</h3>
        <p className="text-stone-600 text-sm leading-relaxed max-w-sm mx-auto">
          Thank you for reaching out. Our Elder Care Coordinator will review your details and get back to you within 2 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-stone-100 rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-stone-200/50">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-stone-900 tracking-tight">Request Specialized Elder Care</h3>
        <p className="text-stone-500 text-sm mt-2 font-medium">Provide details to help us match the right care professional for your loved one.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName" className="font-bold text-stone-700">Your Name (Contact Person)</Label>
            <Input
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              placeholder="e.g. Rahul Sharma"
              required
              className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="font-bold text-stone-700">Phone Number</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleInputChange}
              placeholder="e.g. +91 9876543210"
              required
              className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="font-bold text-stone-700">Email Address</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleInputChange}
            placeholder="e.g. rahul@example.com"
            required
            className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
          />
        </div>

        <hr className="border-stone-100 my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="patientName" className="font-bold text-stone-700">Recipient's Name (Elderly Person)</Label>
            <Input
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={handleInputChange}
              placeholder="e.g. Devendra Sharma"
              required
              className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientAge" className="font-bold text-stone-700">Age</Label>
            <Input
              id="patientAge"
              name="patientAge"
              type="number"
              min="50"
              max="120"
              value={formData.patientAge}
              onChange={handleInputChange}
              placeholder="e.g. 75"
              required
              className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patientGender" className="font-bold text-stone-700">Gender</Label>
            <select
              id="patientGender"
              name="patientGender"
              value={formData.patientGender}
              onChange={handleInputChange}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="careDuration" className="font-bold text-stone-700">Care Duration Needed</Label>
            <select
              id="careDuration"
              name="careDuration"
              value={formData.careDuration}
              onChange={handleInputChange}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <option value="12_hours">12 Hours (Day/Night)</option>
              <option value="24_hours">24 Hours</option>
              <option value="live_in">Live-in Caregiver</option>
              <option value="few_hours">Few Hours / Part-time</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="font-bold text-stone-700 block">Required Special Assistance</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'mobility', label: 'Mobility Assistance (Walking/Transferring)' },
              { id: 'feeding', label: 'Feeding & Meal Assistance' },
              { id: 'medication', label: 'Medication Management' },
              { id: 'companionship', label: 'Companionship & Emotional Care' }
            ].map(item => (
              <label 
                key={item.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none",
                  specialNeeds[item.id as keyof typeof specialNeeds]
                    ? "border-purple-500 bg-purple-50/20"
                    : "border-stone-100 hover:border-stone-200 bg-stone-50/30"
                )}
              >
                <input 
                  type="checkbox"
                  checked={specialNeeds[item.id as keyof typeof specialNeeds]}
                  onChange={() => handleCheckboxChange(item.id as keyof typeof specialNeeds)}
                  className="mt-1 rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold text-stone-700 leading-tight">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="existingAilments" className="font-bold text-stone-700">Existing Ailments / Medical Conditions</Label>
          <textarea
            id="existingAilments"
            name="existingAilments"
            value={formData.existingAilments}
            onChange={handleInputChange}
            placeholder="e.g. Diabetes, Hypertension, early-stage Dementia, Parkinson's, recovering from surgery, etc."
            rows={3}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 placeholder:text-stone-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredStartDate" className="font-bold text-stone-700">Preferred Start Date</Label>
          <Input
            id="preferredStartDate"
            name="preferredStartDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.preferredStartDate}
            onChange={handleInputChange}
            required
            className="rounded-xl border-stone-200 focus-visible:ring-purple-500"
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl text-md active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : 'Submit Care Request'}
        </Button>
      </form>
    </div>
  );
}

export default function WelcomePage() {
  const firestore = useFirestore();
  const carouselRef = useMemoFirebase(() => firestore ? collection(firestore, 'carouselImages') : null, [firestore]);
  const { data: dbImages } = useCollection<{ title: string; imageUrl: string }>(carouselRef);
  
  const { dishes } = useCulinaryStore();
  const displayDishes = React.useMemo(() => {
     return dishes && dishes.length > 0 
      ? dishes.filter(d => d.isActive).slice(0, 6).map((d) => ({
          id: d.id,
          name: d.displayName_en || 'Delicious Dish',
          tags: d.dietaryTags && d.dietaryTags.length > 0 ? d.dietaryTags.slice(0, 3) : ['Chef-curated'],
          image: d.heroImageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1770&auto=format&fit=crop',
          hint: d.displayName_en?.toLowerCase() || '',
          calories: d.calories || 350,
          protein: d.protein_grams || 15,
          carbs: d.carbs_grams || 30
      })) 
      : heroCarouselDishes;
  }, [dishes]);
  
  const [activeService, setActiveService] = React.useState('Cook');

  // Persistence Logic
  React.useEffect(() => {
    const savedService = typeof window !== 'undefined' ? localStorage.getItem('bookeato_active_service') : null;
    if (savedService && ['Cook', 'Maid', 'Elder help', 'Nourish Store'].includes(savedService)) {
        setActiveService(savedService);
    }
    
    const handleServiceChange = (e: any) => {
        if (e.detail && ['Cook', 'Maid', 'Elder help', 'Nourish Store'].includes(e.detail)) {
            setActiveService(e.detail);
        }
    };
    window.addEventListener('bookeato_service_change', handleServiceChange);
    return () => window.removeEventListener('bookeato_service_change', handleServiceChange);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('bookeato_active_service', activeService);
  }, [activeService]);

  const [showFloatingCTA, setShowFloatingCTA] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowFloatingCTA(true);
      } else {
        setShowFloatingCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getFloatingCTAConfig = (service: string) => {
    switch (service) {
      case 'Cook':
        return {
          text: 'Book Cook Now',
          href: '/booking',
          color: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20',
          icon: ChefHat,
        };
      case 'Maid':
        return {
          text: 'Book Maid Now',
          href: '/booking/maid',
          color: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20',
          icon: Shield,
        };
      case 'Elder help':
        return {
          text: 'Request Elder Care',
          href: '#services-grid',
          color: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
          icon: HeartPulse,
        };
      case 'Nourish Store':
        return {
          text: 'Browse Nourish Store',
          href: '/marketplace',
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          icon: Sparkles,
        };
      default:
        return null;
    }
  };

  const ctaConfig = getFloatingCTAConfig(activeService);
  const CTAIcon = ctaConfig?.icon;

  const carouselImages = React.useMemo(() => {
      return heroSlides;
  }, []);

  const services = [
    { id: 'Cook', name: 'Cook', icon: '/icons/icon_cook_new.png', color: 'bg-orange-500/10 text-orange-600 ring-orange-500/20' },
    { id: 'Maid', name: 'Maid', icon: '/icons/icon_maid.png', color: 'bg-green-500/10 text-green-600 ring-green-500/20' },
    { id: 'Elder help', name: 'Elder Care', icon: '/icons/icon_elder.png', color: 'bg-purple-500/10 text-purple-600 ring-purple-500/20' },
    { id: 'Nourish Store', name: 'Nourish Store', icon: '/icons/icon_pantry.png', color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' },
  ];

  return (
    <>
      <LandingHeader />
      <div className="pt-16 md:pt-20 bg-surface">
        <main>
          {/* Desktop Bookeato Live Banner */}
          <div className="hidden md:flex bg-orange-600 text-white px-4 py-2 text-center flex-row items-center justify-center gap-3 relative z-50">
             <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-100 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-300"></span>
             </span>
             <span className="font-medium text-sm">We are setting up Live Kitchens in select societies!</span>
             <Link href="/live" className="font-black text-sm hover:text-stone-200 transition-colors ml-2 flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                Order from Bookeato Live <ArrowRight className="w-3.5 h-3.5" />
             </Link>
          </div>

          {/* Coast-to-Coast Hero Section */}
          <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[600px] lg:h-[700px] overflow-hidden bg-stone-950 group">
             <Carousel
                 key={carouselImages.length}
                 opts={{ align: "start", loop: true }}
                 plugins={[ Autoplay({ delay: 3500, stopOnInteraction: false }) ]}
                 className="w-full h-full absolute inset-0"
             >
                 <CarouselContent className="h-full ml-0">
                     {carouselImages.map((slide, idx) => (
                          <CarouselItem 
                               key={slide.id + idx} 
                               className="h-full pl-0 relative cursor-pointer"
                               onClick={() => {
                                   const serviceMapping: Record<string, string> = {
                                       cook: 'Cook',
                                       maid: 'Maid',
                                       elder: 'Elder help',
                                       pantry: 'Nourish Store'
                                   };
                                   if (serviceMapping[slide.id]) {
                                       setActiveService(serviceMapping[slide.id]);
                                   }
                                   document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' });
                               }}
                          >
                              <div className="relative w-full h-full flex flex-col justify-end bg-stone-950">
                                  <div className="absolute inset-0 w-full h-full">
                                    <Image 
                                        data-ai-hint="hero authentic image"
                                        src={slide.imageUrl}
                                        alt={slide.title}
                                        fill
                                        className="object-cover transition-transform duration-[30s] ease-linear scale-100 group-hover:scale-105"
                                        priority={idx === 0}
                                    />
                                  </div>
                                  {!slide.hasBurnedText && (
                                     <>
                                       <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-stone-950/10 md:from-stone-950/95 md:via-stone-950/40 md:to-transparent pointer-events-none" />
                                       
                                       {/* Slide Specific Content */}
                                       <div className="relative z-20 container mx-auto px-4 sm:px-6 pt-16 md:pt-0 pb-16 md:pb-28 text-left flex flex-col items-start gap-3 md:gap-4 h-full justify-end">
                                           <Badge className="bg-orange-500/90 text-white border-none shadow-lg px-4 py-1.5 text-[10px] md:text-sm uppercase tracking-widest font-black">{slide.badge}</Badge>
                                           <div className="max-w-2xl">
                                             <h3 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-2xl leading-tight">{slide.title}</h3>
                                             <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-stone-200 font-bold max-w-[95%] drop-shadow-md">{slide.subtitle}</p>
                                           </div>
                                           {slide.features && (
                                              <ul className="hidden md:flex flex-col gap-2 mt-2 mb-4 max-w-xl text-stone-100">
                                                 {slide.features.map((feature, fIdx) => (
                                                    <li key={fIdx} className="flex items-start gap-2 text-sm font-semibold">
                                                       <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                       <span className="drop-shadow-md text-stone-200">{feature}</span>
                                                    </li>
                                                 ))}
                                              </ul>
                                           )}
                                           <div className="flex gap-4 mt-2 items-center flex-wrap">
                                             <Button asChild variant="cta" size="lg" className="rounded-2xl shadow-2xl touch-manipulation active:scale-95 group/btn border border-white/20 relative z-30 font-bold text-lg h-14 px-8" onClick={(e) => e.stopPropagation()}>
                                                 <Link href={slide.link} className="flex items-center gap-1">
                                                     {slide.cta} <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                                 </Link>
                                             </Button>
                                           </div>
                                       </div>
                                     </>
                                  )}
                              </div>
                          </CarouselItem>
                      ))}
                 </CarouselContent>
                 
                 {/* Carousel Controls */}
                 <div className="absolute inset-y-0 left-2 md:left-10 flex items-center z-40 pointer-events-none">
                     <CarouselPrevious className="pointer-events-auto relative left-0 top-0 translate-y-0 translate-x-0 h-10 w-10 md:h-12 md:w-12 bg-black/20 hover:bg-black/40 text-white border-white/20 backdrop-blur-md transition-all hover:scale-110" />
                 </div>
                 <div className="absolute inset-y-0 right-2 md:right-10 flex items-center z-40 pointer-events-none lg:pr-80">
                     <CarouselNext className="pointer-events-auto relative right-0 top-0 translate-y-0 translate-x-0 h-10 w-10 md:h-12 md:w-12 bg-black/20 hover:bg-black/40 text-white border-white/20 backdrop-blur-md transition-all hover:scale-110" />
                 </div>
             </Carousel>
             
             {/* Simple Glassmorphic Booking Widget */}
             <div className="absolute bottom-20 md:bottom-28 right-6 md:right-10 z-30 hidden lg:block">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl w-80 pointer-events-auto">
                   <h4 className="text-white font-bold mb-4 text-lg drop-shadow-md">Quick Availability</h4>
                   <HeroBookingDialog />
                </div>
             </div>
          </section>

          {/* Service Hub Section - Swiggy Style Pills */}
          <section 
              id="services-grid" 
              className={cn(
                  "relative pt-12 pb-2 transition-colors duration-500 overflow-visible z-20",
                  activeService === 'Cook' ? 'bg-orange-50' : 
                  activeService === 'Maid' ? 'bg-teal-50' : 
                  activeService === 'Elder help' ? 'bg-purple-50' : 'bg-emerald-50'
              )}
          >
             {/* Top Blend Gradient fading from the dark carousel into the light section */}
             <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-stone-950 to-transparent pointer-events-none" />

             <div className="container mx-auto px-6 text-center md:pb-4 relative z-10">
                 <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight text-stone-900 drop-shadow-sm">What do you need help with today?</h2>
             </div>

             <div className={cn(
                "sticky top-16 md:top-20 z-45 w-full transition-all duration-300 py-3 md:py-4 border-b border-stone-200/20 backdrop-blur-xl shadow-sm mt-6",
                activeService === 'Cook' ? 'bg-orange-50/90' : 
                activeService === 'Maid' ? 'bg-teal-50/90' : 
                activeService === 'Elder help' ? 'bg-purple-50/90' : 'bg-emerald-50/90'
             )}>
                <div className="container mx-auto px-1 md:px-6 relative z-30">
                    <div className="flex justify-between w-full overflow-visible items-end px-1 md:px-4 gap-1 md:gap-4">
                        {services.map((service) => {
                            const isActive = activeService === service.id;
                            const activeThemeBg = activeService === 'Cook' ? 'bg-orange-50' : activeService === 'Maid' ? 'bg-teal-50' : activeService === 'Elder help' ? 'bg-purple-50' : 'bg-emerald-50';

                            return (
                                <button
                                    key={service.id}
                                    onClick={() => setActiveService(service.id)}
                                    className={cn(
                                        "relative flex flex-col items-center transition-all duration-300 ease-in-out cursor-pointer flex-1 min-w-0 border-b-0",
                                        isActive 
                                           ? `${activeThemeBg} rounded-t-[1.2rem] md:rounded-t-[2.5rem] pt-3 pb-4 md:pt-4 md:pb-6 shadow-[0_-10px_20px_-3px_rgba(0,0,0,0.1)] z-40 border-0`
                                           : "bg-white/40 hover:bg-white/60 rounded-[1rem] md:rounded-[2rem] pt-2 pb-3 mx-0.5 md:mx-1 z-10 border border-stone-200/40 text-stone-700 backdrop-blur-md transform scale-95 opacity-80 hover:opacity-100 mb-1"
                                    )}
                                >
                                    {/* Flared Corner Visual Illusions for Active Tab to blend perfectly */}
                                    {isActive && (
                                       <>
                                          {/* Fill the bottom gap */}
                                          <div className={`absolute inset-x-0 bottom-0 h-4 md:h-6 ${activeThemeBg} z-40 translate-y-[2px] md:translate-y-[3px]`}></div>
                                          
                                          {/* Left Flare Curve */}
                                          <svg 
                                            className="absolute bottom-0 -left-3 md:-left-4 w-3 h-3 md:w-4 md:h-4 z-50 text-current translate-y-[2px] md:translate-y-[3px]" 
                                            style={{ color: activeService === 'Cook' ? '#fff7ed' : activeService === 'Maid' ? '#f0fdfa' : activeService === 'Elder help' ? '#faf5ff' : '#ecfdf5' }}
                                            viewBox="0 0 24 24" 
                                            fill="currentColor"
                                          >
                                              <path d="M0,24 L24,24 L24,0 C24,13.25 13.25,24 0,24 Z" />
                                          </svg>

                                          {/* Right Flare Curve */}
                                          <svg 
                                            className="absolute bottom-0 -right-3 md:-right-4 w-3 h-3 md:w-4 md:h-4 z-50 text-current scale-x-[-1] translate-y-[2px] md:translate-y-[3px]" 
                                            style={{ color: activeService === 'Cook' ? '#fff7ed' : activeService === 'Maid' ? '#f0fdfa' : activeService === 'Elder help' ? '#faf5ff' : '#ecfdf5' }}
                                            viewBox="0 0 24 24" 
                                            fill="currentColor"
                                          >
                                              <path d="M0,24 L24,24 L24,0 C24,13.25 13.25,24 0,24 Z" />
                                          </svg>
                                       </>
                                    )}
                                    
                                    <div className={cn(
                                        "relative transition-transform duration-300", 
                                        isActive ? "w-8 h-8 md:w-12 md:h-12 drop-shadow-sm scale-110 mb-1" : "w-7 h-7 md:w-9 md:h-9 mb-1"
                                    )}>
                                        <Image src={service.icon} alt={service.name} fill className="object-contain" />
                                    </div>
                                    <span className={cn(
                                        "font-black tracking-tight mt-1 transition-all text-center leading-[1.1] mb-0.5",
                                        isActive ? "text-stone-900 text-[10px] md:text-lg scale-100 px-1" : "text-stone-600 text-[8px] md:text-sm font-semibold scale-90 px-0.5"
                                    )}>
                                        {service.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                 </div>
             </div>
          </section>

          {/* Dynamic Content Container */}
          <div className={cn(
            "relative z-10 py-12 md:py-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] pt-12 md:pt-20 mt-0 transition-colors duration-500",
            (activeService === 'Cook' ? 'bg-orange-50' : 
             activeService === 'Maid' ? 'bg-teal-50' : 
             activeService === 'Elder help' ? 'bg-purple-50' : 
             activeService === 'Nourish Store' ? 'bg-emerald-50' : 'bg-stone-50')
          )}>

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
                        {displayDishes.map((dish) => (
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
                    <Link href="/booking">Book a Cook</Link>
                  </Button>
                </div>
              </section>
            )}

            {activeService === 'Maid' && (
              <MaidServiceTab />
            )}

            {activeService === 'Nourish Store' && (
              <section className="container mx-auto px-6 text-center py-10">
                <Badge className="bg-emerald-500/10 text-emerald-600 font-bold py-1 px-4 text-xs uppercase tracking-widest border-none mb-4">New Launch</Badge>
                <h2 className="section-title">Nourish Store</h2>
                <p className="text-text-secondary max-w-2xl mx-auto mt-4 text-lg">
                  The ultimate destination for unadulterated goodness. Only verified healthy items: from cold-pressed oils and ancient grain millet ladoos, to premium Kashmiri saffron and natural A2 Cow Kulfi. Zero chemicals, zero compromise.
                </p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="flex gap-6 text-left p-6 rounded-3xl bg-surface border shadow-sm hover:border-emerald-500/30 transition-all">
                    <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl h-fit shrink-0">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Artisan & Cold-Pressed</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Authentic A2 cow milk treats, pure Kashmiri saffron, apples, and traditionally milled cold-pressed oils. Your body will thank you.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-left p-6 rounded-3xl bg-surface border shadow-sm hover:border-emerald-500/30 transition-all">
                    <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl h-fit shrink-0">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Strictly Curated Inventory</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">We strictly prohibit anything that harms the human system. If it's on Nourish Store, it's 100% wholesome and lab-verified.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-12 text-center px-4">
                  <Button asChild variant="cta" size="lg" className="w-full sm:w-auto h-14 px-12 font-bold text-lg shadow-xl touch-manipulation active:scale-95 transition-all">
                    <Link href="/marketplace">Browse Store Catalog</Link>
                  </Button>
                </div>
              </section>
            )}

            {activeService === 'Elder help' && (
              <section className="container mx-auto px-6 py-12 min-h-[40vh]">
                <ElderCareRequestForm />
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

        {/* Sticky Floating bottom CTA */}
        {ctaConfig && CTAIcon && (
          <div className={cn(
            "fixed z-45 transition-all duration-500 transform",
            showFloatingCTA 
              ? "opacity-100 translate-y-0 scale-100" 
              : "opacity-0 translate-y-10 scale-90 pointer-events-none",
            "bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0"
          )}>
            <Button
              asChild
              className={cn(
                "rounded-full px-6 py-4 md:px-8 md:py-6 h-12 md:h-16 text-sm md:text-lg font-black tracking-tight uppercase shadow-2xl flex items-center gap-2 md:gap-3 transition-transform active:scale-95 group border border-white/10",
                ctaConfig.color
              )}
            >
              <Link href={ctaConfig.href}>
                <CTAIcon className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                <span>{ctaConfig.text}</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1 ml-1" />
              </Link>
            </Button>
          </div>
        )}

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
