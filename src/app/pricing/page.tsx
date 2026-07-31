'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Badge } from '@/components/ui/badge';

const pricingTiers = [
  {
    title: 'Day Plan',
    price: '₹200',
    period: '/day',
    description: 'Perfect for trying out a single cooking session.',
    features: [
      'Select dishes from our 5-star chef curated menu',
    ],
    buttonLabel: 'Get Started',
    variant: 'outline',
    plan: 'day',
    tier: 1
  },
  {
    title: 'Weekly Plan',
    price: '₹980',
    period: '/week',
    description: 'Ideal for enthusiasts who cook multiple times a week.',
    features: [
      'Book for 7 days',
      'Weekly personalized meal plan',
      'Priority slot booking',
      'Email support',
    ],
    buttonLabel: 'Choose Weekly',
    variant: 'cta',
    plan: 'weekly',
    tier: 2
  },
  {
    title: 'Monthly Plan',
    price: '₹3300',
    period: '/month',
    description: 'The best value for dedicated home chefs.',
    features: [
      'Book for 30 days',
      'Unlimited slot bookings',
      'Full access to AI tools',
      '24/7 priority support',
    ],
    buttonLabel: 'Go Monthly',
    variant: 'cta',
    plan: 'monthly',
    tier: 3
  },
];


export default function PricingPage() {
  const { user, isInitialized } = useCulinaryStore();
  const currentPlanId = user?.subscription?.status === 'active' || user?.subscription?.status === 'upcoming' 
    ? user.subscription.planId 
    : 'none';
  
  const currentTier = user?.subscription?.tier || 0;

  const filteredTiers = pricingTiers.filter(tier => {
      // If user is on a plan, hide that plan and any lower plans (redundancy fix)
      // Exception: If they are on "none", show all.
      if (currentPlanId === 'none') return true;
      
      // If user has a plan, only show plans with HIGHER tiers (Upgrades)
      return tier.tier > currentTier;
  });

  return (
    <AppLayout pageTitle="Pricing Plans">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl">Find the Perfect Plan</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          {currentPlanId !== 'none' 
            ? `You are currently on the ${currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1)} plan. Looking to level up?` 
            : "Whether you're a casual cook or a culinary master, we have a plan that fits your lifestyle."}
        </p>
      </div>

      {currentPlanId !== 'none' && filteredTiers.length === 0 && (
          <div className="max-w-2xl mx-auto bg-green-50 border-2 border-green-100 rounded-[2rem] p-8 text-center space-y-4 mb-12">
              <Sparkles className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-2xl font-black text-green-900 leading-none tracking-tight">You're on our best plan!</h2>
              <p className="text-green-700 font-medium">You are currently enjoying the full benefits of the Monthly subscription.</p>
              <Button asChild variant="outline" className="border-green-200 mt-2">
                  <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
          </div>
      )}

      <div className={`grid grid-cols-1 ${filteredTiers.length > 2 ? 'md:grid-cols-3' : filteredTiers.length === 2 ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-8 max-w-6xl mx-auto`}>
        {filteredTiers.map((tier) => {
          const isUpgrade = currentTier > 0 && tier.tier > currentTier;
          
          return (
            <Card key={tier.title} className={`flex flex-col rounded-[2rem] overflow-hidden border-2 h-full transition-all ${isUpgrade ? 'border-orange-200 shadow-xl shadow-orange-500/5' : 'border-stone-100'}`}>
              <CardHeader className="p-8">
                <div className="flex justify-between items-start mb-2">
                    <CardTitle className="font-headline text-3xl">{tier.title}</CardTitle>
                    {isUpgrade && <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none font-black uppercase tracking-widest text-[10px]">Upgrade</Badge>}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tighter">{tier.price}</span>
                  <span className="text-muted-foreground font-medium">{tier.period}</span>
                </div>
                <CardDescription className="pt-2 text-stone-500 font-medium leading-relaxed">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 px-8 pb-8">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="bg-green-100 p-0.5 rounded-full mt-0.5"><Check className="h-4 w-4 text-green-600" /></div>
                      <span className="text-stone-700 font-medium text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button asChild className="w-full h-12 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-orange-500/10" variant={tier.variant === 'cta' ? 'default' : 'outline' as any}>
                  <Link href={`/booking?plan=${tier.plan}`}>
                    {isUpgrade ? (
                        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Upgrade Now</span>
                    ) : tier.buttonLabel}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
