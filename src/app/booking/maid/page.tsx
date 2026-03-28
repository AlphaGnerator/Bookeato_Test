'use client';

import React, { useState } from 'react';
import { MaidSmartEstimator } from '@/components/maid-smart-estimator';
import { MaidCheckoutDetails } from '@/components/maid-checkout-details';
import { MaidCheckoutSchedule } from '@/components/maid-checkout-schedule';
import { useRouter } from 'next/navigation';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldCheck, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LoadingState } from "@/components/loading-state";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import Autoplay from 'embla-carousel-autoplay';

export default function MaidBookingWizard() {
  const router = useRouter();
  const { user, isInitialized } = useCulinaryStore();
  const [step, setStep] = useState(1);

  if (!isInitialized) {
    return <LoadingState fullPage message="Loading service details..." />;
  }

  const handleEstimatorNext = () => {
    // If user is logged in and has all required details, skip to step 3 (Schedule)
    const hasProfileDetails = (user.contactNumber || user.email) && user.pincode && user.address;
    if (isInitialized && user.id !== 'guest' && hasProfileDetails) {
      setStep(3); 
    } else {
      setStep(2); // Go to Details for guests or incomplete profiles
    }
  };

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const slides = [
    {
      title: "Instant Maid Service",
      subtitle: "Professional, verified, and ready in minutes. Disruption-free service guaranteed.",
      image: "/marketplace/maid_bg_clean.png",
      badges: ["Instant On-Demand", "30-Day Guarantee"]
    },
    {
      title: "Subscription Coming Soon",
      subtitle: "Unlock priority booking and fixed schedules with our upcoming monthly plans.",
      image: "/marketplace/maid_bg_clean.png",
      badges: ["Coming Soon", "Priority Access"]
    }
  ];

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      {/* Premium Service Carousel */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden mb-8 md:mb-12">
        <Carousel 
            plugins={[plugin.current]}
            className="w-full h-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
        >
          <CarouselContent className="h-full -ml-0">
            {slides.map((slide, idx) => (
              <CarouselItem key={idx} className="h-full pl-0">
                <div className="relative w-full h-64 md:h-96 overflow-hidden">
                  <Image 
                    src={slide.image} 
                    alt={slide.title} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent p-6 md:p-12 flex flex-col justify-end">
                    <div className="container mx-auto max-w-4xl px-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {slide.badges.map((badge, bIdx) => (
                          <Badge key={bIdx} className={cn(
                            "text-white font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border-none",
                            badge.includes('Soon') || badge.includes('Priority') ? "bg-orange-500" : "bg-green-500"
                          )}>
                            {badge}
                          </Badge>
                        ))}
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-3">{slide.title}</h1>
                      <p className="text-white/80 text-sm md:text-lg font-bold max-w-xl leading-snug">
                         {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="absolute top-6 left-6 z-10">
          <Button 
            variant="ghost" 
            className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 border-none px-4 py-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
        {step === 1 && (
          <MaidSmartEstimator onNext={handleEstimatorNext} onBack={() => router.back()} />
        )}
        {step === 2 && (
          <MaidCheckoutDetails onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <MaidCheckoutSchedule onBack={() => setStep(2)} />
        )}
      </div>
    </div>
  );
}
