import type { Dish } from './types';

interface TimeCalculationResult {
    total_minutes: number;
    breakdown: {
        active: number;
        passive: number;
    };
}

/**
 * Calculates the total cooking time for a set of dishes, considering the number of people to cook for.
 * Simplified algorithm: Uses flat totalCookTimeMinutes and applies a predictable scaling factor 
 * based on the selected portions (qty).
 * 
 * @param numPeople - The number of people the meal is for.
 * @param dishes - An array of full dish objects, each including a `qty` property for portions.
 * @returns An object containing the total estimated minutes and a detailed breakdown.
 */
export function calculateTotalCookingTime(
    numPeople: number,
    dishes: (Dish & { qty: number })[]
): { total_minutes: number; breakdown: { active: number; passive: number } } {
    if (!dishes || dishes.length === 0) {
        return { total_minutes: 0, breakdown: { active: 0, passive: 0 } };
    }

    let totalActiveTime = 0;
    let maxPassiveTime = 0;

    for (const dish of dishes) {
        // 1. FORCE the use of flat metadata time to avoid mismatched instruction arrays
        const fallbackTime = dish.totalCookTimeMinutes || 0;
        const baseActive = fallbackTime * 0.7; // Assume 70% of time is active
        const basePassive = fallbackTime * 0.3; // Assume 30% of time is passive

        // 2. Apply Portion Scaling
        const scaleFactor = dish.volume_scale_factor ?? 0.2; // Default +20% per extra portion
        const scaleMultiplier = 1 + (Math.max(0, dish.qty - 1) * scaleFactor);
        
        const scaledActive = baseActive * scaleMultiplier;
        const scaledPassive = basePassive * scaleMultiplier;

        // 3. Add to totals (Active adds up, Passive overlaps)
        totalActiveTime += scaledActive;
        if (scaledPassive > maxPassiveTime) {
            maxPassiveTime = scaledPassive;
        }
    }

    const finalTotal = totalActiveTime + maxPassiveTime;

    return {
        total_minutes: Math.round(finalTotal),
        breakdown: {
            active: Math.round(totalActiveTime),
            passive: Math.round(maxPassiveTime),
        },
    };
}
