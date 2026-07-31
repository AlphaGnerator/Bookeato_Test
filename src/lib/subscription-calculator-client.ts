
'use client';
// This file is safe for client-side use as it contains no server-side logic.

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

export const getGeneratedPrice = (planType: 'day' | 'weekly' | 'monthly', peopleCount: number, mealConfig: string): number => {
    // 1. Normalize Inputs
    const pCount = Math.min(Math.max(peopleCount, 1), 8).toString() as keyof typeof PRICING_CONSTANTS.TIME_SLOTS;
    const type = planType.toLowerCase() as 'day' | 'weekly' | 'monthly';
    
    // 2. Determine Meal Category (Single, Dual, Triple)
    let mealCategory: 'single' | 'dual' | 'triple' = 'single';
    const config = mealConfig.toLowerCase();
    
    if (config.includes('all 3 meals')) {
        mealCategory = 'triple';
    } else if (config.includes('&')) {
        mealCategory = 'dual';
    }
  
    // 3. Fetch Variables from Constants
    const minutesRequired = PRICING_CONSTANTS.TIME_SLOTS[pCount][mealCategory];
    const ratePerMinute = PRICING_CONSTANTS.RPM[pCount][planType === 'day' ? 'daily' : planType];
  
    // 4. Determine Duration Multiplier
    let days = 1;
    if (type === 'weekly') days = 7;
    if (type === 'monthly') days = 30;
  
    // 5. The Formula
    const rawPrice = minutesRequired * ratePerMinute * days;
  
    return Math.round(rawPrice);
};
