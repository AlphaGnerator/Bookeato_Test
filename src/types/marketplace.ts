export interface ProductCustomizationOption {
  id: string;
  label: string;
  priceModifier?: number; // e.g. +20, +50, +0
}

export interface ProductCustomizationGroup {
  id: string;
  title: string; // e.g. "Select Spice Level", "Choose Weight/Jar Size", "Packaging Choice"
  type: 'single' | 'multiple';
  required?: boolean;
  options: ProductCustomizationOption[];
}

export interface SelectedCustomization {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionLabel: string;
  priceModifier: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  shortDescription?: string; // Positioned below product name and above product price
  price: number;
  originalPrice?: number;
  sellerName: string;
  sellerRating?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  ingredients: string[];
  isHealthy: boolean;
  unit: string;
  category: 'ghee-oil' | 'pickles' | 'laddus-snacks' | 'honey' | 'spices' | 'fresh-veg';
  inStock: boolean;
  badge?: string;
  brandStory?: string;
  customizationGroups?: ProductCustomizationGroup[]; // Seller/Admin added customization options
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface MarketplaceCartItem {
  product: MarketplaceProduct;
  quantity: number;
  selectedCustomizations?: SelectedCustomization[];
}
