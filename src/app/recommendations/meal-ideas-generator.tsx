'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { suggestMealIdeas, type SuggestMealIdeasOutput } from '@/ai/flows/suggest-meal-ideas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChefHat, Lightbulb, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LoadingState } from "@/components/loading-state";

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export function MealIdeasGenerator() {
  const { user, isInitialized } = useCulinaryStore();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SuggestMealIdeasOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>('Lunch');

  const handleSubmit = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await suggestMealIdeas({
        dietaryRestrictions: user.dietaryNeeds.join(', '),
        preferences: user.foodPreferences.join(', '),
        calorieTarget: user.calorieTarget,
        mealType: mealType,
      });
      if (response.mealIdeas) {
        setResult(response);
      } else {
        setError('Sorry, we couldn\'t generate meal ideas at this time. Please try again.');
      }
    });
  };
  
  if (!isInitialized) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
            <ChefHat className="h-10 w-10 text-primary" />
            <div>
                <h2 className="font-headline text-3xl">Meal Idea Generator</h2>
                <p className="text-muted-foreground">Stuck in a culinary rut? Let AI spark your creativity!</p>
            </div>
        </div>

      <Card className="bg-gradient-to-br from-background to-secondary/30">
        <CardHeader>
          <CardTitle>Get Personalized Meal Ideas</CardTitle>
          <CardDescription>
            Based on your profile, we'll suggest some delicious meal ideas. Your current preferences are:
            <span className="font-semibold text-foreground"> {user.dietaryNeeds.join(', ') || 'No restrictions'}, {user.foodPreferences.join(', ') || 'No preferences'}</span>, with a target of
            <span className="font-semibold text-foreground"> ~{user.calorieTarget} calories per day</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div>
                <Label className="font-medium">Select a meal type:</Label>
                 <RadioGroup
                    defaultValue="Lunch"
                    onValueChange={(value: MealType) => setMealType(value)}
                    className="flex items-center gap-4 mt-2"
                    >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Breakfast" id="r1" />
                        <Label htmlFor="r1">Breakfast</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lunch" id="r2" />
                        <Label htmlFor="r2">Lunch</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Dinner" id="r3" />
                        <Label htmlFor="r3">Dinner</Label>
                    </div>
                </RadioGroup>
            </div>
            <Button variant="accent" onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
                ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest {mealType} Ideas
                </>
                )}
            </Button>
          </div>

          {isPending && (
            <div className="mt-6 border-t pt-6">
                <LoadingState type="cook" message="Consulting our digital chef for the perfect meal..." />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result?.mealIdeas && (
            <div className="mt-6">
                <h3 className="font-headline text-xl mb-4">Here are some ideas for you:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
                    {result.mealIdeas.map((idea, index) => (
                    <li key={index} className="flex items-center gap-3 p-3 rounded-md bg-background border transition-colors hover:bg-primary/5 hover:border-primary/20">
                        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{idea}</span>
                    </li>
                    ))}
                </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
