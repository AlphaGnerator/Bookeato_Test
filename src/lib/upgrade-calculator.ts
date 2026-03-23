
'use server';

import type { UserProfile } from './types';
import { differenceInDays, parseISO } from 'date-fns';

export interface UpgradeQuote {
    credit: number;
    newMonthlyCost: number;
    finalPayable: number;
    newStartDate: Date;
    daysCredited: number;
}

const PRICING_CONSTANTS = {
  // Table 1: Standard Time Slots (in Minutes)
  // Logic: How long does it take to cook?
  // Maps: People Count -> Meal Type -> Minutes
  TIME_SLOTS: {
    '1': { single: 45, dual: 72, triple: 117 },
    '2': { single: 65, dual: 104, triple: 169 },
    '3': { single: 85, dual: 136, triple: 221 },
    '4': { single: 105, dual: 168, triple: 273 },
    '5': { single: 125, dual: 200, triple: 325 },
    '6': { single: 145, dual: 232, triple: 377 },
    '7': { single: 165, dual: 264, triple: 429 },
    '8': { single: 165, dual: 264, triple: 429 } // Fallback for 7+
  },

  // Table 2: RPM (Rate Per Minute in INR)
  // Logic: Cost per minute varies by commitment (Monthly is cheaper)
  // Maps: People Count -> Plan Type -> Rate
  RPM: {
    '1': { daily: 4.4444, weekly: 3.1111, monthly: 2.4444 },
    '2': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '3': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '4': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '5': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '6': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '7': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 },
    '8': { daily: 5.3846, weekly: 3.7692, monthly: 2.9615 }
  }
};

const getGeneratedPrice = (planType: 'weekly' | 'monthly', peopleCount: number, mealConfig: string) => {
  // 1. Normalize Inputs
  const pCount = Math.min(Math.max(peopleCount, 1), 8).toString() as keyof typeof PRICING_CONSTANTS.TIME_SLOTS;
  const type = planType.toLowerCase() as 'weekly' | 'monthly';
  
  // 2. Determine Meal Category (Single, Dual, Triple)
  let mealCategory: 'single' | 'dual' | 'triple' = 'single';
  const config = mealConfig.toLowerCase();
  
  if (config.includes('all 3 meals')) {
    mealCategory = 'triple';
  } else if (config.includes('&') || config.includes('and') || config.includes('+')) {
    mealCategory = 'dual';
  } else {
    mealCategory = 'single';
  }

  // 3. Fetch Variables from Constants
  const minutesRequired = PRICING_CONSTANTS.TIME_SLOTS[pCount][mealCategory];
  const ratePerMinute = PRICING_CONSTANTS.RPM[pCount][type];

  // 4. Determine Duration Multiplier
  let days = 1;
  if (type === 'weekly') days = 7;
  if (type === 'monthly') days = 30;

  // 5. The Formula
  const rawPrice = minutesRequired * ratePerMinute * days;

  console.log("Pricing Calc:", { mins: minutesRequired, rpm: ratePerMinute, days, total: rawPrice });

  return Math.round(rawPrice);
};


/**
 * Calculates a pro-rata credit for upgrading from a Weekly to a Monthly plan.
 * The upgrade is always effective from TOMORROW.
 * @param userProfile The user's current profile, containing plan details.
 * @returns A detailed quote for the plan upgrade, or null if calculation is not possible.
 */
export async function calculateUpgradeQuote(
    userProfile: UserProfile
): Promise<UpgradeQuote | null> {
    const currentSub = userProfile.subscription;

    // Guard Clauses: Ensure all required data is present.
    if (!currentSub || currentSub.planId !== 'weekly' || !currentSub.startDate || !currentSub.expiryDate || !currentSub.config) {
        console.error("❌ Upgrade Quote Error: Missing or invalid current subscription data.");
        return null;
    }
    
    // --- 1. Get New Plan Price using the Generator ---
    const peopleCount = parseInt(currentSub.config.people.split(' ')[0], 10) || 1;
    
    const newPlanPrice = getGeneratedPrice(
      'monthly',
      peopleCount,
      currentSub.config.meals,
    );

    // --- 2. Setup Dates ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // New plan starts TOMORROW

    const oldExpiry = parseISO(currentSub.expiryDate);
    oldExpiry.setHours(0, 0, 0, 0);
    
    // --- 3. Calculate Credit (Value of Old Plan starting TOMORROW) ---
    let credit = 0;
    let daysCredited = 0;
    const originalWeeklyCost = currentSub.cost || 0;
    const dailyRateOfOldPlan = originalWeeklyCost > 0 ? originalWeeklyCost / 7 : 0;

    if (oldExpiry > today) {
        const msPerDay = 1000 * 60 * 60 * 24;
        
        const remainingMs = oldExpiry.getTime() - today.getTime();
        daysCredited = Math.max(0, Math.floor(remainingMs / msPerDay));
        
        credit = Math.floor(daysCredited * dailyRateOfOldPlan);
    }
    
    // --- 4. Calculate Final Payable Amount ---
    let finalPayable = newPlanPrice - credit;
    if (finalPayable < 0) finalPayable = 0; // Safety check

    return {
        credit,
        newMonthlyCost: newPlanPrice,
        finalPayable,
        newStartDate: tomorrow,
        daysCredited,
    };
}
