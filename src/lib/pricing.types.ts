

export interface BaseTimeSlots {
  [key: string]: {
    single_meal: number;
    b_plus_l: number;
    three_meal: number;
  };
}

export interface RpmRates {
  single_person: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  family_standard: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface PricingConfig {
  pincode: string;
  city: string;
  base_time_slots: BaseTimeSlots;
  rpm_rates: RpmRates;
}

export interface UserPricingRequest {
    pincode: string;
    num_people: number;
    meal_combo: 'single_meal' | 'b_plus_l' | 'three_meal';
    plan_duration: 'daily' | 'weekly' | 'monthly';
    duration_days: number;
    selected_dishes: {
        dishId: string;
        portions: number;
    }[];
}

export interface BillBreakdownItem {
    label: string;
    amount: number;
    originalAmount?: number; // For showing strikethrough prices
}

export interface PriceScenario {
    total_minutes: number;
    // The reality of what the user will pay for this specific transaction
    current_bill: {
        amount: number;
        breakdown: BillBreakdownItem[];
    };
    // The comparison point to show value
    comparison: {
        monthly_equivalent: number;
        potential_savings: number;
        is_subscriber: boolean;
    };
    // Details about plan limits for subscribers
    plan_details?: {
        plan_limit_minutes: number;
        overage_minutes: number;
    };
    // Raw rates used for calculation, for internal use
    rates: {
        daily: number;
        monthly: number;
    };
}
