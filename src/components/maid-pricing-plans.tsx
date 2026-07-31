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
    price: "₹3,960",
    period: "/ month (starts at)",
    tagline: "For households that never want to manage a maid again.",
    features: [
      "No Chutti: Maid comes all 30 days of the month",
      "Zero Disruption: Automatic backup replacement",
      "No Questions Asked Replacements if unsatisfied",
      "Covers Deep Sweeping, Mopping & Utensils",
      "Dedicated Support Manager & Support",
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mt-2 text-text-primary">Flexible Plans for a Spotless Home</h2>
            <p className="text-text-secondary mt-4">
              Try us out for a quick chore, or put your home infrastructure on complete autopilot with our No-Disruption monthly plan.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 items-stretch px-4 max-w-4xl mx-auto">
            {maidPricingPlans.map((plan) => (
                <Card 
                    key={plan.name} 
                    className={cn(
                        "flex flex-col rounded-2xl md:rounded-3xl shadow-sm transition-all duration-300 border-2",
                        plan.highlight ? "md:scale-105 bg-surface border-green-primary/30 shadow-md" : "bg-surface/70 border-surface-border hover:border-primary/20"
                    )}
                >
                    <CardHeader className="p-4 md:p-5 relative">
                        {plan.highlight && (
                          <Badge className="absolute top-0 -translate-y-1/2 bg-primary text-white font-bold py-0.5 px-2 text-[9px] uppercase tracking-widest border-none">Most Popular</Badge>
                        )}
                        <h3 className="font-bold text-sm md:text-base text-text-primary">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-xl md:text-2xl font-black text-text-primary">{plan.price}</span>
                          <span className="text-text-secondary font-bold text-[9px] md:text-[10px]">{plan.period}</span>
                        </div>
                        <CardDescription className="text-text-secondary pt-1 text-[11px] md:text-xs font-medium leading-snug">{plan.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-5 pt-0 flex-1">
                        <ul className="space-y-1.5 md:space-y-2">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                    <Check className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-primary mt-0.5 shrink-0" />
                                    <span className="text-text-secondary text-[11px] md:text-xs font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="p-4 md:p-5 pt-0">
                         <Button asChild variant={plan.solidBg ? "cta" : "outline"} size="sm" className={cn("w-full h-9 md:h-10 text-xs font-bold rounded-xl md:rounded-xl touch-manipulation active:scale-95", plan.solidBg ? "shadow-sm bg-orange-500 hover:bg-orange-600 text-white" : "border-2 border-orange-500 text-orange-600 hover:bg-orange-50")}>
                            <Link href={`/booking/maid?plan=${plan.plan}`}>{plan.cta}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </section>
  )
}
