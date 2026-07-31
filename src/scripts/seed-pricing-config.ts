
'use server';

import { doc, setDoc, Firestore } from 'firebase/firestore';

const hyderabadConfig = {
  pincode: "500032",
  city: "Hyderabad",
  base_time_slots: {
    "1_person": { "single_meal": 45, "b_plus_l": 72, "three_meal": 117 },
    "2_people": { "single_meal": 65, "b_plus_l": 105, "three_meal": 168 },
    "3_people": { "single_meal": 85, "b_plus_l": 125, "three_meal": 200 },
    "4_people": { "single_meal": 105, "b_plus_l": 145, "three_meal": 232 },
    "5_people": { "single_meal": 125, "b_plus_l": 165, "three_meal": 264 },
    "6_people": { "single_meal": 145, "b_plus_l": 165, "three_meal": 264 },
    "7_people": { "single_meal": 165, "b_plus_l": 165, "three_meal": 264 },
    "8_people": { "single_meal": 165, "b_plus_l": 165, "three_meal": 264 }
  },
  rpm_rates: {
    "single_person": { "daily": 4.44, "weekly": 3.11, "monthly": 2.44 },
    "family_standard": { "daily": 5.38, "weekly": 3.77, "monthly": 2.96 }
  }
};

/**
 * Seeds the 'pricing_configs' collection with default data for Hyderabad.
 * This function should be called from an admin panel or a secure environment.
 * @param firestore - The Firestore instance.
 */
export async function seedDefaultPricingConfig(firestore: Firestore) {
  if (!firestore) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore is not initialized.");
  }

  try {
    const docRef = doc(firestore, 'pricing_configs', hyderabadConfig.pincode);
    await setDoc(docRef, hyderabadConfig);
    console.log(`Successfully seeded pricing config for pincode ${hyderabadConfig.pincode}.`);
    return { success: true, pincode: hyderabadConfig.pincode };
  } catch (error) {
    console.error("Error seeding pricing config:", error);
    throw error;
  }
}
