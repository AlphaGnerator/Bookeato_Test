
'use server';

import { doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import type { PricingConfig } from '@/lib/pricing.types';

/**
 * Fetches the pricing configuration for a specific pincode.
 * @param firestore - The Firestore instance.
 * @param pincode - The pincode to fetch the config for.
 * @returns The pricing configuration or null if not found.
 */
export async function getPricingConfig(firestore: Firestore, pincode: string): Promise<PricingConfig | null> {
  if (!firestore) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestore, 'pricing_configs', pincode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as PricingConfig;
  } else {
    return null;
  }
}

/**
 * Creates or overwrites the pricing configuration for a specific pincode.
 * @param firestore - The Firestore instance.
 * @param config - The full pricing configuration object.
 */
export async function setPricingConfig(firestore: Firestore, config: PricingConfig): Promise<void> {
  if (!firestore) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestore, 'pricing_configs', config.pincode);
  await setDoc(docRef, config);
}

/**
 * Updates parts of a pricing configuration for a specific pincode.
 * @param firestore - The Firestore instance.
 * @param pincode - The pincode of the config to update.
 * @param updates - An object with the fields to update.
 */
export async function updatePricingConfig(firestore: Firestore, pincode: string, updates: Partial<PricingConfig>): Promise<void> {
  if (!firestore) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestore, 'pricing_configs', pincode);
  await updateDoc(docRef, updates);
}
