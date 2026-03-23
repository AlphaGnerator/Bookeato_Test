
import type { CookingSlot, UserProfile } from './types';

export const defaultUser: UserProfile = {
  name: 'New User',
  email: '',
  address: '',
  pincode: '',
  calorieTarget: 2000,
  dietaryNeeds: [],
  foodPreferences: [],
  familySize: 1,
  walletBalance: 0,
  subscription: {
    status: 'none',
    planId: 'daily',
    tier: 1,
    cost: 0,
    startDate: new Date().toISOString(),
    expiryDate: new Date().toISOString(),
    config: {
        people: '1 person',
        meals: 'Lunch',
        diet: 'Veg',
        timeSlot: '12:00',
    },
  },
};

// This is now empty, as the data is generated client-side in the useCulinaryStore hook
export const initialSlots: CookingSlot[] = [];

export const dietaryOptions = ['Vegetarian', 'Non-Vegetarian', 'Vegan'];
