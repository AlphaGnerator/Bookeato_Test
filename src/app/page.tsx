
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LandingHeader } from '@/components/landing-header';
import { ChefHat, Shield, Check, ArrowRight, IndianRupee, Flame, Soup, Activity, Loader2, Sparkles, SprayCan, Baby, HeartPulse, User, Users, HeartHandshake, ShoppingBasket, Store, Briefcase, Plus, Minus } from 'lucide-react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { BottomNav } from '@/components/bottom-nav';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import * as React from 'react';
import { BookingStepper } from '@/app/booking/booking-stepper';
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

const curatedMealPlans = [
  {
    id: 'plan-high-protein',
    title: 'High Protein Weekly Plan',
    badge: 'Fitness & Muscle',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    pointers: ['High Protein & Fiber', 'Muscle Gain Support', 'Customized Macros']
  },
  {
    id: 'plan-kids-friendly',
    title: 'Kids Friendly Meal Plan',
    badge: 'Family Favorite',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800&auto=format&fit=crop',
    pointers: ['Zero Refined Sugar', 'Mild Spices & Flavors', 'Hidden Veggie Goodness']
  },
  {
    id: 'plan-elderly',
    title: 'Elderly Care Meal Plan',
    badge: 'Gentle & Soft',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop',
    pointers: ['Easy to Digest Khichdi', 'Low Sodium & Oil', 'Traditional Home Comforts']
  },
  {
    id: 'plan-quick-recipes',
    title: 'Quick Recipes Plan',
    badge: 'Busy Workdays',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop',
    pointers: ['20-Min Fast Cooking', 'Quick Omelette & Scrambles', 'For Busy Professionals']
  },
  {
    id: 'plan-bld',
    title: 'Breakfast, Lunch & Dinner Plan',
    badge: 'Full Day Package',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=800&auto=format&fit=crop',
    pointers: ['3 Complete Daily Meals', 'Fresh Cooked Daily', 'Full Menu Variety']
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
      "Complimentary access to Marketplace early deals.",
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
        imageUrl: '/carousel/carousel_cook_bg.png?v=11',
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
        imageUrl: '/carousel/carousel_maid_bg.png?v=11',
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
        imageUrl: '/carousel/carousel_elderly_bg.png?v=11',
        hasBurnedText: false,
        features: [
          "Certified Specialists: Warm, professional caregivers trained in elder care.",
          "Direct Callbacks: Customized support matching your needs.",
          "Safety & Trust: Background verified and continuously monitored."
        ]
    },
    { 
        id: 'pantry',
        title: 'Just Marketplace', 
        description: 'No subscription required. Shop authentic, lab-tested pantry staples on-demand.',
        price: '0',
        cta: 'Visit Marketplace',
        link: '/marketplace',
        imageUrl: '/carousel/carousel_pantry_bg.png?v=11',
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
function RoleSelectionPopup() {
    const [open, setOpen] = React.useState(false);
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            const timer = setTimeout(() => {
                setOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, isUserLoading]);

    const handleClose = (openState: boolean) => {
        setOpen(openState);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[95vw] max-w-[425px] overflow-hidden rounded-2xl p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-black text-center">Welcome to Bookeato!</DialogTitle>
                    <DialogDescription className="text-center text-sm sm:text-lg">
                        Please select how you would like to proceed.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <Button 
                        variant="cta" 
                        size="lg" 
                        onClick={() => { handleClose(false); router.push('/login'); }}
                        className="w-full text-sm sm:text-base h-auto min-h-[4rem] py-4 touch-manipulation active:scale-95 flex items-center justify-start sm:justify-center gap-4 px-4"
                    >
                        <User className="w-10 h-10 shrink-0" /> 
                        <span className="text-left leading-tight">Login / Register as Customer</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => { handleClose(false); router.push('/partner-signup'); }}
                        className="w-full text-sm sm:text-base h-auto min-h-[4rem] py-4 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 touch-manipulation active:scale-95 flex items-center justify-start sm:justify-center gap-4 px-4"
                    >
                        <Briefcase className="w-10 h-10 shrink-0" /> 
                        <span className="text-left leading-tight">Login / Register as Partner/Househelp</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => { handleClose(false); router.push('/seller-signup'); }}
                        className="w-full text-sm sm:text-base h-auto min-h-[4rem] py-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 touch-manipulation active:scale-95 flex items-center justify-start sm:justify-center gap-4 px-4"
                    >
                        <Store className="w-10 h-10 shrink-0" /> 
                        <span className="text-left leading-tight">Login / Register as Marketplace Seller</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function HomeMarketplaceItemCard({ product }: { product: any }) {
  const { marketplaceCart, addToMarketplaceCart, updateMarketplaceQuantity } = useCulinaryStore();
  const cartItem = marketplaceCart.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 overflow-hidden shadow-md shadow-stone-200/40 flex flex-row sm:flex-col justify-between group hover:border-emerald-500/50 transition-all p-3 sm:p-0 gap-3 sm:gap-0">
      <div className="relative w-28 h-28 sm:w-full sm:h-48 shrink-0 rounded-xl sm:rounded-none bg-stone-100 overflow-hidden">
        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-stone-900/80 backdrop-blur-md text-yellow-400 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1">
          ★ {product.rating}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between p-0 sm:p-4 space-y-1 sm:space-y-2">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">By {product.sellerName}</span>
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight">{product.name}</h3>
            <span className="font-black text-stone-900 text-sm sm:text-base shrink-0">₹{product.price}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-400 font-medium">{product.unit}</p>
        </div>
        <div className="pt-1">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-stone-100 rounded-xl p-1 h-8 sm:h-10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg hover:bg-white text-stone-600 shadow-none"
                onClick={() => updateMarketplaceQuantity(product.id, quantity - 1)}
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="font-black text-stone-950 text-xs sm:text-base">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg hover:bg-white text-stone-600 shadow-none"
                onClick={() => updateMarketplaceQuantity(product.id, quantity + 1)}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full h-8 sm:h-10 rounded-xl bg-stone-950 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm hover:bg-emerald-600"
              onClick={() => addToMarketplaceCart(product)}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
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
    if (savedService && ['Cook', 'Maid', 'Elder help', 'Marketplace'].includes(savedService)) {
        setActiveService(savedService);
    }
    
    const handleServiceChange = (e: any) => {
        if (e.detail && ['Cook', 'Maid', 'Elder help', 'Marketplace'].includes(e.detail)) {
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
      case 'Marketplace':
        return {
          text: 'Browse Marketplace',
          href: '/marketplace',
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          icon: ShoppingBasket,
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

  const topServices = [
    { id: 'Marketplace', name: 'Marketplace', image: '/images/human_marketplace.png', themeBg: 'bg-[#3bc166] text-white border-[#3bc166]' },
    { id: 'Bookeato Live', name: 'Bookeato Live', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop', isOrange: true, themeBg: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white' },
  ];

  const bottomServices = [
    { id: 'Cook', name: 'Cook', image: '/images/indian_cook.png', themeBg: 'bg-yellow-400 border-yellow-500 text-stone-950', colorHex: '#facc15' },
    { id: 'Maid', name: 'Maid', image: '/images/indian_maid.png', themeBg: 'bg-yellow-400 border-yellow-500 text-stone-950', colorHex: '#facc15' },
    { id: 'Elder help', name: 'Elder Care', image: '/images/indian_elder_care.png', themeBg: 'bg-yellow-400 border-yellow-500 text-stone-950', colorHex: '#facc15' },
    { id: 'Yoga & Wellness', name: 'Yoga & Wellness', image: '/images/yoga_wellness.png', themeBg: 'bg-yellow-400 border-yellow-500 text-stone-950', colorHex: '#facc15' },
    { id: 'Sports Coach', name: 'Sports Coach', image: '/images/sports_coach.png', themeBg: 'bg-yellow-400 border-yellow-500 text-stone-950', colorHex: '#facc15' },
  ];

  return (
    <>
      <RoleSelectionPopup />
      <LandingHeader />
      <div className="pt-16 md:pt-20 bg-surface">
        <main>
          {/* Coast-to-Coast Hero Section */}
          <section className="relative w-full aspect-[16/9] overflow-hidden bg-stone-950 group">
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
                                   if (slide.id === 'pantry') {
                                       router.push('/marketplace');
                                       return;
                                   }
                                   const serviceMapping: Record<string, string> = {
                                       cook: 'Cook',
                                       maid: 'Maid',
                                       elder: 'Elder help',
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
                                        className="object-cover object-center transition-transform duration-700 ease-in-out scale-100 group-hover:scale-105"
                                        priority={idx === 0}
                                    />
                                  </div>
                                  {!slide.hasBurnedText && (
                                     <>
                                       <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/45 to-stone-950/10 md:from-stone-950/95 md:via-stone-950/40 md:to-transparent pointer-events-none" />
                                       
                                       {/* Slide Specific Content */}
                                       <div className="relative z-20 container mx-auto px-4 sm:px-6 pt-16 md:pt-0 pb-16 md:pb-28 text-left flex flex-col items-start gap-2 md:gap-3 h-full justify-end">
                                           <Badge className="bg-orange-500/90 text-white border-none shadow-lg px-3 py-1 text-[8px] md:text-[10px] uppercase tracking-widest font-black">{slide.badge}</Badge>
                                           <div className="max-w-2xl">
                                             <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 tracking-tight drop-shadow-2xl leading-tight">{slide.title}</h3>
                                             <p className="text-xs sm:text-base md:text-lg lg:text-xl text-stone-200 font-bold max-w-[95%] drop-shadow-md">{slide.subtitle}</p>
                                           </div>
                                           {slide.features && (
                                              <ul className="hidden md:flex flex-col gap-1.5 mt-1 mb-3 max-w-xl text-stone-100">
                                                 {slide.features.map((feature, fIdx) => (
                                                    <li key={fIdx} className="flex items-start gap-1.5 text-xs font-semibold">
                                                       <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                                                       <span className="drop-shadow-md text-stone-200">{feature}</span>
                                                    </li>
                                                 ))}
                                              </ul>
                                           )}
                                           <div className="flex gap-3 mt-1 items-center flex-wrap">
                                             <Button 
                                                 variant="cta" 
                                                 size="lg" 
                                                 className="rounded-xl shadow-2xl touch-manipulation active:scale-95 group/btn border border-white/20 relative z-40 font-bold text-sm h-11 px-6" 
                                                 onClick={(e) => {
                                                     e.preventDefault();
                                                     e.stopPropagation();
                                                     if (slide.link.startsWith('#')) {
                                                         const serviceMapping: Record<string, string> = {
                                                             elder: 'Elder help',
                                                             pantry: 'Marketplace'
                                                         };
                                                         if (serviceMapping[slide.id]) {
                                                             setActiveService(serviceMapping[slide.id]);
                                                         }
                                                         document.getElementById(slide.link.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                                                     } else {
                                                         router.push(slide.link);
                                                     }
                                                 }}
                                             >
                                                 <span className="flex items-center gap-1">
                                                     {slide.cta} <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                                 </span>
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
              className="relative pt-6 pb-0 bg-white overflow-visible z-20"
          >
             <div className="sticky top-16 md:top-20 z-45 w-full bg-white transition-all duration-300 py-3 md:py-4 border-b border-stone-200/20 shadow-sm mt-0">
                 <div className="container mx-auto px-2 md:px-6 relative z-30 space-y-4">
                     {/* Layer 1: Top Featured Row (Marketplace & Bookeato Live) - Prominent Extra Large Cards covering white space */}
                     <div className="flex justify-center gap-3 sm:gap-6 w-full px-2 sm:px-4 max-w-6xl mx-auto">
                         {topServices.map((service) => {
                             const isActive = activeService === service.id;

                             return (
                                 <button
                                     key={service.id}
                                     onClick={() => {
                                         if (service.id === 'Bookeato Live') {
                                             router.push('/live');
                                         } else if (service.id === 'Marketplace') {
                                             router.push('/marketplace');
                                         } else {
                                             setActiveService(service.id);
                                         }
                                     }}
                                     className={cn(
                                         "relative flex flex-row items-center gap-3.5 sm:gap-6 transition-all duration-300 ease-in-out cursor-pointer px-4 sm:px-8 md:px-10 py-4 sm:py-6 md:py-7 rounded-2xl sm:rounded-3xl border-2 shadow-xl flex-1 justify-start sm:justify-center active:scale-95 group",
                                         service.themeBg,
                                         isActive 
                                            ? "ring-4 ring-white/60 scale-105 z-40 border-2 border-white shadow-2xl font-black" 
                                            : "opacity-95 hover:opacity-100 hover:scale-[1.02] border-white/30"
                                     )}
                                 >
                                     <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 border-white/50 group-hover:scale-105 transition-transform duration-300">
                                         <Image src={service.image} alt={service.name} fill className="object-cover" sizes="120px" />
                                     </div>
                                     <div className="text-left space-y-1">
                                         <span className="font-black text-base sm:text-2xl md:text-3xl tracking-tight block leading-none">
                                             {service.name}
                                         </span>
                                         <span className="text-xs sm:text-base font-extrabold opacity-95 flex items-center gap-2 pt-0.5">
                                             {service.id === 'Bookeato Live' ? (
                                                 <>
                                                     <span className="relative flex h-3 w-3">
                                                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                                                         <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                     </span>
                                                     <span className="font-black">Live Society Kitchens</span>
                                                 </>
                                             ) : (
                                                 '🛒 Organic Store & Pickles'
                                             )}
                                         </span>
                                         <p className="text-[10px] sm:text-xs font-semibold opacity-90 hidden sm:block">
                                             {service.id === 'Bookeato Live' 
                                                 ? 'Order freshly cooked meals from top society cooks near you'
                                                 : 'Farm-fresh organic produce, BILONA Ghee, and homemade pickles'}
                                         </p>
                                     </div>
                                 </button>
                             );
                         })}
                     </div>

                     {/* Layer 2: Bottom Row Touch Carousel (Cook, Maid, Elder Care, Yoga & Wellness, Sports Coach) */}
                     <div className="flex justify-start md:justify-center w-full overflow-x-auto no-scrollbar items-end px-1.5 md:px-4 gap-2 md:gap-3 py-1 touch-pan-x scroll-smooth">
                         {bottomServices.map((service) => {
                             const isActive = activeService === service.id;

                             return (
                                 <button
                                     key={service.id}
                                     onClick={() => setActiveService(service.id)}
                                     className={cn(
                                         "relative flex flex-col items-center transition-all duration-300 ease-in-out cursor-pointer shrink-0 min-w-[92px] sm:min-w-[110px] md:min-w-0 md:flex-1 border",
                                         service.themeBg,
                                         isActive 
                                            ? "rounded-t-[1.2rem] md:rounded-t-[2.5rem] pt-3 pb-4 md:pt-4 md:pb-6 shadow-[0_-10px_20px_-3px_rgba(0,0,0,0.15)] z-40 border-t-4 border-x-0 border-b-0 border-stone-900/30 scale-105 font-black ring-2 ring-black/10"
                                            : "hover:opacity-90 rounded-[1.2rem] md:rounded-[2rem] pt-2.5 pb-3.5 mx-0.5 md:mx-1 z-10 shadow-sm transform scale-95 opacity-90 mb-1"
                                     )}
                                 >
                                     {/* Flared Corner Visual Illusions for Active Tab to blend perfectly */}
                                     {isActive && (
                                        <>
                                           {/* Fill the bottom gap */}
                                           <div className={cn("absolute inset-x-0 bottom-0 h-4 md:h-6 z-40 translate-y-[2px] md:translate-y-[3px]", service.themeBg)}></div>
                                           
                                           {/* Left Flare Curve */}
                                           <svg 
                                             className="absolute bottom-0 -left-3 md:-left-4 w-3 h-3 md:w-4 md:h-4 z-50 text-current translate-y-[2px] md:translate-y-[3px]" 
                                             style={{ color: service.colorHex }}
                                             viewBox="0 0 24 24" 
                                             fill="currentColor"
                                           >
                                               <path d="M0,24 L24,24 L24,0 C24,13.25 13.25,24 0,24 Z" />
                                           </svg>

                                           {/* Right Flare Curve */}
                                           <svg 
                                             className="absolute bottom-0 -right-3 md:-right-4 w-3 h-3 md:w-4 md:h-4 z-50 text-current scale-x-[-1] translate-y-[2px] md:translate-y-[3px]" 
                                             style={{ color: service.colorHex }}
                                             viewBox="0 0 24 24" 
                                             fill="currentColor"
                                           >
                                               <path d="M0,24 L24,24 L24,0 C24,13.25 13.25,24 0,24 Z" />
                                           </svg>
                                        </>
                                     )}
                                     
                                     <div className={cn(
                                         "relative transition-transform duration-300 rounded-xl overflow-hidden shadow-sm border border-black/10", 
                                         isActive ? "w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 drop-shadow-md scale-110 mb-1.5 mt-1" : "w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-1 mt-0.5 opacity-95"
                                     )}>
                                         <Image src={service.image} alt={service.name} fill className="object-cover" sizes="(max-width: 768px) 64px, 80px" />
                                     </div>
                                     <span className={cn(
                                         "font-black tracking-tight mt-1 transition-all text-center leading-[1.1] mb-0.5 line-clamp-1 text-stone-950",
                                         isActive ? "text-[11px] sm:text-xs md:text-lg scale-100 px-0.5" : "text-[9px] sm:text-[10px] md:text-sm font-bold scale-95 px-0.5 opacity-90"
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
             activeService === 'Marketplace' ? 'bg-emerald-50' : 'bg-stone-50')
          )}>

            {activeService === 'Cook' && (
              <div className="space-y-16">
                {/* Configure your daily visit section */}
                <section className="container mx-auto px-4 md:px-6">
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center p-12 bg-white rounded-[2rem] border-4 border-stone-100 shadow-xl shadow-stone-200/50 max-w-3xl mx-auto">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3bc166] mr-3" />
                      <span className="font-bold text-stone-500">Loading booking options...</span>
                    </div>
                  }>
                    <BookingStepper />
                  </React.Suspense>
                </section>

                {/* Today’s chef-crafted picks */}
                <section className="dish-slider pt-8">
                  <div className="container slider-header text-center mb-6">
                    <h2 className="section-title">Today’s chef-crafted picks</h2>
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
                      <CarouselContent className="-ml-2 sm:-ml-4 px-2 sm:px-4">
                          {displayDishes.map((dish) => (
                              <CarouselItem key={dish.id} className="pl-2 sm:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                                   <div className="p-0.5 h-full">
                                      <Card className="overflow-hidden rounded-xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border-none h-full bg-surface">
                                          <CardContent className="p-0 flex flex-col h-full">
                                              <Image 
                                                  data-ai-hint={dish.hint}
                                                  src={dish.image} 
                                                  alt={dish.name} 
                                                  width={300}
                                                  height={200}
                                                  className="w-full h-24 sm:h-32 md:h-40 object-cover"
                                              />
                                              <div className="p-2 sm:p-3 md:p-4 bg-[#fde047] flex-1 flex flex-col">
                                                  <h3 className="font-bold text-xs sm:text-base md:text-lg text-text-primary mb-1 line-clamp-1">{dish.name}</h3>
                                                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-2">
                                                  {dish.tags.map(tag => (
                                                      <Badge key={tag} variant="secondary" className="text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold tracking-wider px-1 py-0 border-none">{tag}</Badge>
                                                  ))}
                                                  </div>
                                                   <div className="grid grid-cols-3 gap-0.5 text-center mt-auto pt-2 border-t border-black/10">
                                                      <div>
                                                          <p className="text-[8px] font-bold text-muted-foreground uppercase">Kcal</p>
                                                          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">{dish.calories}</p>
                                                      </div>
                                                      <div className="border-x border-black/10 px-0.5">
                                                          <p className="text-[8px] font-bold text-muted-foreground uppercase">Prot</p>
                                                          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">{dish.protein}g</p>
                                                      </div>
                                                      <div>
                                                          <p className="text-[8px] font-bold text-muted-foreground uppercase">Carb</p>
                                                          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">{dish.carbs}g</p>
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
                </section>

                {/* Popular Meal Plans Carousel */}
                <section className="dish-slider pt-10">
                  <div className="container slider-header text-center mb-6">
                    <Badge className="bg-amber-500/10 text-amber-700 font-bold px-3 py-1 text-[10px] uppercase tracking-widest border-none mb-2">Tailored Culinary Plans</Badge>
                    <h2 className="section-title text-2xl md:text-4xl font-black text-stone-900">Popular Meal Plans</h2>
                  </div>
                  <Carousel
                      opts={{
                          align: "start",
                          loop: true,
                      }}
                      plugins={[
                          Autoplay({
                            delay: 4000,
                            stopOnInteraction: true,
                          }),
                      ]}
                      className="w-full"
                  >
                      <CarouselContent className="-ml-2 sm:-ml-4 px-2 sm:px-4">
                          {curatedMealPlans.map((plan) => (
                              <CarouselItem key={plan.id} className="pl-2 sm:pl-3 basis-[70%] sm:basis-1/3 lg:basis-1/4">
                                   <div className="p-1 h-full">
                                      <Card className="overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all border border-stone-200/80 h-full bg-white flex flex-col justify-between group">
                                          <CardContent className="p-0 flex flex-col h-full">
                                              <div className="relative w-full h-28 sm:h-32 md:h-36 overflow-hidden bg-stone-100">
                                                  <Image 
                                                      src={plan.image} 
                                                      alt={plan.title} 
                                                      fill
                                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                  />
                                                  <div className="absolute top-2.5 left-2.5">
                                                      <Badge className="bg-orange-500 text-white font-black border-none px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm">
                                                          {plan.badge}
                                                      </Badge>
                                                  </div>
                                              </div>
                                              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                                                  <div>
                                                      <h3 className="font-extrabold text-stone-950 text-xs sm:text-sm md:text-base leading-tight mb-2">{plan.title}</h3>
                                                      
                                                      {/* Relevant pointers instead of Kcal/Prot/Carbs */}
                                                      <div className="space-y-1.5 border-t border-stone-100 pt-2">
                                                          {plan.pointers.map((pointer, pIdx) => (
                                                              <div key={pIdx} className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
                                                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                                      <Check className="w-2 h-2 stroke-[3]" />
                                                                  </div>
                                                                  <span className="line-clamp-1">{pointer}</span>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>

                                                  <div className="pt-1">
                                                      <Button asChild className="w-full h-9 rounded-xl bg-stone-950 text-white font-bold text-xs hover:bg-orange-600 active:scale-95 transition-all shadow-sm">
                                                          <Link href={`/booking/menu?mealPlan=${plan.id}`}>Select Plan →</Link>
                                                      </Button>
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
                </section>
              </div>
            )}

            {activeService === 'Maid' && (
              <MaidServiceTab />
            )}

            {(activeService === 'Marketplace' || activeService === 'Nourish Store') && (
              <section className="container mx-auto px-4 md:px-6 py-10 space-y-12">
                <div className="text-center max-w-3xl mx-auto space-y-3">
                  <Badge className="bg-emerald-500/10 text-emerald-700 font-bold py-1 px-4 text-xs uppercase tracking-widest border-none">Healthy & Pure</Badge>
                  <h2 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">Bookeato Marketplace</h2>
                  <p className="text-stone-500 max-w-2xl mx-auto text-base md:text-lg font-medium">
                    Unadulterated homemade and organic goodies directly from verified local sellers: A2 Ghee, traditional pickles, millet laddus, and cold-pressed oils.
                  </p>
                </div>

                {/* Featured Products Grid directly on homepage tab */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {[
                    {
                      id: 'ghee-001',
                      name: 'A2 Cow Ghee (Bilona)',
                      price: 1250,
                      sellerName: 'Swadeshi Organic Farm',
                      rating: 4.9,
                      image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
                      unit: '500 ml'
                    },
                    {
                      id: 'pickle-001',
                      name: 'Spicy Mango Pickle',
                      price: 280,
                      sellerName: 'Amma\'s Kitchen Spices',
                      rating: 4.8,
                      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600&auto=format&fit=crop',
                      unit: '350 g'
                    },
                    {
                      id: 'laddu-001',
                      name: 'Ragi & Dry Fruit Laddu',
                      price: 450,
                      sellerName: 'NutriBites Homemade',
                      rating: 4.9,
                      image: 'https://images.unsplash.com/photo-1734330931856-77cdf1b5bba9?q=80&w=600&auto=format&fit=crop',
                      unit: '250 g'
                    },
                    {
                      id: 'honey-001',
                      name: 'Wildflower Forest Honey',
                      price: 590,
                      sellerName: 'Himalayan Nectar',
                      rating: 5.0,
                      image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?q=80&w=600&auto=format&fit=crop',
                      unit: '400 g'
                    }
                  ].map((product) => (
                    <HomeMarketplaceItemCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="mt-8 text-center px-4">
                  <Button asChild variant="cta" size="lg" className="w-full sm:w-auto h-14 px-12 font-bold text-lg shadow-xl touch-manipulation active:scale-95 transition-all">
                    <Link href="/marketplace">Explore Full Marketplace Catalog →</Link>
                  </Button>
                </div>
              </section>
            )}

            {activeService === 'Elder help' && (
              <section className="container mx-auto px-6 py-12 min-h-[40vh]">
                <ElderCareRequestForm />
              </section>
            )}

            {activeService === 'Yoga & Wellness' && (
              <section className="container mx-auto px-4 md:px-6 py-12">
                <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-stone-200 shadow-xl space-y-6 text-center">
                  <Badge className="bg-purple-500/10 text-purple-700 font-bold px-4 py-1 text-xs uppercase tracking-widest border-none">Personalized Wellness</Badge>
                  <h2 className="text-3xl md:text-4xl font-black text-stone-900">Yoga & Wellness Instructors</h2>
                  <p className="text-stone-500 text-base md:text-lg font-medium leading-relaxed">
                    Verified yoga masters and wellness coaches at your doorstep. Tailored home sessions for stress relief, flexibility, meditation, and holistic health.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="cta" size="lg" className="h-12 px-8 font-bold text-base shadow-lg">
                      <Link href="/help">Request Yoga Instructor</Link>
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {activeService === 'Sports Coach' && (
              <section className="container mx-auto px-4 md:px-6 py-12">
                <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-stone-200 shadow-xl space-y-6 text-center">
                  <Badge className="bg-blue-500/10 text-blue-700 font-bold px-4 py-1 text-xs uppercase tracking-widest border-none">Professional Training</Badge>
                  <h2 className="text-3xl md:text-4xl font-black text-stone-900">Personal Sports Coaches</h2>
                  <p className="text-stone-500 text-base md:text-lg font-medium leading-relaxed">
                    Train with certified coaches for Cricket, Badminton, Swimming, Tennis, Football, and Fitness Conditioning right in your society or nearby sports turf.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="cta" size="lg" className="h-12 px-8 font-bold text-base shadow-lg">
                      <Link href="/help">Request Sports Coach</Link>
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>

          
          {/* Why Choose Us Section */}
          {activeService === 'Cook' && (
            <>
              <section className="py-8 md:py-16 bg-primary/5">
                <div className="container mx-auto px-4 md:px-6 text-center">
                  <Badge className="bg-badge-bg text-badge-text font-medium py-0.5 px-3 text-xs border-none">Why People Choose Us</Badge>
                  <h2 className="text-xl md:text-3xl font-black mt-1 text-text-primary">Designed for Safety, Taste & Trust</h2>
                  <p className="text-text-secondary max-w-2xl mx-auto mt-2 text-xs md:text-base leading-snug">Every part of your meal is built for consistency, transparency, and peace of mind.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mt-6 md:mt-12 text-left px-2 md:px-4">
                    <article className="bg-white border border-green-primary/20 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm transition-all duration-300 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0">
                        <div className="bg-green-primary/10 text-green-primary shrink-0 p-2.5 md:p-4 rounded-xl md:rounded-2xl md:mb-4">
                            <ChefHat className="h-5 w-5 md:h-8 md:w-8" />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-xl font-bold text-text-primary mb-0.5 md:mb-2">Chef-Curated Menus</h3>
                          <p className="text-text-secondary text-[11px] md:text-sm leading-snug">Designed by experienced chefs and cooked by vetted home cooks. Real ingredients.</p>
                        </div>
                    </article>
                    <article className="bg-white border border-green-primary/20 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm transition-all duration-300 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0">
                        <div className="bg-green-primary/10 text-green-primary shrink-0 p-2.5 md:p-4 rounded-xl md:rounded-2xl md:mb-4">
                            <Shield className="h-5 w-5 md:h-8 md:w-8" />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-xl font-bold text-[#0B1A2E] mb-0.5 md:mb-2">Zero Compromise</h3>
                          <p className="text-xs md:text-sm leading-snug text-[#355067]">Enjoy portions tailored to you. Everything is cooked fresh in your kitchen.</p>
                        </div>
                    </article>
                    <article className="bg-white border border-green-primary/20 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm transition-all duration-300 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0">
                        <div className="bg-green-primary/10 text-green-primary shrink-0 p-2.5 md:p-4 rounded-xl md:rounded-2xl md:mb-4">
                            <IndianRupee className="h-5 w-5 md:h-8 md:w-8" />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-xl font-bold text-text-primary mb-0.5 md:mb-2">Healthy & Fresh</h3>
                          <p className="text-text-secondary text-[11px] md:text-sm leading-snug">Track ingredients and hygiene in real time. Pure home cooking.</p>
                        </div>
                    </article>
                  </div>
                </div>
              </section>

              {/* Plans & Pricing Section */}
              <section className="py-8 md:py-16 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="text-center max-w-2xl mx-auto px-2">
                      <Badge className="bg-badge-bg text-badge-text font-medium py-0.5 px-3 text-xs border-none">Plans & Pricing</Badge>
                      <h2 className="text-xl md:text-3xl lg:text-4xl font-black mt-1 text-text-primary">Flexible Plans for Real Life</h2>
                      <p className="text-text-secondary mt-2 text-xs md:text-base">
                        Choose how deeply you want to plug us into your routine.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 items-stretch px-2 md:px-4 max-w-4xl mx-auto">
                      {pricingPlans.map((plan) => (
                          <Card 
                              key={plan.name} 
                              className={cn(
                                  "flex flex-col rounded-xl md:rounded-3xl shadow-sm transition-all duration-300 border",
                                  plan.highlight ? "bg-surface border-green-primary/40 shadow-md" : "bg-surface/70 border-surface-border"
                              )}
                          >
                              <CardHeader className="p-3 md:p-5 relative">
                                  {plan.highlight && (
                                    <Badge className="absolute top-0 -translate-y-1/2 bg-primary text-white font-bold py-0.5 px-2 text-[8px] uppercase tracking-widest border-none">Most Popular</Badge>
                                  )}
                                  <div className="flex justify-between items-center md:block">
                                    <h3 className="font-extrabold text-xs md:text-base text-text-primary">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg md:text-2xl font-black text-text-primary">{plan.price}</span>
                                      <span className="text-text-secondary font-bold text-[8px] md:text-[10px]">{plan.period}</span>
                                    </div>
                                  </div>
                                  <CardDescription className="text-text-secondary pt-0.5 text-[10px] md:text-xs font-medium leading-tight">{plan.tagline}</CardDescription>
                              </CardHeader>
                              <CardContent className="p-3 md:p-5 pt-0 flex-1">
                                  <ul className="space-y-1 md:space-y-2">
                                      {plan.features.map((feature, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                              <Check className="h-3 w-3 text-green-primary mt-0.5 shrink-0" />
                                              <span className="text-text-secondary text-[10px] md:text-xs font-medium">{feature}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </CardContent>
                              <CardFooter className="p-3 md:p-5 pt-0">
                                   <Button asChild variant="cta" size="sm" className="w-full h-8 md:h-10 text-[11px] font-bold rounded-lg md:rounded-xl touch-manipulation active:scale-95 shadow-sm">
                                      <Link href={`/booking?plan=${plan.plan}`}>{plan.cta}</Link>
                                  </Button>
                              </CardFooter>
                          </Card>
                      ))}
                  </div>
                  <div className="text-center mt-6 md:mt-12 space-y-2 px-4">
                      <Button asChild size="lg" variant="cta" className="w-full sm:w-auto h-10 md:h-12 px-8 font-bold shadow-md text-xs md:text-base active:scale-95">
                          <Link href="/pricing">Get Started with a Plan <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" /></Link>
                      </Button>
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
                "rounded-full px-4 py-3 md:px-6 md:py-4 h-10 md:h-12 text-xs md:text-sm font-black tracking-tight uppercase shadow-2xl flex items-center gap-1.5 md:gap-2 transition-transform active:scale-95 group border border-white/10",
                ctaConfig.color
              )}
            >
              <Link href={ctaConfig.href}>
                <CTAIcon className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                <span>{ctaConfig.text}</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1 ml-1" />
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
