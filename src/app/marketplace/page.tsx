'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ShoppingBag, Star, ShieldCheck, 
    ArrowLeft, Plus, Minus, Info,
    Leaf, Store, MapPin, Search, Sparkles,
    CheckCircle2, X, ChevronRight, Award, Clock,
    ChevronDown, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MarketplaceProduct, ProductCustomizationGroup } from '@/types/marketplace';

const BASE_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
    {
        id: 'ghee-001',
        name: 'A2 Cow Ghee (Bilona Churned)',
        shortDescription: 'Traditional Bilona churned Ghee from grass-fed A2 Gir cows.',
        price: 1250,
        originalPrice: 1450,
        sellerName: 'Swadeshi Organic Farm',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 142,
        image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
        description: 'Traditional Bilona churned Ghee from grass-fed A2 Gir cows. Pure, aromatic, and rich in butyric acid.',
        ingredients: ['A2 Gir Cow Milk', 'Traditional Culture'],
        isHealthy: true,
        unit: '500 ml',
        category: 'ghee-oil',
        inStock: true,
        badge: 'Best Seller',
        brandStory: 'Crafted using ancient Vedic Bilona methods where curd is hand-churned bi-directionally to extract pure makkhan before slow melting over wooden fires.',
        customizationGroups: [
            {
                id: 'packaging',
                title: 'Packaging Material',
                type: 'single',
                required: true,
                options: [
                    { id: 'glass', label: 'Standard Glass Jar', priceModifier: 0 },
                    { id: 'tin', label: 'Vintage Brass Tin (+₹150)', priceModifier: 150 }
                ]
            },
            {
                id: 'size',
                title: 'Quantity / Jar Size',
                type: 'single',
                required: true,
                options: [
                    { id: '500ml', label: '500 ml Jar', priceModifier: 0 },
                    { id: '1000ml', label: '1 Litre Jar (+₹1100)', priceModifier: 1100 }
                ]
            }
        ]
    },
    {
        id: 'oil-001',
        name: 'Wood Churned Kachi Ghani Mustard Oil',
        shortDescription: 'Cold pressed yellow mustard oil with essential Omega-3 fatty acids.',
        price: 340,
        originalPrice: 390,
        sellerName: 'Gramin Udyog Organics',
        sellerRating: 4.8,
        rating: 4.7,
        reviewsCount: 64,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop',
        description: 'Cold pressed (Kachi Ghani) yellow mustard oil retaining natural pungent aroma and essential Omega-3 fatty acids.',
        ingredients: ['100% Yellow Mustard Seeds'],
        isHealthy: true,
        unit: '1 Litre',
        category: 'ghee-oil',
        inStock: true,
        brandStory: 'Cold pressed in wooden ghani presses under 45°C to preserve natural antioxidants and pungent digestive enzymes.',
        customizationGroups: [
            {
                id: 'bottle',
                title: 'Bottle Type',
                type: 'single',
                options: [
                    { id: 'pet', label: 'Standard PET Bottle', priceModifier: 0 },
                    { id: 'tin_can', label: 'Eco Metal Can (+₹30)', priceModifier: 30 }
                ]
            }
        ]
    },
    {
        id: 'oil-002',
        name: 'Cold Pressed Black Sesame Oil',
        shortDescription: 'Pure cold pressed unrefined black sesame oil for cooking & Ayurveda.',
        price: 420,
        originalPrice: 480,
        sellerName: 'Swadeshi Organic Farm',
        sellerRating: 4.9,
        rating: 4.8,
        reviewsCount: 51,
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop',
        description: 'Pure cold pressed sesame oil from unrefined black sesame seeds. Great for cooking and Ayurvedic oil pulling.',
        ingredients: ['100% Black Sesame Seeds'],
        isHealthy: true,
        unit: '500 ml',
        category: 'ghee-oil',
        inStock: true,
        badge: 'Organic'
    },
    {
        id: 'pickle-001',
        name: 'Homemade Spicy Mango Pickle',
        shortDescription: 'Authentic Andhra style raw green mango pickle with cold-pressed sesame oil.',
        price: 280,
        originalPrice: 320,
        sellerName: 'Amma\'s Kitchen Spices',
        sellerRating: 4.9,
        rating: 4.8,
        reviewsCount: 98,
        image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600&auto=format&fit=crop',
        description: 'Authentic Andhra style raw green mango pickle made with hand-ground spices and cold-pressed sesame oil.',
        ingredients: ['Raw Green Mango', 'Cold-Pressed Sesame Oil', 'Red Chilli', 'Mustard', 'Fenugreek'],
        isHealthy: true,
        unit: '350 g',
        category: 'pickles',
        inStock: true,
        badge: 'Artisanal',
        brandStory: 'Prepared in small batches using traditional sun-curing recipes passed down through 3 generations of home chefs.',
        customizationGroups: [
            {
                id: 'spice',
                title: 'Spice Level',
                type: 'single',
                options: [
                    { id: 'medium', label: 'Medium Spice', priceModifier: 0 },
                    { id: 'andhra_spicy', label: 'Andhra Extra Hot (+₹20)', priceModifier: 20 }
                ]
            },
            {
                id: 'oil_base',
                title: 'Base Oil Choice',
                type: 'single',
                options: [
                    { id: 'sesame', label: 'Sesame Oil (Traditional)', priceModifier: 0 },
                    { id: 'mustard', label: 'Kachi Ghani Mustard Oil', priceModifier: 0 }
                ]
            }
        ]
    },
    {
        id: 'pickle-002',
        name: 'Garlic & Red Chilli Athana Pickle',
        shortDescription: 'Robust garlic cloves marinated in Kashmiri chilli paste & mustard oil.',
        price: 260,
        originalPrice: 300,
        sellerName: 'Amma\'s Kitchen Spices',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 74,
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=600&auto=format&fit=crop',
        description: 'Robust garlic cloves marinated in Kashmiri chilli paste and crushed mustard seed oil. Zero preservatives.',
        ingredients: ['Peeled Garlic Cloves', 'Kashmiri Chilli', 'Mustard Oil', 'Lemon Juice'],
        isHealthy: true,
        unit: '300 g',
        category: 'pickles',
        inStock: true
    },
    {
        id: 'pickle-003',
        name: 'Banarasi Stuffed Red Chilli Pickle',
        shortDescription: 'Varanasi style red chillies stuffed with roasted spices & mustard oil.',
        price: 320,
        originalPrice: 370,
        sellerName: 'Varanasi Heritage Foods',
        sellerRating: 4.7,
        rating: 4.8,
        reviewsCount: 88,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop',
        description: 'Famous Varanasi style large red chillies stuffed with aromatic roasted spice blend and mustard oil.',
        ingredients: ['Red Chilli', 'Amochoor', 'Fennel', 'Nigella Seeds', 'Mustard Oil'],
        isHealthy: true,
        unit: '350 g',
        category: 'pickles',
        inStock: true,
        badge: 'Heritage'
    },
    {
        id: 'laddu-001',
        name: 'Ragi & Dry Fruit Laddu (Jaggery)',
        shortDescription: 'Power-packed finger millet laddus with organic palm jaggery & A2 Ghee.',
        price: 450,
        originalPrice: 520,
        sellerName: 'NutriBites Homemade',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 86,
        image: 'https://images.unsplash.com/photo-1734330931856-77cdf1b5bba9?q=80&w=600&auto=format&fit=crop',
        description: 'Power-packed nutritious laddus made with roasted finger millet, organic palm jaggery, almonds, and A2 Ghee.',
        ingredients: ['Finger Millet (Ragi)', 'Organic Jaggery', 'Almonds', 'Cashews', 'Cardamom', 'A2 Ghee'],
        isHealthy: true,
        unit: '250 g (6 pcs)',
        category: 'laddus-snacks',
        inStock: true,
        badge: 'Sugar Free',
        brandStory: 'Zero refined sugar or artificial binders. Made daily with fresh organic millet flour and sprouted nuts.',
        customizationGroups: [
            {
                id: 'sweetener',
                title: 'Sweetener Choice',
                type: 'single',
                options: [
                    { id: 'jaggery', label: 'Organic Palm Jaggery', priceModifier: 0 },
                    { id: 'date_paste', label: '100% Date Paste (+₹30)', priceModifier: 30 }
                ]
            },
            {
                id: 'nuts_extra',
                title: 'Nuts Customization',
                type: 'single',
                options: [
                    { id: 'std_nuts', label: 'Standard Almonds & Cashews', priceModifier: 0 },
                    { id: 'extra_pista', label: 'Extra Roasted Pistachio Add-on (+₹50)', priceModifier: 50 }
                ]
            }
        ]
    },
    {
        id: 'laddu-002',
        name: 'Gond & Methi Immunity Laddus',
        price: 480,
        originalPrice: 550,
        sellerName: 'NutriBites Homemade',
        sellerRating: 4.9,
        rating: 4.8,
        reviewsCount: 62,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop',
        description: 'Traditional winter energy laddus packed with edible gum (Gond), roasted seeds, nuts, and Desi Ghee.',
        ingredients: ['Edible Gond', 'Whole Wheat', 'Desi Ghee', 'Jaggery', 'Melon Seeds', 'Nutmeg'],
        isHealthy: true,
        unit: '250 g',
        category: 'laddus-snacks',
        inStock: true
    },
    {
        id: 'honey-001',
        name: 'Raw Forest Wildflower Honey',
        price: 590,
        originalPrice: 680,
        sellerName: 'Himalayan Nectar',
        sellerRating: 5.0,
        rating: 5.0,
        reviewsCount: 210,
        image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?q=80&w=600&auto=format&fit=crop',
        description: 'Unprocessed, unfiltered raw wild honey collected directly from pristine Himalayan forest flora.',
        ingredients: ['100% Pure Wild Honey'],
        isHealthy: true,
        unit: '400 g',
        category: 'honey',
        inStock: true,
        badge: 'Raw & Pure',
        brandStory: 'Sourced responsibly by tribal honey gatherers in the high altitude Himalayan forests. Never heated or micro-filtered.'
    },
    {
        id: 'honey-002',
        name: 'Organic Sugarcane Jaggery Powder',
        price: 180,
        originalPrice: 220,
        sellerName: 'Himalayan Nectar',
        sellerRating: 5.0,
        rating: 4.7,
        reviewsCount: 115,
        image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=600&auto=format&fit=crop',
        description: 'Chemical-free, unrefined powdered jaggery made from organic sugarcane juice. Perfect healthy tea sweetener.',
        ingredients: ['100% Organic Sugarcane Juice'],
        isHealthy: true,
        unit: '500 g',
        category: 'honey',
        inStock: true
    },
    {
        id: 'spices-001',
        name: 'Stone-Ground Kashmiri Red Chilli Powder',
        price: 240,
        originalPrice: 280,
        sellerName: 'Gramin Udyog Organics',
        sellerRating: 4.8,
        rating: 4.8,
        reviewsCount: 43,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop',
        description: 'Vibrant natural red colour with mild pungency. Slow ground in stone mills to retain essential volatile oils.',
        ingredients: ['100% Kashmiri Red Chillies'],
        isHealthy: true,
        unit: '200 g',
        category: 'spices',
        inStock: true
    }
];

