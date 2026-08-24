'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Store, Package, ShoppingBag, TrendingUp, Star, DollarSign, 
    CheckCircle2, Clock, Plus, ShieldCheck, Eye, Settings,
    Truck, Box, Tag, BarChart3, AlertCircle, Info, Image as ImageIcon,
    ArrowLeft, Shield, Sparkles, Check, X, Calendar, Percent, Flame
} from 'lucide-react';
import Image from 'next/image';

// Demo Seller Initial Data
const DEMO_SELLER_PROFILE = {
    id: 'seller_demo_01',
    shopName: 'Swadeshi Organic Farm',
    ownerName: 'Sunita Sharma',
    contactNumber: '+91 9876543210',
    email: 'seller@bookeato.com',
    address: 'Plot 42, Green Valley Organic Zone, Nanakramguda, Hyderabad',
    fssaiNumber: '23621003000412',
    rating: 4.9,
    joinedDate: 'Jan 2025',
    status: 'Verified Partner',
    totalRevenue: 34850,
    totalOrders: 48,
};

// Initial Orders for Demo Seller (Seller sees only Customer Ref ID, Society, Area, Pincode; Name & Phone protected)
const INITIAL_ORDERS = [
    {
        id: 'ORD-8921',
        customerId: 'CUST-7821',
        society: 'My Home Vihanga',
        area: 'Nanakramguda',
        pincode: '500032',
        items: [
            { name: 'A2 Cow Ghee (Bilona Churned)', qty: 2, price: 850, customization: 'Packaging: Glass Jar (+₹20)' },
            { name: 'Organic Hydroponic Spinach (Palak)', qty: 1, price: 45, customization: 'Eco Paper Wrap' }
        ],
        itemTotal: 1745,
        packagingCharge: 20,
        deliveryCharge: 0,
        gstTax: 0,
        voucherApplied: 'SWADESHI10 (-₹174)',
        amount: 1591,
        status: 'Pending', // Pending -> Packed -> Shipped -> Delivered
        time: '12 mins ago',
        deliverySlot: 'Today, 6:00 PM - 8:00 PM',
        pickupAgent: {
            name: 'Ramesh Kumar (Bookeato Fleet)',
            phone: '+91 9876500112'
        }
    },
    {
        id: 'ORD-8918',
        customerId: 'CUST-8918',
        society: 'Prestige High Fields',
        area: 'Financial District',
        pincode: '500081',
        items: [
            { name: 'Traditional Mango Avakaya Pickle', qty: 1, price: 290, customization: 'Extra Spicy Level' },
            { name: 'Multi-Millet Ragi Laddus', qty: 2, price: 340 }
        ],
        itemTotal: 970,
        packagingCharge: 15,
        deliveryCharge: 30,
        gstTax: 48,
        voucherApplied: 'None',
        amount: 1063,
        status: 'Packed',
        time: '45 mins ago',
        deliverySlot: 'Today, 4:00 PM - 6:00 PM',
        pickupAgent: {
            name: 'Suresh Verma (Speedy Express)',
            phone: '+91 9711223344'
        }
    },
    {
        id: 'ORD-8915',
        customerId: 'CUST-5512',
        society: 'Tellapur Bio Diversity Park',
        area: 'Tellapur',
        pincode: '502032',
        items: [
            { name: 'Raw Forest Honey (Unprocessed)', qty: 2, price: 480 }
        ],
        itemTotal: 960,
        packagingCharge: 10,
        deliveryCharge: 0,
        gstTax: 48,
        voucherApplied: 'FRESH50 (-₹50)',
        amount: 968,
        status: 'Shipped',
        time: '2 hours ago',
        deliverySlot: 'Today, 2:00 PM - 4:00 PM',
        pickupAgent: {
            name: 'Prakash Rao (Bookeato Fleet)',
            phone: '+91 9988771122'
        }
    },
    {
        id: 'ORD-8902',
        customerId: 'CUST-9012',
        society: 'Jayabheri Silicon County',
        area: 'Nanakramguda',
        pincode: '500032',
        items: [
            { name: 'Raw Forest Honey (Unprocessed)', qty: 1, price: 480 }
        ],
        itemTotal: 480,
        packagingCharge: 10,
        deliveryCharge: 0,
        gstTax: 24,
        voucherApplied: 'None',
        amount: 514,
        status: 'Delivered',
        time: 'Yesterday',
        deliverySlot: 'Completed',
        pickupAgent: {
            name: 'Ramesh Kumar (Bookeato Fleet)',
            phone: '+91 9876500112'
        }
    }
];

// Initial Seller Products with Image Metadata, Descriptions, Allergy Info, and Shelf Life
const INITIAL_SELLER_PRODUCTS = [
    {
        id: 'ghee-001',
        name: 'A2 Cow Ghee (Bilona Churned)',
        shortDescription: 'Traditional Vedic Bilona churned A2 Ghee from Gir cows.',
        detailedDescription: 'Handcrafted using traditional Bilona method where whole milk curd is churned bi-directionally to extract butter, then slow-boiled on earthen stove.',
        price: 850,
        unit: '500 ml',
        inStock: true,
        salesCount: 142,
        image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop',
        imageMetadata: {
            resolution: '1200 x 800 px',
            format: 'JPEG / WEBP',
            fileSize: '340 KB',
            altText: 'Glass Jar of Pure Golden A2 Bilona Cow Ghee'
        },
        allergyInfo: ['Gluten-Free', 'Contains Dairy', '100% Organic', 'No Added Sugar'],
        shelfLife: '12 Months from MFD',
        category: 'Ghee & Oils'
    },
    {
        id: 'veg-001',
        name: 'Organic Hydroponic Spinach (Palak)',
        shortDescription: 'Pesticide-free tender palak harvested daily from local hydroponic farm.',
        detailedDescription: 'Grown in climate-controlled hydroponic green houses using RO purified water. Zero soil contact, zero pesticides, washed with ozone water.',
        price: 45,
        unit: '250 g',
        inStock: true,
        salesCount: 89,
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop',
        imageMetadata: {
            resolution: '1200 x 800 px',
            format: 'JPEG / WEBP',
            fileSize: '280 KB',
            altText: 'Fresh Crisp Green Hydroponic Spinach Leaves'
        },
        allergyInfo: ['100% Vegan', 'Gluten-Free', 'Pesticide-Free', 'Nut-Free'],
        shelfLife: '5 Days Refrigerated',
        category: 'Fresh Vegetables'
    },
    {
        id: 'pickle-001',
        name: 'Traditional Mango Avakaya Pickle',
        shortDescription: 'Sun-dried raw mangoes in cold-pressed sesame oil.',
        detailedDescription: 'Authenic Andhra style Avakaya pickle made with fresh raw Kothapalli Kobbari mangoes, Guntur red chillies, and wood-pressed gingelly oil.',
        price: 290,
        unit: '400 g',
        inStock: true,
        salesCount: 64,
        image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?q=80&w=600&auto=format&fit=crop',
        imageMetadata: {
            resolution: '1200 x 800 px',
            format: 'JPEG / WEBP',
            fileSize: '410 KB',
            altText: 'Traditional Indian Mango Avakaya Pickle in Ceramic Jar'
        },
        allergyInfo: ['Contains Mustard & Sesame', 'Gluten-Free', 'Vegan', 'No Synthetic Preservatives'],
        shelfLife: '6 Months in Cool Dry Place',
        category: 'Pickles'
    }
];

