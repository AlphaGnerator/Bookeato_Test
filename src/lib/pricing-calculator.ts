import type { PriceScenario, BillBreakdownItem } from './pricing.types';

const PRICING_CONSTANTS = {
    // Table 1: Standard Time Slots (in Minutes)
    // Maps: People Count -> Meal Type -> Minutes
    TIME_SLOTS: {
        '1': { single: 45, dual: 72, triple: 117 },
        '2': { single: 65, dual: 104, triple: 169 },
        '3': { single: 85, dual: 136, triple: 221 },
        '4': { single: 105, dual: 168, triple: 273 },
        '5': { single: 125, dual: 200, triple: 325 },
        '6': { single: 145, dual: 232, triple: 377 },
        '7': { single: 165, dual: 264, triple: 429 },
        '8': { single: 165, dual: 264, triple: 429 }
    },
  
    // Table 2: RPM (Rate Per Minute in INR)
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

/**
 * Calculates complex price scenarios for a given cooking time and user profile.
 * Implements the getPriceBreakup logic: Base Price + Overage Charge.
 */
export function calculatePriceScenarios(
    minutes: number,
    familySize: number,
    planType: 'day' | 'weekly' | 'monthly',
    mealCategory: 'single' | 'dual' | 'triple'
): PriceScenario {

    // 1. Safe Rate and Time Extraction
    const pCount = Math.min(Math.max(familySize, 1), 8).toString() as keyof typeof PRICING_CONSTANTS.TIME_SLOTS;
    const dailyRate = PRICING_CONSTANTS.RPM[pCount]['daily'];
    const monthlyRate = PRICING_CONSTANTS.RPM[pCount]['monthly'];
    const baseTimeLimit = PRICING_CONSTANTS.TIME_SLOTS[pCount][mealCategory];

    // 2. Perform getPriceBreakup logic
    const overageMinutes = Math.max(0, minutes - baseTimeLimit);
    const baseVisitCost = Math.ceil(baseTimeLimit * dailyRate);
    const overageCost = Math.ceil(overageMinutes * dailyRate);
    
    const isSubscriber = planType === 'weekly' || planType === 'monthly';
    const totalStandardCost = baseVisitCost + overageCost;
    const memberCostEquivalent = Math.ceil(minutes * monthlyRate);

    const breakdown: BillBreakdownItem[] = [];

    // 3. Scenario-based Breakdown Generation
    if (!isSubscriber) {
        // --- Scenario A: Pay-As-You-Go (Daily Visit) ---
        // We show the split between base session and overage even for non-subscribers for transparency
        breakdown.push({ 
            label: `Base Session (${baseTimeLimit}m)`, 
            amount: baseVisitCost 
        });
        
        if (overageMinutes > 0) {
            breakdown.push({ 
                label: `Overage Fee (${overageMinutes}m)`, 
                amount: overageCost 
            });
        }

        return {
            total_minutes: minutes,
            current_bill: {
                amount: totalStandardCost,
                breakdown: breakdown
            },
            comparison: {
                monthly_equivalent: memberCostEquivalent,
                potential_savings: totalStandardCost - memberCostEquivalent,
                is_subscriber: false
            },
            plan_details: {
                plan_limit_minutes: baseTimeLimit,
                overage_minutes: overageMinutes,
            },
            rates: { daily: dailyRate, monthly: monthlyRate }
        };
    } else {
        // --- Scenario B: Subscriber (Weekly/Monthly) ---
        // Base time is included (FREE), only overage is charged
        breakdown.push({ 
            label: `Base Visit (${Math.min(minutes, baseTimeLimit)}m)`, 
            amount: 0, 
            originalAmount: Math.ceil(Math.min(minutes, baseTimeLimit) * dailyRate) 
        });

        if (overageMinutes > 0) {
            breakdown.push({ 
                label: `Overage Fee (${overageMinutes}m)`, 
                amount: overageCost 
            });
        }

        return {
            total_minutes: minutes,
            current_bill: {
                amount: overageCost,
                breakdown: breakdown
            },
            comparison: {
                monthly_equivalent: memberCostEquivalent,
                potential_savings: baseVisitCost, // The savings is the value of the included base visit
                is_subscriber: true
            },
            plan_details: {
                plan_limit_minutes: baseTimeLimit,
                overage_minutes: overageMinutes,
            },
            rates: { daily: dailyRate, monthly: monthlyRate }
        };
    }
}