const FRESH_ORGANIC_PRODUCE: MarketplaceProduct[] = [
    {
        id: 'veg-001',
        name: 'Organic Hydroponic Spinach (Palak)',
        shortDescription: 'Pesticide-free tender palak harvested daily from local hydroponic farms.',
        price: 45,
        originalPrice: 60,
        sellerName: 'GreenEarth Hydroponic Farms',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 128,
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop',
        description: 'Freshly harvested hydroponic baby spinach leaves. Zero chemical pesticides, washed in ozonated water.',
        ingredients: ['100% Organic Hydroponic Spinach Leaves'],
        isHealthy: true,
        unit: '250 g',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Fresh Harvest'
    },
    {
        id: 'veg-002',
        name: 'Desi Organic Tomatoes (Naati Tomato)',
        shortDescription: 'Sun-ripened juicy organic tomatoes grown naturally in red soil.',
        price: 55,
        originalPrice: 70,
        sellerName: 'Swadeshi Organic Farm',
        sellerRating: 4.9,
        rating: 4.8,
        reviewsCount: 94,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop',
        description: 'Tangy and juicy naturally ripened desi country tomatoes. Grown using Jeevamrutha organic compost.',
        ingredients: ['100% Organic Tomatoes'],
        isHealthy: true,
        unit: '1 kg',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Farm Direct'
    },
    {
        id: 'veg-003',
        name: 'Crunchy Organic Baby Carrots & Beetroot',
        shortDescription: 'Iron-rich organic root vegetables pulled fresh from organic farm soil.',
        price: 75,
        originalPrice: 90,
        sellerName: 'Gramin Udyog Organics',
        sellerRating: 4.8,
        rating: 4.8,
        reviewsCount: 62,
        image: 'https://images.unsplash.com/photo-1447175008436-084170927957?q=80&w=600&auto=format&fit=crop',
        description: 'Nutrient-rich, crisp red carrots and deep purple beetroots harvested early morning.',
        ingredients: ['Fresh Organic Carrots', 'Organic Beetroot'],
        isHealthy: true,
        unit: '500 g',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Organic'
    },
    {
        id: 'veg-004',
        name: 'Organic Tender Coriander & Curry Leaf Pack',
        shortDescription: 'Aromatic hydroponically grown cilantro and farm fresh curry leaves.',
        price: 30,
        originalPrice: 40,
        sellerName: 'GreenEarth Hydroponic Farms',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 88,
        image: 'https://images.unsplash.com/photo-1588879460618-924a04e84457?q=80&w=600&auto=format&fit=crop',
        description: 'Fragrant, fresh coriander bunches and dark green curry leaves packed immediately after picking.',
        ingredients: ['Fresh Organic Coriander', 'Organic Curry Leaves'],
        isHealthy: true,
        unit: '200 g',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Freshly Picked'
    },
    {
        id: 'veg-005',
        name: 'Exotic Organic Bell Peppers (Red/Yellow/Green)',
        shortDescription: 'Crisp, antioxidant-rich greenhouse peppers harvested at peak ripeness.',
        price: 95,
        originalPrice: 120,
        sellerName: 'GreenEarth Hydroponic Farms',
        sellerRating: 4.9,
        rating: 4.9,
        reviewsCount: 76,
        image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?q=80&w=600&auto=format&fit=crop',
        description: 'Fresh, vibrant sweet bell peppers grown in controlled hydroponic greenhouse environment.',
        ingredients: ['100% Organic Red, Yellow & Green Capsicum'],
        isHealthy: true,
        unit: '400 g (3 pcs)',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Hydroponic'
    },
    {
        id: 'veg-006',
        name: 'Organic Button Mushrooms & Sprouted Moong',
        shortDescription: 'Protein-packed farm fresh white mushrooms & live organic sprouted moong.',
        price: 85,
        originalPrice: 105,
        sellerName: 'NutriBites Organic Farm',
        sellerRating: 4.8,
        rating: 4.7,
        reviewsCount: 55,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
        description: 'Clean, firm button mushrooms paired with freshly sprouted green moong beans.',
        ingredients: ['White Button Mushrooms', 'Sprouted Green Moong'],
        isHealthy: true,
        unit: '350 g',
        category: 'fresh-veg',
        inStock: true,
        badge: 'Protein Rich'
    }
];

