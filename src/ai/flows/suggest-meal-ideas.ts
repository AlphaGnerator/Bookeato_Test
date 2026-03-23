'use server';

/**
 * @fileOverview Provides meal ideas tailored to dietary restrictions, preferences, and calorie goals.
 *
 * - suggestMealIdeas - A function that suggests meal ideas based on user preferences.
 * - SuggestMealIdeasInput - The input type for the suggestMealIdeas function.
 * - SuggestMealIdeasOutput - The return type for the suggestMealIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealIdeasInputSchema = z.object({
  dietaryRestrictions: z.string().describe('Any dietary restrictions the user has (e.g., vegetarian, gluten-free).'),
  preferences: z.string().describe('The user food preferences (e.g. Italian, Seafood).'),
  calorieTarget: z.number().describe('The user specified calorie target for the meal.'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner']).describe('The type of meal for which to suggest ideas.'),
});
export type SuggestMealIdeasInput = z.infer<typeof SuggestMealIdeasInputSchema>;

const SuggestMealIdeasOutputSchema = z.object({
  mealIdeas: z.array(z.string()).describe('An array of meal ideas that fit the user preferences.'),
});
export type SuggestMealIdeasOutput = z.infer<typeof SuggestMealIdeasOutputSchema>;

export async function suggestMealIdeas(input: SuggestMealIdeasInput): Promise<SuggestMealIdeasOutput> {
  return suggestMealIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealIdeasPrompt',
  input: {schema: SuggestMealIdeasInputSchema},
  output: {schema: SuggestMealIdeasOutputSchema},
  prompt: `You are a meal suggestion expert. You will provide meal ideas for a specific meal type based on the user's dietary restrictions, preferences, and calorie target.

Meal Type: {{{mealType}}}
Dietary Restrictions: {{{dietaryRestrictions}}}
Preferences: {{{preferences}}}
Calorie Target for this meal: {{{calorieTarget}}}

Provide a list of meal ideas that fit these criteria.`,
});

const suggestMealIdeasFlow = ai.defineFlow(
  {
    name: 'suggestMealIdeasFlow',
    inputSchema: SuggestMealIdeasInputSchema,
    outputSchema: SuggestMealIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
