'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { suggestMealIdeas, type SuggestMealIdeasOutput } from '@/ai/flows/suggest-meal-ideas';
import { Loader2, Sparkles, Coffee, Sun, Moon, Utensils, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

const mealIcons: Record<MealType, React.ReactNode> = {
    Breakfast: <Coffee className="h-6 w-6" />,
    Lunch: <Sun className="h-6 w-6" />,
    Dinner: <Moon className="h-6 w-6" />,
};

interface MealSuggestionState {
  ideas: string[];
  isLoading: boolean;
  error?: string;
}

export function AIMealSuggestions() {
  const { user } = useCulinaryStore();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<Record<MealType, MealSuggestionState>>({
    Breakfast: { ideas: [], isLoading: false },
    Lunch: { ideas: [], isLoading: false },
    Dinner: { ideas: [], isLoading: false },
  });
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchSuggestionsForMeal = async (mealType: MealType) => {
    setSuggestions(prev => ({
        ...prev,
        [mealType]: { ...prev[mealType], isLoading: true, error: undefined },
    }));

    try {
      const response = await suggestMealIdeas({
        dietaryRestrictions: user.dietaryNeeds.join(', '),
        preferences: user.foodPreferences.join(', '),
        calorieTarget: Math.round(user.calorieTarget / 3),
        mealType: mealType,
      });

      setSuggestions(prev => ({
          ...prev,
          [mealType]: { ideas: response.mealIdeas || [], isLoading: false },
      }));

    } catch (e) {
      console.error(e);
      setSuggestions(prev => ({
          ...prev,
          [mealType]: { ...prev[mealType], isLoading: false, error: "Couldn't get suggestions." },
      }));
    }
  };

  const handleGenerateAll = () => {
    setHasGenerated(true);
    startTransition(() => {
        fetchSuggestionsForMeal('Breakfast');
        fetchSuggestionsForMeal('Lunch');
        fetchSuggestionsForMeal('Dinner');
    });
  };

  return (
    <Card className="bg-accent/10 border-accent/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2 font-headline text-3xl">
                    <Sparkles className="h-7 w-7 text-accent" />
                    AI-Powered Meal Plan
                </CardTitle>
                <CardDescription className="mt-2">
                    Personalized dish ideas for today based on your profile.
                    <Link href="/profile" className="ml-2 text-xs text-accent underline-offset-4 hover:underline">Edit Preferences</Link>
                </CardDescription>
            </div>
            {!hasGenerated && (
                <Button variant="accent" onClick={handleGenerateAll} disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Utensils className="mr-2 h-4 w-4" /> Suggest Today's Meals</>}
                </Button>
            )}
        </div>
      </CardHeader>
      
      {hasGenerated && (
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map(mealType => (
                    <div key={mealType}>
                        <h3 className="font-headline text-2xl flex items-center gap-2 text-muted-foreground mb-4">
                            {mealIcons[mealType]}
                            {mealType}
                        </h3>
                        <div className="space-y-3">
                        {suggestions[mealType].isLoading ? (
                            <>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </>
                        ) : suggestions[mealType].error ? (
                             <p className="text-sm text-destructive">{suggestions[mealType].error}</p>
                        ) : (
                            suggestions[mealType].ideas.map((idea, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-background border transition-colors hover:bg-primary/5 hover:border-primary/20">
                                    <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <span>{idea}</span>
                                </div>
                            ))
                        )}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      )}
    </Card>
  );
}