// Include fresh produce into overall marketplace products list immutably
const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
    ...FRESH_ORGANIC_PRODUCE,
    ...BASE_MARKETPLACE_PRODUCTS
];

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: Sparkles },
    { id: 'fresh-veg', label: 'Fresh Vegetables & Harvest', icon: Leaf },
    { id: 'ghee-oil', label: 'Ghee & Oils', icon: Leaf },
    { id: 'pickles', label: 'Homemade Pickles', icon: Award },
    { id: 'laddus-snacks', label: 'Millet Laddus & Snacks', icon: Star },
    { id: 'honey', label: 'Pure Honey & Jaggery', icon: ShieldCheck },
    { id: 'spices', label: 'Spices & Staples', icon: Info },
];

const HYDERABAD_SOCIETIES = [
    { id: "my-home-vihanga", name: "My Home Vihanga", area: "Nanakramguda, Financial District" },
    { id: "prestige-high-fields", name: "Prestige High Fields", area: "ISB Road, Nanakramguda" },
    { id: "sumadhura-acropolis", name: "Sumadhura Acropolis", area: "Financial District" },
    { id: "jayabheri-silicon-county", name: "Jayabheri Silicon County", area: "Nanakramguda" },
    { id: "rajapushpa-atria", name: "Rajapushpa Atria", area: "Golden Mile Road" },
    { id: "incor-one-city", name: "Incor One City", area: "Kukatpally / Financial District" }
];