// Initial Seller Vouchers
const INITIAL_VOUCHERS = [
    {
        id: 'v-1',
        code: 'SWADESHI10',
        discountType: 'percentage',
        discountValue: 10,
        minOrder: 500,
        expiryDate: '2026-12-31',
        usageCount: 38,
        active: true
    },
    {
        id: 'v-2',
        code: 'FRESH50',
        discountType: 'flat',
        discountValue: 50,
        minOrder: 600,
        expiryDate: '2026-10-15',
        usageCount: 19,
        active: true
    }
];

function SellerDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Admin mode state if accessed from Admin Panel
    const isAdminView = searchParams.get('admin') === 'true';

    const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'add-product' | 'trends' | 'vouchers' | 'payouts' | 'profile'>('orders');
    const tabParam = searchParams.get('tab');

    const handleTabChange = (tab: 'orders' | 'products' | 'add-product' | 'trends' | 'vouchers' | 'payouts' | 'profile') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/seller-dashboard?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        if (tabParam && ['orders', 'products', 'add-product', 'trends', 'vouchers', 'payouts', 'profile'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        }
    }, [tabParam]);
    const [seller, setSeller] = useState(DEMO_SELLER_PROFILE);
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [products, setProducts] = useState(INITIAL_SELLER_PRODUCTS);
    const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
    const [selectedMetadataProduct, setSelectedMetadataProduct] = useState<typeof INITIAL_SELLER_PRODUCTS[0] | null>(null);

    // New product state with enhanced fields
    const [newProductName, setNewProductName] = useState('');
    const [newProductShortDesc, setNewProductShortDesc] = useState('');
    const [newProductDetailedDesc, setNewProductDetailedDesc] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductUnit, setNewProductUnit] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('Ghee & Oils');
    const [newProductImage, setNewProductImage] = useState('');
    const [newProductShelfLife, setNewProductShelfLife] = useState('6 Months from MFD');
    const [newProductAllergies, setNewProductAllergies] = useState('Gluten-Free, 100% Organic, No Added Sugar');
    const [newProductAltText, setNewProductAltText] = useState('');

    // New Voucher State
    const [newVoucherCode, setNewVoucherCode] = useState('');
    const [newVoucherType, setNewVoucherType] = useState<'percentage' | 'flat'>('percentage');
    const [newVoucherValue, setNewVoucherValue] = useState('');
    const [newVoucherMinOrder, setNewVoucherMinOrder] = useState('');
    const [newVoucherExpiry, setNewVoucherExpiry] = useState('2026-12-31');

    // Pickup Agent Assignment State
    const [editingPickupOrder, setEditingPickupOrder] = useState<typeof INITIAL_ORDERS[0] | null>(null);
    const [pickupNameInput, setPickupNameInput] = useState('');
    const [pickupPhoneInput, setPickupPhoneInput] = useState('');

    const handleSavePickupAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPickupOrder || !pickupNameInput) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please enter pickup executive name.' });
            return;
        }

        const agentData = {
            name: pickupNameInput,
            phone: pickupPhoneInput || '+91 9876543210'
        };

        const updatedOrders = orders.map(o => o.id === editingPickupOrder.id ? {
            ...o,
            pickupAgent: agentData
        } : o);

        setOrders(updatedOrders);

        // Persist to local storage
        try {
            const rawOrders = localStorage.getItem('bookeato_marketplace_orders');
            const parsed = rawOrders ? JSON.parse(rawOrders) : [];
            const existingIdx = parsed.findIndex((o: any) => o.id === editingPickupOrder.id);
            if (existingIdx >= 0) {
                parsed[existingIdx].pickupAgent = agentData;
                localStorage.setItem('bookeato_marketplace_orders', JSON.stringify(parsed));
            } else {
                localStorage.setItem('bookeato_marketplace_orders', JSON.stringify(updatedOrders));
            }
        } catch (err) {
            console.error("Error saving pickup agent to local storage", err);
        }

        toast({
            title: 'Pickup Agent Assigned!',
            description: `Assigned ${pickupNameInput} for order ${editingPickupOrder.id}.`
        });

        setEditingPickupOrder(null);
        setPickupNameInput('');
        setPickupPhoneInput('');
    };

    useEffect(() => {
        const savedSeller = localStorage.getItem('bookeato_active_seller');
        if (savedSeller) {
            try {
                const parsed = JSON.parse(savedSeller);
                setSeller(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error loading seller session", e);
            }
        }

        // Sync incoming marketplace orders from local storage
        try {
            const rawOrders = localStorage.getItem('bookeato_marketplace_orders');
            if (rawOrders) {
                const parsedOrders = JSON.parse(rawOrders);
                if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
                    setOrders(prev => {
                        const existingIds = new Set(prev.map(o => o.id));
                        const uniqueNew = parsedOrders.filter((o: any) => !existingIds.has(o.id));
                        return [...uniqueNew, ...prev];
                    });
                }
            }
        } catch (err) {
            console.error("Error syncing marketplace orders", err);
        }

        // Sync seller products from local storage
        try {
            const rawProducts = localStorage.getItem('bookeato_seller_products');
            if (rawProducts) {
                const parsedProducts = JSON.parse(rawProducts);
                if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
                    const formatted = parsedProducts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        shortDescription: p.shortDescription || p.description,
                        detailedDescription: p.description,
                        price: p.price,
                        unit: p.unit || '1 Pack',
                        inStock: p.inStock !== false,
                        salesCount: 12,
                        image: p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
                        imageMetadata: {
                            resolution: '1200 x 800 px',
                            format: 'JPEG / WEBP',
                            fileSize: '350 KB',
                            altText: p.name
                        },
                        allergyInfo: ['100% Organic', 'Gluten-Free'],
                        shelfLife: '6 Months from MFD',
                        category: p.category || 'Ghee & Oils'
                    }));

                    setProducts(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNew = formatted.filter(item => !existingIds.has(item.id));
                        return [...uniqueNew, ...prev];
                    });
                }
            }
        } catch (err) {
            console.error("Error syncing seller products", err);
        }
    }, []);

    const toggleStockStatus = (productId: string) => {
        const updated = products.map(p => p.id === productId ? { ...p, inStock: !p.inStock } : p);
        setProducts(updated);

        // Sync stock availability to local storage for live marketplace buyers
        try {
            const rawProducts = localStorage.getItem('bookeato_seller_products');
            if (rawProducts) {
                const parsed = JSON.parse(rawProducts);
                const synced = parsed.map((p: any) => p.id === productId ? { ...p, inStock: !p.inStock } : p);
                localStorage.setItem('bookeato_seller_products', JSON.stringify(synced));
            }
        } catch (e) {
            console.error("Failed to sync stock status to local storage", e);
        }

        toast({
            title: 'Stock Updated',
            description: 'Product availability updated on Bookeato Live Marketplace.'
        });
    };

    // Update Order Status Progression: Pending -> Packed -> Shipped -> Delivered
    const updateOrderStatus = (orderId: string, newStatus: string) => {
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);
        
        // Also update local storage so status persists across session reloads
        try {
            const rawOrders = localStorage.getItem('bookeato_marketplace_orders');
            let parsed = rawOrders ? JSON.parse(rawOrders) : [];
            const existingIdx = parsed.findIndex((o: any) => o.id === orderId);
            if (existingIdx >= 0) {
                parsed[existingIdx].status = newStatus;
                localStorage.setItem('bookeato_marketplace_orders', JSON.stringify(parsed));
            } else {
                localStorage.setItem('bookeato_marketplace_orders', JSON.stringify(updatedOrders));
            }
        } catch (e) {
            console.error("Error persisting status update", e);
        }

        toast({
            title: 'Order Status Updated',
            description: `Order ${orderId} marked as ${newStatus.toUpperCase()}.`
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProductImage(reader.result as string);
                toast({
                    title: 'Photo Uploaded!',
                    description: `${file.name} loaded successfully.`
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductName || !newProductPrice) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide product name and price.' });
            return;
        }

        const allergyArray = newProductAllergies
            ? newProductAllergies.split(',').map(s => s.trim()).filter(Boolean)
            : ['100% Organic', 'Gluten-Free'];

        const newProdId = `prod_${Date.now()}`;

        const newProd = {
            id: newProdId,
            name: newProductName,
            shortDescription: newProductShortDesc || 'Freshly made authentic marketplace product.',
            detailedDescription: newProductDetailedDesc || 'Handcrafted using traditional organic farming techniques.',
            price: parseFloat(newProductPrice),
            unit: newProductUnit || '1 Unit',
            inStock: true,
            salesCount: 0,
            image: newProductImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
            imageMetadata: {
                resolution: '1200 x 800 px',
                format: 'JPEG / WEBP',
                fileSize: '350 KB',
                altText: newProductAltText || `High resolution image of ${newProductName}`
            },
            allergyInfo: allergyArray,
            shelfLife: newProductShelfLife || '6 Months from MFD',
            category: newProductCategory
        };

        setProducts([newProd, ...products]);

        // Publish to marketplace local storage
        try {
            const raw = localStorage.getItem('bookeato_seller_products');
            const existing = raw ? JSON.parse(raw) : [];

            const getMarketplaceCategory = (cat: string) => {
                if (cat.includes('Vegetable')) return 'vegetable';
                if (cat.includes('Pickle')) return 'pickle';
                if (cat.includes('Laddus') || cat.includes('Snacks')) return 'snack';
                if (cat.includes('Honey')) return 'honey';
                return 'ghee-oil';
            };

            const marketplaceFormattedProd = {
                id: newProdId,
                name: newProductName,
                shortDescription: newProductShortDesc || 'Freshly made authentic marketplace product.',
                price: parseFloat(newProductPrice),
                originalPrice: Math.round(parseFloat(newProductPrice) * 1.15),
                sellerName: seller.shopName || 'Swadeshi Organic Farm',
                sellerRating: 5.0,
                rating: 5.0,
                reviewsCount: 1,
                image: newProductImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
                description: newProductDetailedDesc || newProductShortDesc || 'Freshly made authentic marketplace product.',
                ingredients: allergyArray,
                isHealthy: true,
                unit: newProductUnit || '1 Unit',
                category: getMarketplaceCategory(newProductCategory),
                inStock: true,
                badge: 'New Launch',
                brandStory: `Brought to you by ${seller.shopName}.`
            };
            localStorage.setItem('bookeato_seller_products', JSON.stringify([marketplaceFormattedProd, ...existing]));
        } catch (e) {
            console.error("Failed to publish product to marketplace storage:", e);
        }

        setNewProductName('');
        setNewProductShortDesc('');
        setNewProductDetailedDesc('');
        setNewProductPrice('');
        setNewProductUnit('');
        setNewProductImage('');
        setNewProductAltText('');
        
        toast({ title: 'Product Published!', description: `${newProductName} is now live on the Marketplace.` });
        setActiveTab('products');
    };

    const handleCreateVoucher = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVoucherCode || !newVoucherValue) {
            toast({ variant: 'destructive', title: 'Missing Code', description: 'Please enter voucher code and value.' });
            return;
        }

        const voucher = {
            id: `v_${Date.now()}`,
            code: newVoucherCode.toUpperCase(),
            discountType: newVoucherType,
            discountValue: parseFloat(newVoucherValue),
            minOrder: parseFloat(newVoucherMinOrder) || 0,
            expiryDate: newVoucherExpiry,
            usageCount: 0,
            active: true
        };

        setVouchers([voucher, ...vouchers]);
        setNewVoucherCode('');
        setNewVoucherValue('');
        setNewVoucherMinOrder('');
        toast({ title: 'Voucher Created!', description: `Coupon ${voucher.code} is now active for buyers.` });
    };

    const toggleVoucherActive = (vId: string) => {
        setVouchers(vouchers.map(v => v.id === vId ? { ...v, active: !v.active } : v));
        toast({ title: 'Voucher Updated', description: 'Voucher availability status changed.' });
    };

    const handleLogout = () => {
        localStorage.removeItem('bookeato_active_seller');
        toast({ title: 'Logged Out', description: 'Signed out of Seller Portal.' });
        router.push('/seller-signup');
    };

    return (
        <AppLayout pageTitle="Seller Portal - Bookeato">
            <div className="min-h-screen bg-stone-100/80 pb-28 w-full max-w-full overflow-x-hidden">
                
                {/* ADMIN ACCESS OVERLAY BANNER */}
                {isAdminView && (
                    <div className="bg-amber-500 text-stone-950 px-3 py-1.5 text-xs font-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 shadow-md w-full min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">👑 ADMIN MODE — <strong>{seller.shopName}</strong></span>
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => router.push('/admin')}
                            className="bg-stone-950 hover:bg-stone-800 text-white font-extrabold text-[10px] sm:text-[11px] h-6 sm:h-7 rounded-lg shrink-0"
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" /> Admin Panel
                        </Button>
                    </div>
                )}

                {/* 1. Header Banner - Clean spacing for Mobile & Desktop */}
                <div className="bg-emerald-950 text-white py-3 sm:py-6 px-3 sm:px-8 relative shadow-md w-full min-w-0">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <Badge className="bg-amber-400 text-stone-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Verified Seller Portal
                                </Badge>
                                <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold">• ID: {seller.id}</span>
                            </div>
                            <h1 className="text-base sm:text-3xl font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2 truncate">
                                <Store className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
                                <span className="truncate">{seller.shopName}</span>
                            </h1>
                            <div className="text-[10px] sm:text-sm text-stone-300 font-medium leading-relaxed flex flex-wrap gap-x-2 gap-y-0.5">
                                <span>Owner: <strong className="text-white">{seller.ownerName}</strong></span>
                                <span>• Contact: <strong className="text-white">{seller.contactNumber}</strong></span>
                                <span>• FSSAI: <strong className="text-white">{seller.fssaiNumber}</strong></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 sm:pt-0">
                            <Button 
                                variant="secondary"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-[11px] sm:text-xs rounded-lg sm:rounded-xl h-7 sm:h-9 px-2.5 shadow-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Home
                            </Button>
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/marketplace')}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl h-7 sm:h-9 px-2.5"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Live Shop
                            </Button>
                            <Button 
                                variant="destructive"
                                size="sm"
                                onClick={handleLogout}
                                className="bg-red-600/90 hover:bg-red-600 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl h-7 sm:h-9 px-2.5"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
                       {/* 2. Key Metrics Cards Row - 2x2 Responsive Grid with min-w-0 for mobile viewport fit */}
                <div className="max-w-6xl mx-auto px-1 sm:px-8 mt-2 sm:mt-6 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full">
                        <Card className="rounded-2xl border border-stone-200/70 shadow-sm bg-white p-3 sm:p-4 hover:shadow-md transition-all min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase text-stone-400 tracking-wider truncate">Total Sales</span>
                                <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                            </div>
                            <p className="text-base sm:text-2xl font-black text-stone-950 mt-1 sm:mt-2 truncate">₹{seller.totalRevenue.toLocaleString('en-IN')}</p>
                            <span className="text-[9px] sm:text-xs text-emerald-700 font-extrabold flex items-center gap-0.5 mt-0.5 sm:mt-1 truncate">
                                <TrendingUp className="w-3 h-3 shrink-0" /> +14.2% week
                            </span>
                        </Card>

                        <Card className="rounded-2xl border border-stone-200/70 shadow-sm bg-white p-3 sm:p-4 hover:shadow-md transition-all min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase text-stone-400 tracking-wider truncate">Total Orders</span>
                                <div className="p-1.5 sm:p-2 bg-blue-100 text-blue-800 rounded-xl shrink-0">
                                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                            </div>
                            <p className="text-base sm:text-2xl font-black text-stone-950 mt-1 sm:mt-2 truncate">{orders.length + 45}</p>
                            <span className="text-[9px] sm:text-xs text-blue-700 font-extrabold flex items-center gap-0.5 mt-0.5 sm:mt-1 truncate">
                                <Clock className="w-3 h-3 shrink-0" /> {orders.filter(o => o.status === 'Pending' || o.status === 'Packed').length} Active
                            </span>
                        </Card>

                        <Card className="rounded-2xl border border-stone-200/70 shadow-sm bg-white p-3 sm:p-4 hover:shadow-md transition-all min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase text-stone-400 tracking-wider truncate">Products</span>
                                <div className="p-1.5 sm:p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                            </div>
                            <p className="text-base sm:text-2xl font-black text-stone-950 mt-1 sm:mt-2 truncate">{products.length}</p>
                            <span className="text-[9px] sm:text-xs text-amber-800 font-extrabold flex items-center gap-0.5 mt-0.5 sm:mt-1 truncate">
                                <CheckCircle2 className="w-3 h-3 shrink-0" /> {products.filter(p => p.inStock).length} In Stock
                            </span>
                        </Card>

                        <Card className="rounded-2xl border border-stone-200/70 shadow-sm bg-white p-3 sm:p-4 hover:shadow-md transition-all min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase text-stone-400 tracking-wider truncate">Rating</span>
                                <div className="p-1.5 sm:p-2 bg-purple-100 text-purple-800 rounded-xl shrink-0">
                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-purple-600" />
                                </div>
                            </div>
                            <p className="text-base sm:text-2xl font-black text-stone-950 mt-1 sm:mt-2 truncate">{seller.rating} ★</p>
                            <span className="text-[9px] sm:text-xs text-purple-800 font-extrabold flex items-center gap-0.5 mt-0.5 sm:mt-1 truncate">
                                {seller.reviewCount} Verified Reviews
                            </span>
                        </Card>
                    </div>
                </div>

                {/* 3. Navigation Tabs */}
                <div className="max-w-6xl mx-auto px-3 sm:px-8 pt-3 sm:pt-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-stone-200 no-scrollbar">
                        <button
                            onClick={() => handleTabChange('orders')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'orders'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            Orders ({orders.length})
                        </button>

                        <button
                            onClick={() => handleTabChange('products')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'products'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            My Products ({products.length})
                        </button>

                        <button
                            onClick={() => handleTabChange('add-product')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'add-product'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            + Add Product
                        </button>

                        <button
                            onClick={() => handleTabChange('trends')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'trends'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                            Order Trends
                        </button>

                        <button
                            onClick={() => handleTabChange('vouchers')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'vouchers'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <Tag className="w-3.5 h-3.5 text-amber-400" />
                            Coupons ({vouchers.length})
                        </button>

                        <button
                            onClick={() => handleTabChange('payouts')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'payouts'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                            Payouts
                        </button>

                        <button
                            onClick={() => handleTabChange('profile')}
                            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'profile'
                                    ? 'bg-emerald-950 text-white shadow-md'
                                    : 'bg-white text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            <Settings className="w-3.5 h-3.5 text-amber-400" />
                            Shop Profile
                        </button>
                    </div>

                    {/* TAB 1: CUSTOMER ORDERS & ORDER STATUS WORKFLOW */}
                    {activeTab === 'orders' && (
                        <div className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                                    <span>Live Customer Orders</span>
                                    <Badge className="bg-emerald-100 text-emerald-900 font-bold text-xs">{orders.length}</Badge>
                                </h2>
                                <span className="text-xs text-stone-500 font-medium hidden sm:inline">Status Flow: Pending → Packed → Shipped → Delivered</span>
                            </div>

                            <div className="space-y-4">
                                {orders.map((ord) => (
                                    <Card key={ord.id} className="rounded-2xl border-stone-200 shadow-sm overflow-hidden bg-white p-4 sm:p-5 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-stone-950 text-base">{ord.id}</span>
                                                    
                                                    {/* Updated Status Progression Badge */}
                                                    <Badge className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                        ord.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                                        ord.status === 'Packed' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                                                        ord.status === 'Shipped' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                                        'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                    }`}>
                                                        {ord.status === 'Pending' && '⏳ Pending Action'}
                                                        {ord.status === 'Packed' && '📦 Order Packed'}
                                                        {ord.status === 'Shipped' && '🚚 Shipped / In Transit'}
                                                        {ord.status === 'Delivered' && '✅ Delivered'}
                                                    </Badge>

                                                    <span className="text-xs text-stone-400 font-medium">• {ord.time}</span>
                                                </div>
                                                <p className="text-xs text-stone-500 font-medium mt-0.5">
                                                    Delivery Slot: <span className="font-bold text-stone-700">{ord.deliverySlot}</span>
                                                </p>
                                            </div>

                                            {/* Status Action Buttons */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ord.status === 'Pending' && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(ord.id, 'Packed')}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                                                    >
                                                        <Box className="w-3.5 h-3.5 mr-1" /> Mark as Packed
                                                    </Button>
                                                )}

                                                {ord.status === 'Packed' && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(ord.id, 'Shipped')}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                                                    >
                                                        <Truck className="w-3.5 h-3.5 mr-1" /> Ship / Dispatch
                                                    </Button>
                                                )}

                                                {ord.status === 'Shipped' && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                                                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Delivered
                                                    </Button>
                                                )}

                                                {ord.status === 'Delivered' && (
                                                    <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                                        <CheckCircle2 className="w-4 h-4" /> Delivered & Settled
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Customer Details & Complete Order Summary */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                                            <div className="bg-stone-50 p-3.5 rounded-xl space-y-2 border border-stone-200/70">
                                                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">Delivery Destination (Privacy Masked)</span>
                                                <div className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                                                    <span>👤 Customer Ref:</span>
                                                    <Badge className="bg-emerald-100 text-emerald-950 font-black text-xs">{ord.customerId}</Badge>
                                                </div>
                                                
                                                <div className="space-y-1 text-stone-700 font-semibold text-xs pt-1">
                                                    <p className="flex items-center gap-1.5 text-emerald-950 font-bold">
                                                        🏢 Society: <span className="text-stone-900">{ord.society}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        📍 Area: <span className="text-stone-900">{ord.area}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        📮 Pincode: <span className="text-stone-900">{ord.pincode}</span>
                                                    </p>
                                                </div>

                                                <div className="pt-2 border-t border-stone-200">
                                                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                                                        🔒 Customer Name, Phone & Flat No. Masked for Buyer Privacy
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Breakdown / Summary */}
                                            <div className="bg-stone-50 p-3.5 rounded-xl space-y-2 border border-stone-200/70">
                                                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">Order Item & Financial Summary</span>
                                                <div className="space-y-1.5">
                                                    {ord.items.map((it, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-stone-800 font-bold text-xs">
                                                            <span>{it.qty}x {it.name} {it.customization && <span className="text-[10px] text-emerald-800 font-medium">({it.customization})</span>}</span>
                                                            <span>₹{it.price * it.qty}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-2 border-t border-stone-200 space-y-1 text-[11px] text-stone-500 font-medium">
                                                    <div className="flex justify-between">
                                                        <span>Items Subtotal:</span>
                                                        <span>₹{ord.itemTotal}</span>
                                                    </div>
                                                    {ord.packagingCharge > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Eco Packaging Charge:</span>
                                                            <span>₹{ord.packagingCharge}</span>
                                                        </div>
                                                    )}
                                                    {ord.voucherApplied !== 'None' && (
                                                        <div className="flex justify-between text-emerald-700 font-bold">
                                                            <span>Voucher Discount:</span>
                                                            <span>{ord.voucherApplied}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-stone-300 flex justify-between items-center text-sm font-black text-stone-950">
                                                    <span>Net Amount Paid:</span>
                                                    <span className="text-emerald-800 text-base">₹{ord.amount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assigned Pickup Delivery Executive Section (Visible to Seller, Editable by Admin) */}
                                        <div className="pt-2 border-t border-stone-100">
                                            <div className="bg-emerald-900/5 p-3 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-emerald-950 text-amber-400 rounded-xl shrink-0">
                                                        <Truck className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-0.5 text-xs">
                                                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Assigned Pickup Delivery Executive</span>
                                                        {ord.pickupAgent ? (
                                                            <div>
                                                                <div className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                                                                    <span>🛵 {ord.pickupAgent.name}</span>
                                                                    <Badge className="bg-emerald-100 text-emerald-900 text-[9px] font-bold">Verified Fleet</Badge>
                                                                </div>
                                                                <p className="text-stone-600 font-semibold text-[11px] mt-0.5">
                                                                    📞 Contact: <span className="font-bold text-stone-900">{ord.pickupAgent.phone}</span>
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-stone-500 font-medium italic">No Pickup Executive assigned yet (Admin will assign before dispatch)</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingPickupOrder(ord);
                                                        setPickupNameInput(ord.pickupAgent?.name || '');
                                                        setPickupPhoneInput(ord.pickupAgent?.phone || '');
                                                    }}
                                                    className="text-xs font-bold rounded-xl border-stone-300 hover:bg-stone-100 text-stone-800 shrink-0 h-8"
                                                >
                                                    {ord.pickupAgent ? '✏️ Edit Pickup Agent (Admin)' : '+ Assign Pickup Agent (Admin)'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MY PRODUCTS (WITH IMAGE METADATA, ALLERGY INFO & SHELF LIFE) */}
                    {activeTab === 'products' && (
                        <div className="pt-3 sm:pt-6 space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm sm:text-lg font-black text-stone-900">Products ({products.length})</h2>
                                <Button 
                                    onClick={() => setActiveTab('add-product')}
                                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl h-7 sm:h-9 px-2.5"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                                {products.map((p) => (
                                    <Card key={p.id} className="rounded-xl sm:rounded-2xl border-stone-200 overflow-hidden bg-white shadow-sm flex flex-col justify-between p-2.5 sm:p-4 space-y-2 hover:shadow-md transition-shadow">
                                        <div className="space-y-2">
                                            <div className="relative w-full h-28 sm:h-40 bg-stone-100 rounded-lg sm:rounded-xl overflow-hidden group">
                                                <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                
                                                <Badge className={`absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 ${p.inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                                                    {p.inStock ? 'In Stock' : 'Out'}
                                                </Badge>

                                                {/* Image Metadata Info Button */}
                                                <button
                                                    onClick={() => setSelectedMetadataProduct(p)}
                                                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 backdrop-blur-sm transition-colors"
                                                >
                                                    <ImageIcon className="w-3 h-3 text-amber-400" /> Specs
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-black text-stone-900 text-xs sm:text-sm leading-snug line-clamp-1">{p.name}</h3>
                                                <p className="text-[10px] sm:text-xs text-stone-500 font-medium leading-tight line-clamp-2">{p.shortDescription}</p>

                                                {/* Shelf Life & Detailed Description */}
                                                {p.shelfLife && (
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-flex items-center gap-0.5 mt-0.5">
                                                        <Clock className="w-2.5 h-2.5" /> {p.shelfLife}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-baseline pt-1">
                                                    <span className="text-sm sm:text-lg font-black text-emerald-950">₹{p.price}</span>
                                                    <span className="text-[9px] sm:text-xs font-bold text-stone-400">{p.unit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between gap-1">
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleStockStatus(p.id)}
                                                className={`text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl flex-1 h-7 px-1.5 ${
                                                    p.inStock ? 'border-amber-300 text-amber-800 hover:bg-amber-50' : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                                                }`}
                                            >
                                                {p.inStock ? 'Mark Out' : 'Mark In'}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ADD NEW PRODUCT (WITH PHONE IMAGE UPLOAD, ALLERGY INFO & SHELF LIFE) */}
                    {activeTab === 'add-product' && (
                        <div className="pt-2 sm:pt-6 w-full max-w-2xl mx-auto space-y-3 px-0 sm:px-0 mb-16 overflow-hidden">
                            <Card className="rounded-xl sm:rounded-2xl border-stone-200 bg-white p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-6 w-full max-w-full overflow-hidden">
                                <div className="space-y-0.5 border-b border-stone-100 pb-2">
                                    <h2 className="text-base sm:text-xl font-black text-stone-900">Publish New Product to Marketplace</h2>
                                    <p className="text-[11px] sm:text-xs text-stone-500 font-medium">Add organic produce, pickles, ghee or homemade delights with allergy and shelf-life disclosures.</p>
                                </div>

                                <form onSubmit={handleAddProduct} className="space-y-3 sm:space-y-4 w-full">
                                    <div className="w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Product Title *</label>
                                        <Input 
                                            placeholder="e.g. Pure Cold Pressed Groundnut Oil"
                                            value={newProductName}
                                            onChange={(e) => setNewProductName(e.target.value)}
                                            className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                            required
                                        />
                                    </div>

                                    <div className="w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Short Summary (Shown below title) *</label>
                                        <Input 
                                            placeholder="e.g. Unrefined wood-pressed peanut oil rich in natural antioxidants."
                                            value={newProductShortDesc}
                                            onChange={(e) => setNewProductShortDesc(e.target.value)}
                                            className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                        />
                                    </div>

                                    <div className="w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Detailed Story & Ingredients</label>
                                        <Textarea 
                                            placeholder="Describe ingredients, preparation method, and sourcing details..."
                                            value={newProductDetailedDesc}
                                            onChange={(e) => setNewProductDetailedDesc(e.target.value)}
                                            className="rounded-lg sm:rounded-xl min-h-[60px] sm:min-h-[80px] text-xs w-full min-w-0"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
                                        <div className="min-w-0">
                                            <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Price (₹) *</label>
                                            <Input 
                                                type="number"
                                                placeholder="e.g. 350"
                                                value={newProductPrice}
                                                onChange={(e) => setNewProductPrice(e.target.value)}
                                                className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                                required
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Packaging Unit *</label>
                                            <Input 
                                                placeholder="e.g. 1 Litre Bottle"
                                                value={newProductUnit}
                                                onChange={(e) => setNewProductUnit(e.target.value)}
                                                className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
                                        <div className="min-w-0">
                                            <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Category *</label>
                                            <select 
                                                value={newProductCategory}
                                                onChange={(e) => setNewProductCategory(e.target.value)}
                                                className="w-full h-9 sm:h-10 px-2.5 rounded-lg sm:rounded-xl border border-stone-200 bg-white text-xs font-bold min-w-0"
                                            >
                                                <option value="Ghee & Oils">Ghee & Cold Pressed Oils</option>
                                                <option value="Fresh Vegetables">Fresh Vegetables & Harvest</option>
                                                <option value="Pickles">Homemade Pickles & Chutneys</option>
                                                <option value="Laddus & Snacks">Millet Laddus & Traditional Snacks</option>
                                                <option value="Pure Honey">Pure Honey & Organic Jaggery</option>
                                            </select>
                                        </div>

                                        <div className="min-w-0">
                                            <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Shelf Life Details *</label>
                                            <Input 
                                                placeholder="e.g. 6 Months from MFD or 15 Days Fresh"
                                                value={newProductShelfLife}
                                                onChange={(e) => setNewProductShelfLife(e.target.value)}
                                                className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-stone-700 block mb-1">Allergy & Dietary Information</label>
                                        <Input 
                                            placeholder="e.g. Gluten-Free, Contains Peanut, 100% Vegan, No Sugar"
                                            value={newProductAllergies}
                                            onChange={(e) => setNewProductAllergies(e.target.value)}
                                            className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs w-full min-w-0"
                                        />
                                    </div>

                                    {/* PHONE IMAGE UPLOADER & ALT TEXT SPECS */}
                                    <div className="p-3 bg-emerald-950/5 rounded-xl border border-emerald-200/80 space-y-2.5 w-full min-w-0 overflow-hidden">
                                        <span className="text-[11px] sm:text-xs font-black text-emerald-950 flex items-center gap-1.5 truncate">
                                            <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" /> Product Photo Upload (Phone / Camera)
                                        </span>
                                        
                                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full min-w-0">
                                            {/* Phone Upload Trigger Button */}
                                            <div className="w-full sm:w-auto shrink-0 min-w-0">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    id="product-image-upload" 
                                                    onChange={handleImageUpload} 
                                                    className="hidden" 
                                                />
                                                <label 
                                                    htmlFor="product-image-upload" 
                                                    className="flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-3 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors w-full text-center truncate"
                                                >
                                                    <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" /> 📷 Upload Photo from Phone
                                                </label>
                                            </div>

                                            {/* Preview Thumbnail */}
                                            {newProductImage && (
                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-400 shrink-0 shadow-sm">
                                                    <Image src={newProductImage} alt="Uploaded product preview" fill className="object-cover" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                                            <div className="min-w-0">
                                                <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Image URL (Optional fallback)</label>
                                                <Input 
                                                    placeholder="https://..."
                                                    value={newProductImage}
                                                    onChange={(e) => setNewProductImage(e.target.value)}
                                                    className="rounded-lg h-8 bg-white text-xs w-full min-w-0"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <label className="text-[10px] font-bold text-stone-600 block mb-0.5">Image Alt Description</label>
                                                <Input 
                                                    placeholder="Alt Text for Accessibility"
                                                    value={newProductAltText}
                                                    onChange={(e) => setNewProductAltText(e.target.value)}
                                                    className="rounded-lg h-8 bg-white text-xs w-full min-w-0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit"
                                        className="w-full h-10 sm:h-11 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md min-w-0"
                                    >
                                        Publish Product to Marketplace
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* TAB 4: PAST ORDER TRENDS & FORECAST */}
                    {activeTab === 'trends' && (
                        <div className="pt-6 space-y-4">
                            <Card className="rounded-2xl border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-emerald-800" />
                                            Past Order Trends & Demand Forecast
                                        </h2>
                                        <p className="text-xs text-stone-500 font-medium">Analyze sales performance and predict upcoming stock demand.</p>
                                    </div>
                                    <Badge className="bg-emerald-100 text-emerald-900 font-bold text-xs w-fit">
                                        ⚡ AI Forecast Active
                                    </Badge>
                                </div>

                                {/* Forecast Insight Banner */}
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                        <span>Demand Forecast Alert for Next Week</span>
                                    </div>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Based on neighborhood order history in Nanakramguda & Financial District, demand for <strong>A2 Cow Ghee (+35%)</strong> and <strong>Homemade Avakaya Mango Pickle (+20%)</strong> is projected to surge this coming weekend. We recommend preparing 25 extra jars in advance.
                                    </p>
                                </div>

                                {/* Weekly Order Volume Trend Bars */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Weekly Order Volume (Last 7 Days)</h3>
                                    <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 pb-2 border-b border-stone-200">
                                        {[
                                            { day: 'Mon', count: 6, percent: '40%' },
                                            { day: 'Tue', count: 8, percent: '55%' },
                                            { day: 'Wed', count: 5, percent: '35%' },
                                            { day: 'Thu', count: 9, percent: '65%' },
                                            { day: 'Fri', count: 12, percent: '80%' },
                                            { day: 'Sat', count: 18, percent: '100%' },
                                            { day: 'Sun', count: 15, percent: '90%' },
                                        ].map((d, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                                                <span className="text-[10px] font-extrabold text-emerald-800">{d.count}</span>
                                                <div 
                                                    style={{ height: d.percent }} 
                                                    className="w-full bg-emerald-700/90 rounded-t-lg transition-all hover:bg-emerald-900" 
                                                />
                                                <span className="text-[10px] font-bold text-stone-500">{d.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ordering Time Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                        <span className="text-[10px] font-black uppercase text-stone-400">Peak Order Slot</span>
                                        <p className="text-lg font-black text-stone-900 mt-1">5:00 PM – 8:00 PM</p>
                                        <span className="text-[10px] text-stone-500 font-medium">62% of orders placed in evening</span>
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                        <span className="text-[10px] font-black uppercase text-stone-400">Repeat Customer Rate</span>
                                        <p className="text-lg font-black text-emerald-800 mt-1">78.4%</p>
                                        <span className="text-[10px] text-stone-500 font-medium">High neighborhood loyalty</span>
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                        <span className="text-[10px] font-black uppercase text-stone-400">Top Rated Product</span>
                                        <p className="text-lg font-black text-stone-900 mt-1">A2 Cow Ghee</p>
                                        <span className="text-[10px] text-amber-700 font-medium">142 total units sold</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB 5: DISCOUNT VOUCHERS & COUPONS */}
                    {activeTab === 'vouchers' && (
                        <div className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Voucher Creator Form */}
                                <Card className="rounded-2xl border-stone-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1">
                                    <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-emerald-800" /> Create Discount Coupon
                                    </h2>

                                    <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
                                        <div>
                                            <label className="font-bold text-stone-700 block mb-1">Coupon Code *</label>
                                            <Input 
                                                placeholder="e.g. FESTIVE20"
                                                value={newVoucherCode}
                                                onChange={(e) => setNewVoucherCode(e.target.value)}
                                                className="rounded-xl uppercase font-black tracking-wider"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="font-bold text-stone-700 block mb-1">Type</label>
                                                <select 
                                                    value={newVoucherType}
                                                    onChange={(e: any) => setNewVoucherType(e.target.value)}
                                                    className="w-full h-10 px-2 rounded-xl border border-stone-200 bg-white text-xs font-bold"
                                                >
                                                    <option value="percentage">% Percentage</option>
                                                    <option value="flat">₹ Flat Off</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="font-bold text-stone-700 block mb-1">Discount Value *</label>
                                                <Input 
                                                    type="number"
                                                    placeholder="e.g. 10 or 50"
                                                    value={newVoucherValue}
                                                    onChange={(e) => setNewVoucherValue(e.target.value)}
                                                    className="rounded-xl font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="font-bold text-stone-700 block mb-1">Min Order Amount (₹)</label>
                                            <Input 
                                                type="number"
                                                placeholder="e.g. 500"
                                                value={newVoucherMinOrder}
                                                onChange={(e) => setNewVoucherMinOrder(e.target.value)}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-bold text-stone-700 block mb-1">Expiry Date</label>
                                            <Input 
                                                type="date"
                                                value={newVoucherExpiry}
                                                onChange={(e) => setNewVoucherExpiry(e.target.value)}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <Button 
                                            type="submit"
                                            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl h-10"
                                        >
                                            Activate Coupon
                                        </Button>
                                    </form>
                                </Card>

                                {/* Voucher List */}
                                <Card className="rounded-2xl border-stone-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-2">
                                    <h2 className="text-base font-black text-stone-900">Active Discount Coupons ({vouchers.length})</h2>

                                    <div className="space-y-3">
                                        {vouchers.map((v) => (
                                            <div key={v.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-950 text-white font-black text-xs tracking-wider px-2.5 py-0.5">
                                                            {v.code}
                                                        </Badge>
                                                        <Badge className={`text-[10px] font-bold ${v.active ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                                                            {v.active ? 'Active' : 'Disabled'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-stone-700 font-bold">
                                                        {v.discountType === 'percentage' ? `${v.discountValue}% OFF` : `₹${v.discountValue} FLAT OFF`} on orders above ₹{v.minOrder}
                                                    </p>
                                                    <span className="text-[10px] text-stone-400 font-medium block">
                                                        Expires: {v.expiryDate} • Redemptions: {v.usageCount} times
                                                    </span>
                                                </div>

                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleVoucherActive(v.id)}
                                                    className="text-xs font-bold rounded-xl"
                                                >
                                                    {v.active ? 'Disable Coupon' : 'Enable Coupon'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: PAYOUTS & EARNINGS */}
                    {activeTab === 'payouts' && (
                        <div className="pt-6 space-y-4">
                            <Card className="rounded-2xl border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-900">Seller Earnings & Bank Settlements</h2>
                                        <p className="text-xs text-stone-500 font-medium">Automatic payouts transferred to verified bank account every Monday.</p>
                                    </div>
                                    <Button className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl">
                                        Request Instant Payout
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <span className="text-[10px] font-black uppercase text-emerald-800">Available Balance</span>
                                        <p className="text-2xl font-black text-emerald-950 mt-1">₹8,450</p>
                                        <span className="text-[10px] text-emerald-700 font-medium">Ready for instant withdrawal</span>
                                    </div>

                                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                        <span className="text-[10px] font-black uppercase text-stone-400">Total Settled Payouts</span>
                                        <p className="text-2xl font-black text-stone-900 mt-1">₹26,400</p>
                                        <span className="text-[10px] text-stone-500 font-medium">Transferred to HDFC Bank</span>
                                    </div>

                                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                        <span className="text-[10px] font-black uppercase text-stone-400">Platform Commission</span>
                                        <p className="text-2xl font-black text-stone-900 mt-1">0%</p>
                                        <span className="text-[10px] text-amber-700 font-bold">Zero Commission introductory offer</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB 7: SHOP PROFILE */}
                    {activeTab === 'profile' && (
                        <div className="pt-6 max-w-2xl mx-auto space-y-4">
                            <Card className="rounded-2xl border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                                <h2 className="text-lg font-black text-stone-900">Verified Seller Business Details</h2>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-2 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">Shop Name:</span>
                                        <span className="font-extrabold text-stone-900">{seller.shopName}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">Registered Owner:</span>
                                        <span className="font-extrabold text-stone-900">{seller.ownerName}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">FSSAI Registration:</span>
                                        <span className="font-extrabold text-emerald-800">{seller.fssaiNumber}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">Contact Phone:</span>
                                        <span className="font-extrabold text-stone-900">{seller.contactNumber}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">Business Address:</span>
                                        <span className="font-extrabold text-stone-900 text-right max-w-xs leading-relaxed">{seller.address}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* IMAGE METADATA SPECS DIALOG / POPUP */}
            {selectedMetadataProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button 
                            onClick={() => setSelectedMetadataProduct(null)}
                            className="absolute top-4 right-4 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 text-emerald-900 font-black text-lg">
                            <ImageIcon className="w-5 h-5 text-amber-500" /> Image Metadata & Specs
                        </div>

                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-stone-200">
                            <Image src={selectedMetadataProduct.image} alt={selectedMetadataProduct.name} fill className="object-cover" />
                        </div>

                        <div className="space-y-2 text-xs">
                            <p className="font-black text-stone-900 text-sm">{selectedMetadataProduct.name}</p>
                            
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 text-stone-700">
                                <div className="flex justify-between">
                                    <span className="text-stone-500 font-medium">Dimensions / Resolution:</span>
                                    <span className="font-bold">{selectedMetadataProduct.imageMetadata?.resolution || '1200 x 800 px'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500 font-medium">Image Format:</span>
                                    <span className="font-bold">{selectedMetadataProduct.imageMetadata?.format || 'JPEG / WEBP'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500 font-medium">File Size:</span>
                                    <span className="font-bold">{selectedMetadataProduct.imageMetadata?.fileSize || '340 KB'}</span>
                                </div>
                                <div className="pt-1 border-t border-stone-200">
                                    <span className="text-stone-500 font-medium block mb-0.5">Accessibility Alt Description:</span>
                                    <span className="font-semibold text-stone-900 block leading-snug">{selectedMetadataProduct.imageMetadata?.altText || selectedMetadataProduct.name}</span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setSelectedMetadataProduct(null)}
                            className="w-full bg-stone-900 text-white font-extrabold rounded-xl h-10"
                        >
                            Close Specs
                        </Button>
                    </div>
                </div>
            )}

            {/* ADMIN PICKUP AGENT ASSIGNMENT DIALOG */}
            {editingPickupOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button 
                            onClick={() => setEditingPickupOrder(null)}
                            className="absolute top-4 right-4 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 text-emerald-950 font-black text-lg">
                            <Truck className="w-5 h-5 text-amber-500" /> Assign Pickup Executive (Admin)
                        </div>

                        <p className="text-xs text-stone-500 font-medium">
                            Specify delivery agent contact details for Order <strong>{editingPickupOrder.id}</strong> ({editingPickupOrder.society}).
                        </p>

                        <form onSubmit={handleSavePickupAgent} className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-stone-700 block mb-1">Pickup Executive Name *</label>
                                <Input 
                                    placeholder="e.g. Ramesh Kumar (Bookeato Fleet)"
                                    value={pickupNameInput}
                                    onChange={(e) => setPickupNameInput(e.target.value)}
                                    className="rounded-xl font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-bold text-stone-700 block mb-1">Pickup Executive Phone Number *</label>
                                <Input 
                                    placeholder="e.g. +91 9876500112"
                                    value={pickupPhoneInput}
                                    onChange={(e) => setPickupPhoneInput(e.target.value)}
                                    className="rounded-xl font-medium"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-2">
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingPickupOrder(null)}
                                    className="flex-1 font-bold text-xs rounded-xl h-10"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    className="flex-1 bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl h-10"
                                >
                                    Save Assignment
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default function SellerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-stone-100">
                <div className="text-center space-y-2">
                    <Store className="w-8 h-8 text-emerald-800 animate-bounce mx-auto" />
                    <p className="text-xs font-bold text-stone-600">Loading Seller Dashboard...</p>
                </div>
            </div>
        }>
            <SellerDashboardContent />
        </Suspense>
    );
}
