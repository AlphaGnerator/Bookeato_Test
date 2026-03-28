export type Subscription = {
  status: 'active' | 'expired' | 'none' | 'cancelled' | 'upcoming';
  planId: 'daily' | 'weekly' | 'monthly';
  tier: number; // e.g., 1 for daily, 2 for weekly, 3 for monthly
  cost: number;
  startDate: string; // ISO 8601
  expiryDate: string; // ISO 8601
  config: {
      people: string;
      meals: string;
      diet: string;
      timeSlot: string;
      dinnerTimeSlot?: string | null;
  };
  modificationStatus?: 'requested' | 'approved' | null;
  totalVisits?: number;
  usedVisits?: number;
};

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  pincode?: string;
  calorieTarget: number;
  dietaryNeeds: string[];
  foodPreferences: string[];
  familySize: number;
  walletBalance?: number;
  subscription?: Subscription;

  // --- Deprecated fields ---
  plan_type?: 'daily' | 'weekly' | 'monthly';
  plan_status?: 'active' | 'inactive' | 'expired' | 'cancelled';
  plan_cost?: number; // The cost of the current active/upcoming plan
  plan_config?: {
      people: string;
      meals: string;
      diet: string;
  };
  plan_start_date?: string; // ISO 8601
  plan_expiry_date?: string; // ISO 8601
};

export type CookingSlot = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  bookedBy?: string | null; // user name
  dishId: string;
};

export type DraftBookingItem = {
    dishId: string;
    dishName: string;
    numberOfPortions: number;
    notes?: string;
}

export type DraftBooking = {
    bookingDate: string; // ISO 8601 format
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
    items: DraftBookingItem[];
}


export type Booking = {
    id: string;
    customerId: string;
    cookId?: string;
    cookName?: string;
    bookingDate: string; // ISO 8601 format
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
    items: {
        dishId?: string;
        dishName?: string;
        choreName?: string;
        numberOfPortions?: number;
        estimatedTime?: number;
        notes?: string;
    }[];
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'delivered' | 'in_progress';
    totalCost: number;
    type?: 'cook' | 'maid' | 'subscription';
    service?: string;
    notes?: string; // For special requests like expert curation
    otp?: string; // 4-digit OTP for task verification
    startTime?: string; // ISO 8601 when task actually started
    endTime?: string; // ISO 8601 when task actually ended

    // Denormalized customer data for cook/maid access
    customerName?: string;
    customerAddress?: string;
    customerPincode?: string;
    customerContact?: string;
    
    // Assigned professional
    maidId?: string;
    maidName?: string;
    partnerPhotoUrl?: string;
    partnerRating?: number;
    time?: string;

    // Feedback & Rating
    customerRating?: number;
    customerFeedback?: {
        issueTypes: string[];
        freeform: string;
    };
    tipAmount?: number;
    cancelPenalty?: number;
    refundAmount?: number;
    earnings?: number; // Admin profit
    estimatedArrivalTime?: string; // ISO 8601 or formatted time
    partnerImage?: string;
}

export type CookProfile = {
    id: string;
    name: string;
    contactNumber: string;
    address: string;
    pincode: string;
    experience: number;
    rating: number;
    specialties: string[];
    totalEarnings?: number;
    status: 'pending' | 'approved' | 'rejected';
    profilePhotoUrl?: string;
    aadhaarPhotoUrl?: string;
    contractUrl?: string;
    qualification?: string;
    aadhaarNumber?: string;
    gender?: 'Male' | 'Female' | 'Other';
}

export type MaidProfile = {
    id: string;
    name: string;
    contactNumber: string;
    address?: string;
    pincode?: string;
    status: 'pending' | 'approved' | 'rejected';
    kycDocumentUrl?: string; // Legacy field for Aadhaar
    profilePhotoUrl?: string;
    aadhaarPhotoUrl?: string;
    contractUrl?: string;
    qualification?: string;
    aadhaarNumber?: string;
    experience?: number;
    rating?: number;
    joinedDate?: string;
    gender?: 'Male' | 'Female' | 'Other';
}

export type CookAvailability = {
    id: string;
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
}

export type Ingredient = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    prepNote?: string;
    prepTimeMinutes?: number;
    providedBy: 'Customer' | 'Cook';
    isKeyIngredient: boolean;
    category?: 'Produce' | 'Spices' | 'Dairy & Protein' | 'Pantry' | 'Other';
}

export type RecipeInstruction = {
    id: string;
    stepNumber: number;
    instruction_en: string;
    instruction_hi?: string;
    imageUrl?: string;
    timeMinutes?: number;
    time_category: 'ACTIVE' | 'PASSIVE' | 'PRE_PREP';
    specialInstruction?: string;
}

export type Dish = {
    id: string;
    displayName_en: string;
    displayName_hi?: string;
    formalName_en: string;
    formalName_hi?: string;
    shortDescription_en?: string;
    shortDescription_hi?: string;
    story_en?: string;
    story_hi?: string;
    cuisine: string;
    course: string;
    dietaryTags: string[];
    allergenAlerts: string[];
    spiceLevel: number;
    volume_scale_factor: number;
    heroImageUrl: string;
    culinaryNote_en?: string;
    culinaryNote_hi?: string;
    totalCookTimeMinutes: number;
    skillLevel: number;
    calories?: number;
    protein_grams?: number;
    carbs_grams?: number;
    fat_grams?: number;
    platingInstructions_en?: string;
    platingInstructions_hi?: string;
    videoUrl?: string;
    baseIngredientCost?: number;
    suggestedCustomerPrice?: number;
    cookPayout?: number;
    popularityScore?: number;
    seasonalAvailability?: string[];
    isActive: boolean;
    version: number;
    ingredients: Ingredient[];
    instructions: RecipeInstruction[];
    equipmentNeeded: string[];
}

export type Assignment = {
    id: string; // This will be the same as the bookingId
    cookId: string;
    customerId: string;
    bookingDate: string; // ISO String
}

export type PincodeAvailability = {
    unavailableSlots: string[]; // e.g., ["09:00", "14:00"]
}

export type UploadedImage = {
    id: string;
    name: string;
    url: string;
    createdAt: any; // Can be a server timestamp
}

export type Transaction = {
    id: string;
    type: 'subscription_purchase' | 'recharge' | 'booking_payment' | 'refund' | 'plan_upgrade';
    amount: number;
    date: any; // ServerTimestamp
    details: {
        planType?: 'weekly' | 'monthly';
        bookingId?: string;
        description: string;
        tipFor?: string; // Partner name or ID
    };
}

export type MarketplaceProduct = {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    ingredients: string[];
    isHealthy: boolean;
    unit?: string;
}

export type MarketplaceCartItem = {
    product: MarketplaceProduct;
    quantity: number;
}
