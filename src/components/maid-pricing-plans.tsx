import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const maidPricingPlans = [
  {
    name: "Quick Fix",
    price: "₹100",
    period: "/ 30 mins",
    tagline: "Perfect for trying us out or managing quick post-meal kitchen resets.",
    features: [
      "One visit, 30 mins",
      "Utensils or Floor Sweeping",
      "Standard slot availability",
    ],
    cta: "Book 30 Mins",
    plan: "quick-fix",
    highlight: false,
    solidBg: false
  },
  {
    name: "Daily Reset",
    price: "₹200",
    period: "/ 1 hour",
    tagline: "The standard daily requirement for a 2BHK.",
    features: [
      "One visit, 60 mins",
      "Floors + Utensils + Surface wipe",
      "Priority slot booking",
    ],
    cta: "Book 1 Hour",
    plan: "daily-reset",
    highlight: false,
    solidBg: false
  },
  {
    name: "Monthly Peace Plan",
    price: "₹5,500",
    period: "/ month",
    tagline: "For households that never want to manage a maid again.",
    features: [
      "30-Day Service Guarantee (excluding public holidays)",
      "Zero Disruption: Automatic backup replacement",
      "Covers Deep Sweeping, Mopping & Utensils",
      "Dedicated Support Manager",
    ],
    cta: "Go Monthly",
    plan: "monthly",
    highlight: true,
    solidBg: true
  },
]

export function MaidPricingPlans() {
  return (
    <section className="section bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto px-4">
            <Badge className="bg-badge-bg text-badge-text font-medium py-1 px-4 text-sm border-none">Plans & Pricing</Badge>
            <h2 className="section-title mt-2">Flexible Plans for a Spotless Home</h2>
            <p className="text-text-secondary mt-4">
              Try us out for a quick chore, or put your home infrastructure on complete autopilot with our No-Disruption monthly plan.
            </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-12 items-stretch px-4">
            {maidPricingPlans.map((plan) => (
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
                         <Button asChild variant={plan.solidBg ? "cta" : "outline"} size="lg" className={cn("w-full h-14 text-base font-bold rounded-2xl touch-manipulation active:scale-95", plan.solidBg ? "shadow-lg bg-orange-500 hover:bg-orange-600 text-white" : "border-2 border-orange-500 text-orange-600 hover:bg-orange-50")}>
                            <Link href={`/booking?plan=${plan.plan}`}>{plan.cta}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </section>
  )
}
