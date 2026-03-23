'use server';
/**
 * @fileOverview Provides personalized cooking slot recommendations based on user dietary needs, preferences, and calorie targets.
 *
 * - getPersonalizedSlotRecommendations - A function that returns personalized cooking slot recommendations.
 * - PersonalizedSlotRecommendationsInput - The input type for the getPersonalizedSlotRecommendations function.
 * - PersonalizedSlotRecommendationsOutput - The return type for the getPersonalizedSlotRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedSlotRecommendationsInputSchema = z.object({
  dietaryNeeds: z
    .string()
    .describe('The user specified dietary needs e.g. Vegetarian, Vegan, Gluten-Free.'),
  foodPreferences: z
    .string()
    .describe('The users preferred food types or cuisines e.g. Italian, Mexican, Seafood.'),
  calorieTarget: z
    .number()
    .describe('The users daily calorie target, as a number e.g. 2000.'),
  availableSlots: z
    .string()
    .describe(
      'A list of available cooking slots, including date and time. Format as a JSON string.'
    ),
});
export type PersonalizedSlotRecommendationsInput = z.infer<
  typeof PersonalizedSlotRecommendationsInputSchema
>;

const PersonalizedSlotRecommendationsOutputSchema = z.object({
  recommendedSlots: z
    .string()
    .describe(
      'A list of cooking slot recommendations that align with the users dietary needs, preferences, and calorie target. Format as a JSON string.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the slot recommendations.'),
});
export type PersonalizedSlotRecommendationsOutput = z.infer<
  typeof PersonalizedSlotRecommendationsOutputSchema
>;

export async function getPersonalizedSlotRecommendations(
  input: PersonalizedSlotRecommendationsInput
): Promise<PersonalizedSlotRecommendationsOutput> {
  return personalizedSlotRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSlotRecommendationsPrompt',
  input: {schema: PersonalizedSlotRecommendationsInputSchema},
  output: {schema: PersonalizedSlotRecommendationsOutputSchema},
  prompt: `You are a cooking slot recommendation expert. You will analyze a users dietary needs,
preferences, calorie target and available cooking slots to provide personalized recommendations.

Dietary Needs: {{{dietaryNeeds}}}
Food Preferences: {{{foodPreferences}}}
Calorie Target: {{{calorieTarget}}}
Available Slots: {{{availableSlots}}}

Based on the information above, provide a list of recommended cooking slots that best suit the user. Explain your reasoning for each recommendation.

Format the output as a JSON string for recommendedSlots and include a field for reasoning.
`,
});

const personalizedSlotRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedSlotRecommendationsFlow',
    inputSchema: PersonalizedSlotRecommendationsInputSchema,
    outputSchema: PersonalizedSlotRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
