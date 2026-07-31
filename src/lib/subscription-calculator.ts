
'use server';

import type { UserProfile } from './types';
import type { PricingConfig } from './pricing.types';

export interface PlanPricing {
    planType: 'weekly' | 'monthly';
    totalCost: number;
    dailyEquivalent: number;
    savingsComparedToDaily: number;
    isUpgrade: boolean;
    isCurrentPlan: boolean;
}

export interface SubscriptionCalculation {
    weekly?: PlanPricing;
    monthly?: PlanPricing;
}

/**
 * Generates a database-compatible key for the number of people.
 * @param numPeople - The number of people in the household.
 * @returns A string key like "1_person" or "4_people".
 */
function getPeopleKey(numPeople: number): string {
    if (numPeople <= 1) return "1_person"; // Singular for 1
    if (numPeople >= 2 && numPeople <= 8) return `${numPeople}_people`;
    // Fallback for > 8 people, maps to the highest configured tier.
    return "8_people";
}

/**
 * Maps user-facing meal descriptions to database keys.
 * @param mealCombo - The meal configuration string from the user profile.
 * @returns A valid database key: 'single_meal', 'b_plus_l', or 'three_meal'.
 */
function getMealKey(mealCombo: string): 'single_meal' | 'b_plus_l' | 'three_meal' {
    const rawCombo = mealCombo.toLowerCase();
    if (rawCombo.includes('all') || rawCombo.includes('3')) return 'three_meal';
    if (rawCombo.includes('&') || rawCombo.includes('+')) return 'b_plus_l';
    return 'single_meal'; // Default for 'Breakfast', 'Lunch', 'Dinner'
}

/**
 * Calculates available subscription plan prices based on user's profile and area pricing.
 * @param userProfile - The user's profile, including household configuration.
 * @param pricingConfig - The pricing configuration for the user's pincode.
 * @returns An object containing the calculated prices for available plan upgrades.
 */
export async function calculatePlanPrices(
    userProfile: UserProfile,
    pricingConfig: PricingConfig | null
): Promise<SubscriptionCalculation> {
    if (!pricingConfig) {
        // Return empty if no pricing config is available
        return {};
    }

    const currentUserPlan = (userProfile as any).plan_type || 'daily';
    const peopleKey = getPeopleKey(userProfile.familySize || 1);
    const mealKey = getMealKey(userProfile.plan_config?.meals || 'single_meal');

    const allocatedMinutes = pricingConfig.base_time_slots[peopleKey]?.[mealKey];
    const rates = pricingConfig.rpm_rates.family_standard;
    
    if (!allocatedMinutes || !rates) {
        console.error(`❌ Pricing Lookup Failed: Key '${peopleKey}' or mealKey '${mealKey}' not found in config.`);
        return {};
    }

    const result: SubscriptionCalculation = {};

    // --- Calculate Weekly Plan ---
    if (currentUserPlan === 'daily') {
        const weeklyCost = Math.ceil(allocatedMinutes * rates.weekly * 7);
        const standardCost = Math.ceil(allocatedMinutes * rates.daily * 7);
        result.weekly = {
            planType: 'weekly',
            totalCost: weeklyCost,
            dailyEquivalent: Math.ceil(weeklyCost / 7),
            savingsComparedToDaily: standardCost - weeklyCost,
            isUpgrade: false,
            isCurrentPlan: false,
        };
    }

    // --- Calculate Monthly Plan ---
    if (currentUserPlan !== 'monthly') {
        const monthlyCost = Math.ceil(allocatedMinutes * rates.monthly * 30);
        const standardCost = Math.ceil(allocatedMinutes * rates.daily * 30);
        result.monthly = {
            planType: 'monthly',
            totalCost: monthlyCost,
            dailyEquivalent: Math.ceil(monthlyCost / 30),
            savingsComparedToDaily: standardCost - monthlyCost,
            isUpgrade: currentUserPlan === 'weekly',
            isCurrentPlan: false,
        };
    } else {
        // User is already on the monthly plan
        const monthlyCost = Math.ceil(allocatedMinutes * rates.monthly * 30);
         result.monthly = {
            planType: 'monthly',
            totalCost: monthlyCost,
            dailyEquivalent: Math.ceil(monthlyCost / 30),
            savingsComparedToDaily: 0,
            isUpgrade: false,
            isCurrentPlan: true,
        };
    }

    return result;
}