const DEFAULT_DUMMY_CUSTOMIZATIONS: ProductCustomizationGroup[] = [
    {
        id: 'packaging_size',
        title: 'Packaging & Size Option',
        type: 'single',
        options: [
            { id: 'std_pack', label: 'Standard Pack (As Listed)', priceModifier: 0 },
            { id: 'eco_glass_jar', label: 'Eco Glass Jar (+₹25)', priceModifier: 25 },
            { id: 'family_pack', label: 'Family Value Pack (+₹100)', priceModifier: 100 }
        ]
    },
    {
        id: 'flavor_note',
        title: 'Recipe Customization',
        type: 'single',
        options: [
            { id: 'artisanal_orig', label: 'Artisanal Original Recipe', priceModifier: 0 },
            { id: 'low_oil_salt', label: 'Low Oil / Less Salt', priceModifier: 0 },
            { id: 'extra_spicy_blend', label: 'Extra Roasted Spice Blend (+₹15)', priceModifier: 15 }
        ]
    }
];

export default function MarketplacePage() {
    const router = useRouter();
    const { marketplaceCart, addToMarketplaceCart, updateMarketplaceQuantity } = useCulinaryStore();
    
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedSociety, setSelectedSociety] = useState(HYDERABAD_SOCIETIES[0]);
    const [isSocietyDialogOpen, setIsSocietyDialogOpen] = useState(false);
    const [detailProduct, setDetailProduct] = useState<MarketplaceProduct | null>(null);
    const [customizingProduct, setCustomizingProduct] = useState<MarketplaceProduct | null>(null);
    const [selectedCustomizationsMap, setSelectedCustomizationsMap] = useState<Record<string, { optionId: string; optionLabel: string; priceModifier: number }>>({});

    const [dynamicSellerProducts, setDynamicSellerProducts] = useState<MarketplaceProduct[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('bookeato_seller_products');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setDynamicSellerProducts(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load seller products in marketplace", e);
        }
    }, []);

    const allMarketplaceProducts = useMemo(() => {
        return [...dynamicSellerProducts, ...MARKETPLACE_PRODUCTS];
    }, [dynamicSellerProducts]);

    const handleOpenCustomization = (product: MarketplaceProduct, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!product) return;

        // Ensure every product has customization groups available with fallback dummy options
        let rawGroups = (product.customizationGroups && product.customizationGroups.length > 0)
            ? product.customizationGroups
            : DEFAULT_DUMMY_CUSTOMIZATIONS;

        const groupsToUse: ProductCustomizationGroup[] = rawGroups.map((group, gIdx) => ({
            id: group.id || `group_${gIdx}`,
            title: group.title || 'Customization Option',
            type: group.type || 'single',
            options: (group.options && group.options.length > 0) ? group.options : [
                { id: `opt_std_${gIdx}`, label: 'Standard Option', priceModifier: 0 },
                { id: `opt_special_${gIdx}`, label: 'Special Touch (+₹20)', priceModifier: 20 }
            ]
        }));

        const preparedProduct: MarketplaceProduct = {
            ...product,
            customizationGroups: groupsToUse
        };

        setCustomizingProduct(preparedProduct);

        const defaults: Record<string, { optionId: string; optionLabel: string; priceModifier: number }> = {};
        groupsToUse.forEach(group => {
            if (group.options && group.options.length > 0) {
                defaults[group.id] = {
                    optionId: group.options[0].id,
                    optionLabel: group.options[0].label,
                    priceModifier: group.options[0].priceModifier || 0
                };
            }
        });
        setSelectedCustomizationsMap(defaults);
    };

    const handleAddCustomizedToCart = () => {
        if (!customizingProduct) return;
        const formattedCustomizations = (customizingProduct.customizationGroups || []).map(group => {
            const sel = selectedCustomizationsMap[group.id];
            if (!sel) return null;
            return {
                groupId: group.id,
                groupTitle: group.title,
                optionId: sel.optionId,
                optionLabel: sel.optionLabel,
                priceModifier: sel.priceModifier
            };
        }).filter(Boolean) as any[];

        addToMarketplaceCart(customizingProduct, formattedCustomizations);
        setCustomizingProduct(null);
    };

    // Filter products based on search query & category
    const filteredProducts = useMemo(() => {
        return allMarketplaceProducts.filter(product => {
            // When category is 'all' and user hasn't typed a search query, show non-fresh items in Featured grid (fresh items display in dedicated Fresh section above)
            const matchesCategory = selectedCategory === 'all' 
                ? (searchQuery.trim() !== '' ? true : product.category !== 'fresh-veg')
                : product.category === selectedCategory;

            const matchesSearch = searchQuery.trim() === '' || 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery, allMarketplaceProducts]);

    // Cart calculations
    const totalCartCount = useMemo(() => {
        return marketplaceCart.reduce((sum, item) => sum + item.quantity, 0);
    }, [marketplaceCart]);

    const totalCartAmount = useMemo(() => {
        return marketplaceCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [marketplaceCart]);

    return (
        <AppLayout pageTitle="Bookeato Marketplace">
            <div className="min-h-screen bg-stone-50/60 pb-36">
                
                {/* 1. Header & Location Selector Banner */}
                <div className="bg-emerald-950 text-white pt-4 pb-6 px-4 sm:px-6 relative overflow-hidden shadow-lg">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="max-w-6xl mx-auto space-y-4 relative z-10">
                        {/* Top bar with back button & society selector */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && window.history.length > 1) {
                                            router.back();
                                        } else {
                                            router.push('/dashboard');
                                        }
                                    }}
                                    className="rounded-full bg-white/10 hover:bg-white/20 text-white h-9 px-3.5 text-xs font-extrabold shrink-0 flex items-center gap-1.5 border border-white/20 shadow-sm active:scale-95 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Go Back</span>
                                </Button>

                                <button 
                                    onClick={() => setIsSocietyDialogOpen(true)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold transition-all border border-white/10"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate max-w-[180px] sm:max-w-[280px] text-white">
                                        {selectedSociety.name}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-stone-300" />
                                </button>
                            </div>

                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                Same-Day Delivery
                            </Badge>
                        </div>

                        {/* Banner Title & Description */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-amber-400 text-stone-950 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                                    Bookeato Verified Marketplace
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    100% Lab Tested & Certified Natural
                                </Badge>
                            </div>

                            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                Pure & Organic Essentials
                            </h1>

                            <p className="text-stone-200 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                                We bring pure and organic essentials directly to you from trusted local farms and home artisans. Every product is 100% natural, unadulterated, and lab-tested with proof for verified safety & chemical-free purity.
                            </p>

                            {/* Verification Proof Badges */}
                            <div className="flex flex-wrap gap-2 pt-1 text-[10px] sm:text-xs text-emerald-200 font-bold">
                                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 shadow-sm">
                                    🔬 100% Lab Tested (With Proof)
                                </span>
                                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 shadow-sm">
                                    🌱 100% Natural & Chemical-Free
                                </span>
                                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 shadow-sm">
                                    🏡 Direct Farm & Artisan Sourced
                                </span>
                            </div>
                        </div>

                        {/* Search Bar & Category Filter Dropdown (No scroll bars) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-3xl">
                            {/* Search Input */}
                            <div className="relative sm:col-span-2">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <Input 
                                    type="text"
                                    placeholder="Search A2 Ghee, Spicy Pickle, Laddus, Honey..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10 h-11 rounded-xl bg-white text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm font-medium border-none shadow-md focus-visible:ring-2 focus-visible:ring-emerald-400"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Dropdown (All items filter dropdown) */}
                            <div className="relative">
                                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none z-10" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full h-11 pl-10 pr-9 rounded-xl bg-white/15 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm border border-white/20 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all hover:bg-white/20"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="bg-emerald-950 text-white font-bold py-2">
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none z-10" />
                            </div>
                        </div>

                        {/* Active Filter Badge indicator if specific category selected */}
                        {selectedCategory !== 'all' && (
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] text-stone-300 font-medium">Selected Category:</span>
                                <Badge className="bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span>{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span>
                                    <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setSelectedCategory('all')} />
                                </Badge>
                                <button 
                                    onClick={() => setSelectedCategory('all')} 
                                    className="text-[11px] text-amber-300 hover:underline font-bold"
                                >
                                    Show All Items
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Main Content Grid */}
                <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 space-y-8">
                    
                    {/* 2A. FRESH ORGANIC PRODUCE & VEGETABLES SECTION */}
                    {(selectedCategory === 'all' || selectedCategory === 'fresh-veg') && !searchQuery && (
                        <div className="space-y-4 bg-emerald-900/5 p-4 sm:p-6 rounded-3xl border border-emerald-500/20 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <Leaf className="w-3 h-3 text-emerald-200" />
                                            Daily Harvest
                                        </Badge>
                                        <span className="text-[11px] text-emerald-800 font-extrabold">100% Pesticide Free</span>
                                    </div>
                                    <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight mt-1 flex items-center gap-2">
                                        <span>🥬 Fresh Organically Grown Vegetables & Greens</span>
                                    </h2>
                                    <p className="text-xs text-stone-600 font-medium">Delivered directly from local hydroponic & organic farms within 6 hours of harvest.</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedCategory('fresh-veg')}
                                    className="hidden sm:flex text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100 rounded-xl"
                                >
                                    View All Fresh Produce
                                </Button>
                            </div>

                            {/* Fresh Produce Cards Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {FRESH_ORGANIC_PRODUCE.map((product) => {
                                    const cartItem = marketplaceCart.find(item => item.product.id === product.id);
                                    const quantity = cartItem?.quantity || 0;

                                    return (
                                        <Card 
                                            key={product.id}
                                            className="rounded-2xl border-emerald-200/60 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col justify-between group hover:border-emerald-500 cursor-pointer relative"
                                            onClick={() => setDetailProduct(product)}
                                        >
                                            <Badge className="absolute top-2 left-2 z-10 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                                {product.badge || 'Fresh'}
                                            </Badge>

                                            <div>
                                                <div className="relative w-full h-28 bg-stone-100 overflow-hidden">
                                                    <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                </div>

                                                <div className="p-2.5 space-y-1">
                                                    <h3 className="text-xs font-extrabold text-stone-900 leading-snug line-clamp-2 min-h-[2rem]">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-[10px] text-stone-500 font-medium line-clamp-1">
                                                        {product.shortDescription}
                                                    </p>
                                                    <div className="flex items-baseline justify-between pt-1">
                                                        <span className="text-xs font-black text-emerald-950">₹{product.price}</span>
                                                        <span className="text-[9px] font-bold text-stone-400">{product.unit}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-2 pt-0" onClick={(e) => e.stopPropagation()}>
                                                {quantity > 0 ? (
                                                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl h-7 px-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-5 w-5 rounded-lg text-emerald-800"
                                                            onClick={() => updateMarketplaceQuantity(product.id, quantity - 1)}
                                                        >
                                                            <Minus className="w-2.5 h-2.5" />
                                                        </Button>
                                                        <span className="font-extrabold text-emerald-950 text-xs">{quantity}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-5 w-5 rounded-lg text-emerald-800"
                                                            onClick={() => updateMarketplaceQuantity(product.id, quantity + 1)}
                                                        >
                                                            <Plus className="w-2.5 h-2.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <Button 
                                                            variant="outline" 
                                                            className="h-7 rounded-xl border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100 text-emerald-900 font-extrabold text-[10px] transition-all px-1"
                                                            onClick={(e) => handleOpenCustomization(product, e)}
                                                        >
                                                            Customize
                                                        </Button>
                                                        <Button 
                                                            className="h-7 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-0.5 px-1"
                                                            onClick={() => addToMarketplaceCart(product as any)}
                                                        >
                                                            <Plus className="w-2.5 h-2.5" />
                                                            Add
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* Products Grid Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                                <span>Featured Products</span>
                                <Badge variant="secondary" className="bg-stone-200 text-stone-700 font-bold text-xs">
                                    {filteredProducts.length}
                                </Badge>
                            </h2>
                            <p className="text-[11px] sm:text-xs text-stone-500 font-medium">Tap any item to view complete ingredients & artisan story</p>
                        </div>
                    </div>

                    {/* Products Grid - Compact Cards */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {filteredProducts.map((product) => {
                                const cartItem = marketplaceCart.find(item => item.product.id === product.id);
                                const quantity = cartItem?.quantity || 0;

                                return (
                                    <Card 
                                        key={product.id}
                                        className="rounded-2xl border-stone-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col justify-between group hover:border-emerald-500/50 cursor-pointer"
                                        onClick={() => setDetailProduct(product)}
                                    >
                                        <div>
                                            {/* Compact Image Section */}
                                            <div className="relative w-full h-32 sm:h-36 bg-stone-100 overflow-hidden">
                                                <Image 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {/* Top Left Badge */}
                                                {product.badge && (
                                                    <div className="absolute top-2 left-2">
                                                        <Badge className="bg-emerald-950/85 backdrop-blur-md text-emerald-300 font-black border-none text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                            {product.badge}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {/* Top Right Rating Badge */}
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-stone-900/85 backdrop-blur-md text-amber-400 font-bold border-none text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                                                        {product.rating}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-2.5 sm:p-3 space-y-1">
                                                <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold">
                                                    <Store className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="truncate">{product.sellerName}</span>
                                                </div>

                                                <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight line-clamp-2 min-h-[1.75rem] group-hover:text-emerald-700 transition-colors">
                                                    {product.name}
                                                </h3>

                                                {/* Product Short Description (Placed below product name and above product price) */}
                                                <p className="text-[10px] text-stone-500 font-medium line-clamp-2 leading-snug my-1 min-h-[1.8rem]">
                                                    {product.shortDescription || product.description}
                                                </p>

                                                <div className="flex items-baseline justify-between pt-0.5">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm sm:text-base font-black text-stone-950">₹{product.price}</span>
                                                        {product.originalPrice && (
                                                            <span className="text-[10px] text-stone-400 line-through">₹{product.originalPrice}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-stone-400">{product.unit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Compact Bottom Action */}
                                        <div className="p-2.5 sm:p-3 pt-0" onClick={(e) => e.stopPropagation()}>
                                            {quantity > 0 ? (
                                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl h-8 px-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 rounded-lg hover:bg-emerald-100 text-emerald-800"
                                                        onClick={() => updateMarketplaceQuantity(product.id, quantity - 1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="font-extrabold text-emerald-950 text-xs">{quantity}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 rounded-lg hover:bg-emerald-100 text-emerald-800"
                                                        onClick={() => updateMarketplaceQuantity(product.id, quantity + 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <Button 
                                                        variant="outline" 
                                                        className="h-8 rounded-xl border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 text-stone-800 font-extrabold text-[11px] transition-all"
                                                        onClick={(e) => handleOpenCustomization(product, e)}
                                                    >
                                                        Customize
                                                    </Button>
                                                    <Button 
                                                        className="h-8 rounded-xl bg-stone-950 hover:bg-emerald-600 text-white font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1"
                                                        onClick={() => addToMarketplaceCart(product as any)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <Search className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">No products found</h3>
                                <p className="text-xs text-stone-500">Try adjusting your search terms or category filters.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-xl border-stone-300 text-xs font-bold"
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}

                    {/* 3. Trust Highlights */}
                    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-stone-900">Lab Tested Pure</h4>
                                <p className="text-[10px] text-stone-500 font-medium">Zero chemical adulterants</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
                                <Leaf className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-stone-900">Direct From Source</h4>
                                <p className="text-[10px] text-stone-500 font-medium">Local farms & home chefs</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                                <Store className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-stone-900">Verified Sellers</h4>
                                <p className="text-[10px] text-stone-500 font-medium">FSSAI certified vendors</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-stone-900">Fast Delivery</h4>
                                <p className="text-[10px] text-stone-500 font-medium">Same day in your society</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Sticky Floating Cart Summary Bar */}
                {totalCartCount > 0 && (
                    <div className="fixed bottom-4 left-0 right-0 z-50 px-4 max-w-xl mx-auto animate-in slide-in-from-bottom duration-300">
                        <div className="bg-stone-950 text-white rounded-2xl p-3.5 shadow-2xl border border-stone-800 flex items-center justify-between gap-4 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="relative p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-950 font-black text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                                        {totalCartCount}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Amount</p>
                                    <p className="text-base sm:text-lg font-black text-white">₹{totalCartAmount}</p>
                                </div>
                            </div>

                            <Button 
                                className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black text-xs sm:text-sm active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                onClick={() => router.push('/checkout')}
                            >
                                Checkout Cart
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* 5. Product Detail Modal */}
                <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
                    {detailProduct && (
                        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden bg-white border-none shadow-2xl">
                            <div className="relative w-full h-56 bg-stone-100">
                                <Image 
                                    src={detailProduct.image} 
                                    alt={detailProduct.name}
                                    fill
                                    className="object-cover"
                                />
                                <button 
                                    onClick={() => setDetailProduct(null)}
                                    className="absolute top-3 right-3 bg-stone-950/70 hover:bg-stone-950 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-3 left-3 flex gap-2">
                                    <Badge className="bg-emerald-950/90 text-emerald-300 font-bold text-xs border-none px-3 py-1 rounded-full">
                                        ★ {detailProduct.rating} ({detailProduct.reviewsCount} Reviews)
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <div className="flex items-center gap-1 text-blue-600 text-xs font-bold mb-1">
                                        <Store className="w-3.5 h-3.5" />
                                        <span>{detailProduct.sellerName}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-stone-900 leading-tight">{detailProduct.name}</h3>

                                    {/* Product Short Description (Placed below product name and above product price) */}
                                    <p className="text-xs text-stone-500 font-semibold my-1">
                                        {detailProduct.shortDescription || detailProduct.description}
                                    </p>

                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-black text-stone-950">₹{detailProduct.price}</span>
                                        {detailProduct.originalPrice && (
                                            <span className="text-sm text-stone-400 line-through">₹{detailProduct.originalPrice}</span>
                                        )}
                                        <span className="text-xs text-stone-500 font-semibold ml-auto">{detailProduct.unit}</span>
                                    </div>
                                </div>

                                <p className="text-stone-600 text-xs font-medium leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-100">
                                    {detailProduct.description}
                                </p>

                                {detailProduct.brandStory && (
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Artisan Story & Process
                                        </h4>
                                        <p className="text-stone-500 text-xs font-medium italic">"{detailProduct.brandStory}"</p>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400">Key Ingredients</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detailProduct.ingredients.map((ing, i) => (
                                            <Badge key={i} variant="secondary" className="bg-stone-100 text-stone-700 text-[11px] font-bold rounded-lg px-2.5 py-1">
                                                {ing}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {(() => {
                                        const cartItem = marketplaceCart.find(item => item.product.id === detailProduct.id);
                                        const qty = cartItem?.quantity || 0;
                                        return qty > 0 ? (
                                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl h-12 px-3">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl hover:bg-emerald-100 text-emerald-900"
                                                    onClick={() => updateMarketplaceQuantity(detailProduct.id, qty - 1)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="font-black text-emerald-950 text-base">{qty} in Cart</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl hover:bg-emerald-100 text-emerald-900"
                                                    onClick={() => updateMarketplaceQuantity(detailProduct.id, qty + 1)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    variant="outline"
                                                    className="h-12 rounded-2xl border-stone-300 text-stone-900 font-bold text-xs hover:bg-stone-100"
                                                    onClick={(e) => {
                                                        const prod = detailProduct;
                                                        setDetailProduct(null);
                                                        handleOpenCustomization(prod, e);
                                                    }}
                                                >
                                                    Customize Options
                                                </Button>
                                                <Button 
                                                    className="h-12 rounded-2xl bg-stone-950 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                                                    onClick={() => {
                                                        addToMarketplaceCart(detailProduct as any);
                                                        setDetailProduct(null);
                                                    }}
                                                >
                                                    Add to Cart • ₹{detailProduct.price}
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </DialogContent>
                    )}
                </Dialog>

                {/* 6. Product Customization Dialog (Buyer Choice) */}
                <Dialog open={!!customizingProduct} onOpenChange={(open) => !open && setCustomizingProduct(null)}>
                    {customizingProduct && (
                        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-none shadow-2xl space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-stone-900">Customize Product</DialogTitle>
                            </DialogHeader>

                            <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                                <div className="w-14 h-14 rounded-xl bg-stone-100 relative overflow-hidden shrink-0">
                                    <Image src={customizingProduct.image} alt={customizingProduct.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-stone-900 text-sm">{customizingProduct.name}</h4>
                                    <p className="text-xs text-stone-500 font-medium line-clamp-1">{customizingProduct.shortDescription || customizingProduct.description}</p>
                                    <p className="text-xs font-black text-emerald-700 mt-0.5">Base Price: ₹{customizingProduct.price}</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                                {customizingProduct.customizationGroups?.map(group => (
                                    <div key={group.id} className="space-y-2">
                                        <h5 className="text-xs font-black uppercase tracking-wider text-stone-500 flex justify-between">
                                            <span>{group.title}</span>
                                            <span className="text-[10px] text-emerald-600 font-bold">Required</span>
                                        </h5>
                                        <div className="grid grid-cols-1 gap-2">
                                            {group.options.map(opt => {
                                                const isSelected = selectedCustomizationsMap[group.id]?.optionId === opt.id;
                                                return (
                                                    <div 
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setSelectedCustomizationsMap(prev => ({
                                                                ...prev,
                                                                [group.id]: {
                                                                    optionId: opt.id,
                                                                    optionLabel: opt.label,
                                                                    priceModifier: opt.priceModifier || 0
                                                                }
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between",
                                                            isSelected ? "border-emerald-500 bg-emerald-50/50 font-bold text-emerald-950" : "border-stone-100 hover:border-stone-200 text-stone-700"
                                                        )}
                                                    >
                                                        <span className="text-xs">{opt.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {opt.priceModifier ? (
                                                                <span className="text-xs font-black text-emerald-700">+₹{opt.priceModifier}</span>
                                                            ) : (
                                                                <span className="text-[10px] text-stone-400 font-bold">Included</span>
                                                            )}
                                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total with Customization */}
                            {(() => {
                                const extraCost = Object.values(selectedCustomizationsMap).reduce((acc, curr) => acc + (curr.priceModifier || 0), 0);
                                const finalPrice = customizingProduct.price + extraCost;
                                return (
                                    <div className="pt-2 border-t border-stone-100 space-y-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs font-bold text-stone-500">Total Price</span>
                                            <span className="text-2xl font-black text-stone-900">₹{finalPrice}</span>
                                        </div>
                                        <Button 
                                            onClick={handleAddCustomizedToCart}
                                            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                                        >
                                            Add Customized Item to Cart • ₹{finalPrice}
                                        </Button>
                                    </div>
                                );
                            })()}
                        </DialogContent>
                    )}
                </Dialog>

                {/* 7. Society Picker Modal */}
                <Dialog open={isSocietyDialogOpen} onOpenChange={setIsSocietyDialogOpen}>
                    <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-stone-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                                Select Delivery Society
                            </DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-stone-500 font-medium">Choose your society for same-day delivery from local home artisans.</p>
                        
                        <div className="space-y-2 mt-4 max-h-72 overflow-y-auto pr-1">
                            {HYDERABAD_SOCIETIES.map((soc) => (
                                <button
                                    key={soc.id}
                                    onClick={() => {
                                        setSelectedSociety(soc);
                                        setIsSocietyDialogOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                        selectedSociety.id === soc.id 
                                            ? 'bg-emerald-50 border-emerald-500/50 text-emerald-950 font-bold' 
                                            : 'bg-white border-stone-200 text-stone-800 hover:border-stone-300'
                                    }`}
                                >
                                    <div>
                                        <p className="text-xs font-black">{soc.name}</p>
                                        <p className="text-[10px] text-stone-400 font-medium">{soc.area}</p>
                                    </div>
                                    {selectedSociety.id === soc.id && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
