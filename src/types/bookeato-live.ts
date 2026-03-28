export type LiveCategory = "The Guilt-Free Chaats" | "Superfood Bowls" | "Cold Pressed Sips" | "Rolls & Tacos" | "Healthy Signatures";

export interface LiveItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: LiveCategory;
  inStock: boolean;
  isSpicy: boolean;
  isVeg: boolean;
  
  // Details for the popup
  ingredients: string[];
  nutritionalProfile: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  brandStory: string; // "The story behind this healthy twist"
  
  societyId: string; // Which society stall this belongs to
}

export interface LiveOrder {
  id?: string;
  societyId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    uid: string; // Anonymous Auth UID
  };
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    portionSize?: string;
    status: "Queued" | "Preparing" | "Ready" | "Collected";
  }[];
  status: "Queued" | "Preparing" | "Ready" | "Collected";
  totalAmount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface LiveSociety {
  id: string;
  name: string;
  locationDetails: string;
  isActive: boolean;
}
