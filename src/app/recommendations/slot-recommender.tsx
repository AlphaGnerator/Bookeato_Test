'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { getPersonalizedSlotRecommendations, type PersonalizedSlotRecommendationsOutput } from '@/ai/flows/personalized-slot-recommendations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarCog, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { CookingSlot } from '@/lib/types';

interface RecommendedSlot extends CookingSlot {
  reason: string;
}

export function SlotRecommender() {
  const { user, slots, isInitialized } = useCulinaryStore();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableSlots = useMemo(() => slots.filter(s => !s.bookedBy), [slots]);

  const handleSubmit = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const response = await getPersonalizedSlotRecommendations({
          dietaryNeeds: user.dietaryNeeds.join(', '),
          foodPreferences: user.foodPreferences.join(', '),
          calorieTarget: user.calorieTarget,
          availableSlots: JSON.stringify(availableSlots.map(s => ({ id: s.id, title: s.title, start: s.start, end: s.end }))),
        });
        
        if (response.recommendedSlots) {
            const parsedSlots = JSON.parse(response.recommendedSlots);
            // The AI might return slot objects. We need to match them with our original slots.
            const recommendations = parsedSlots.map((rec: any) => {
                const originalSlot = availableSlots.find(s => s.id === rec.id);
                return originalSlot ? { ...originalSlot, reason: rec.reason } : null;
            }).filter(Boolean);

          setResult({recommendedSlots: recommendations, reasoning: response.reasoning });
        } else {
          setError('Sorry, we couldn\'t generate recommendations at this time. Please try again.');
        }
      } catch (e) {
        console.error(e);
        setError('An error occurred while parsing recommendations. Please try again.');
      }
    });
  };
  
  if (!isInitialized) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
            <CalendarCog className="h-10 w-10 text-primary" />
            <div>
                <h2 className="font-headline text-3xl">Smart Slot Selector</h2>
                <p className="text-muted-foreground">Find the perfect cooking slot that matches your taste and schedule.</p>
            </div>
        </div>
      <Card className="bg-gradient-to-br from-background to-secondary/30">
        <CardHeader>
          <CardTitle>Find Your Perfect Slot</CardTitle>
          <CardDescription>
            Let our AI analyze your preferences and find the best available cooking slots for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="accent" onClick={handleSubmit} disabled={isPending || availableSlots.length === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Recommend Slots
              </>
            )}
          </Button>
          {availableSlots.length === 0 && <p className="text-sm text-muted-foreground mt-2">No available slots to recommend from.</p>}

          {isPending && (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result?.recommendedSlots && (
            <div className="mt-6">
                <Alert className="mb-6">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle className="font-headline">AI Analysis</AlertTitle>
                    <AlertDescription>{result.reasoning}</AlertDescription>
                </Alert>
                <div className="space-y-4">
                    {result.recommendedSlots.map((slot: RecommendedSlot) => (
                    <Card key={slot.id} className="bg-background">
                        <CardHeader>
                            <CardTitle>{slot.title}</CardTitle>
                            <CardDescription>{format(slot.start, "EEE, MMM d 'at' h:mm a")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic">"{slot.reason}"</p>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
