'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Store, Loader2, ArrowRight, Plus, Trash2, ImagePlus, X, KeyRound, Sparkles, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const sellerSignUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  shopName: z.string().min(2, 'Shop/Business Name must be at least 2 characters.'),
  address: z.string().min(10, 'Please enter a complete business address.'),
});

type CustomizationGroupInput = {
    groupTitle: string;
    optionsStr: string; // e.g. "Mild (+0), Extra Spicy (+20)"
};

type ProductItem = {
    id: string;
    name: string;
    shortDescription: string;
    price: string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
    customizationGroups: CustomizationGroupInput[];
};

export function SellerSignUpForm() {
    const { auth, firestore, storage } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loginMobile, setLoginMobile] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [products, setProducts] = useState<ProductItem[]>([
        { id: '1', name: '', shortDescription: '', price: '', description: '', imageFile: null, imagePreview: null, customizationGroups: [] }
    ]);
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const form = useForm<z.infer<typeof sellerSignUpSchema>>({
        resolver: zodResolver(sellerSignUpSchema),
        defaultValues: { 
            name: '', 
            phoneNumber: '', 
            shopName: '', 
            address: '', 
        },
    });
    
    const handleDemoLogin = () => {
        const demoSeller = {
            id: 'seller_demo_01',
            shopName: 'Swadeshi Organic Farm',
            ownerName: 'Sunita Sharma',
            contactNumber: '+91 9876543210',
            email: 'seller@bookeato.com',
            address: 'Plot 42, Green Valley Organic Zone, Nanakramguda, Hyderabad',
            status: 'Verified Partner'
        };
        localStorage.setItem('bookeato_active_seller', JSON.stringify(demoSeller));
        toast({
            title: 'Demo Seller Signed In!',
            description: 'Welcome to Swadeshi Organic Farm seller dashboard.'
        });
        router.push('/seller-dashboard');
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginMobile) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please enter your registered phone number.' });
            return;
        }
        const activeSeller = {
            id: `seller_${loginMobile}`,
            shopName: 'Swadeshi Organic Farm',
            ownerName: 'Sunita Sharma',
            contactNumber: `+91 ${loginMobile}`,
            email: 'seller@bookeato.com',
            status: 'Verified Partner'
        };
        localStorage.setItem('bookeato_active_seller', JSON.stringify(activeSeller));
        toast({
            title: 'Seller Login Successful',
            description: 'Opening your seller dashboard...'
        });
        router.push('/seller-dashboard');
    };

    const addProduct = () => {
        setProducts([...products, { 
            id: Math.random().toString(36).substring(7), 
            name: '', 
            shortDescription: '',
            price: '',
            description: '', 
            imageFile: null, 
            imagePreview: null,
            customizationGroups: []
        }]);
    };

    const addCustomizationGroupToProduct = (productId: string) => {
        setProducts(products.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    customizationGroups: [
                        ...p.customizationGroups,
                        { groupTitle: '', optionsStr: '' }
                    ]
                };
            }
            return p;
        }));
    };

    const updateCustomizationGroup = (productId: string, index: number, field: keyof CustomizationGroupInput, val: string) => {
        setProducts(products.map(p => {
            if (p.id === productId) {
                const updatedGroups = [...p.customizationGroups];
                updatedGroups[index] = { ...updatedGroups[index], [field]: val };
                return { ...p, customizationGroups: updatedGroups };
            }
            return p;
        }));
    };

    const removeCustomizationGroup = (productId: string, index: number) => {
        setProducts(products.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    customizationGroups: p.customizationGroups.filter((_, i) => i !== index)
                };
            }
            return p;
        }));
    };

    const removeProduct = (id: string) => {
        if (products.length === 1) return;
        setProducts(products.filter(p => p.id !== id));
    };

    const updateProduct = (id: string, field: keyof ProductItem, value: any) => {
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setProducts(products.map(p => p.id === id ? { ...p, imageFile: file, imagePreview: previewUrl } : p));
        }
    };

    const removeImage = (id: string) => {
        setProducts(products.map(p => p.id === id ? { ...p, imageFile: null, imagePreview: null } : p));
        if (fileInputRefs.current[id]) {
            fileInputRefs.current[id]!.value = '';
        }
    };

    const validateProducts = () => {
        for (const p of products) {
            if (!p.name.trim()) return "Please provide a name for all products.";
            if (!p.price.trim()) return "Please provide a price for all products.";
            if (!p.description.trim()) return "Please provide a description for all products.";
        }
        return null;
    };

    const onSubmit = async (values: z.infer<typeof sellerSignUpSchema>) => {
        if (!firestore || !auth || !storage) return;

        const productError = validateProducts();
        if (productError) {
            toast({ variant: 'destructive', title: 'Product Details Missing', description: productError });
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInAnonymously(auth);
            const uid = userCredential.user.uid;
            const fullPhone = `+91${values.phoneNumber}`;
            
            // Upload product images and collect final product list
            const finalProducts = await Promise.all(products.map(async (p, index) => {
                let imageUrl = null;
                if (p.imageFile) {
                    const storageRef = ref(storage, `marketplace-products/${uid}/product_${index}_${p.id}`);
                    await uploadBytes(storageRef, p.imageFile);
                    imageUrl = await getDownloadURL(storageRef);
                }
                return {
                    name: p.name,
                    price: p.price,
                    description: p.description,
                    imageUrl: imageUrl
                };
            }));

            const profile = {
                id: uid,
                name: values.name,
                contactNumber: fullPhone,
                status: 'pending',
                joinedDate: new Date().toISOString(),
                createdAt: serverTimestamp(),
                type: 'marketplace_seller',
                shopName: values.shopName,
                address: values.address,
                products: finalProducts,
            };

            await setDoc(doc(firestore, 'marketplace_sellers', uid), profile);

            const activeSeller = {
                id: uid,
                shopName: values.shopName,
                ownerName: values.name,
                contactNumber: fullPhone,
                address: values.address,
                status: 'Verified Partner'
            };
            localStorage.setItem('bookeato_active_seller', JSON.stringify(activeSeller));

            // Publish newly created products to marketplace local storage
            try {
                const existingSellerProductsRaw = localStorage.getItem('bookeato_seller_products');
                const existingSellerProducts = existingSellerProductsRaw ? JSON.parse(existingSellerProductsRaw) : [];
                
                const newFormattedProducts = products.map((p, idx) => ({
                    id: `seller-prod-${uid.substring(0, 4)}-${idx}-${Date.now()}`,
                    name: p.name,
                    shortDescription: p.shortDescription || p.description,
                    price: parseFloat(p.price) || 290,
                    originalPrice: Math.round((parseFloat(p.price) || 290) * 1.15),
                    sellerName: values.shopName,
                    sellerRating: 5.0,
                    rating: 5.0,
                    reviewsCount: 1,
                    image: p.imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop',
                    description: p.description,
                    ingredients: ['Fresh Local Ingredients'],
                    isHealthy: true,
                    unit: '1 Pack',
                    category: 'ghee-oil',
                    inStock: true,
                    badge: 'New Arrival',
                    brandStory: `Locally prepared by ${values.shopName} in ${values.address}.`,
                    customizationGroups: p.customizationGroups.map((cg, gIdx) => ({
                        id: `cg_${gIdx}`,
                        title: cg.groupTitle || 'Customization',
                        type: 'single',
                        options: cg.optionsStr.split(',').map((opt, oIdx) => ({
                            id: `opt_${oIdx}`,
                            label: opt.trim(),
                            priceModifier: 0
                        }))
                    }))
                }));

                localStorage.setItem('bookeato_seller_products', JSON.stringify([...newFormattedProducts, ...existingSellerProducts]));
            } catch (err) {
                console.error("Failed to store seller products locally:", err);
            }

            toast({ 
                title: 'Seller Profile Registered!', 
                description: `Welcome to Bookeato Marketplace, ${values.shopName}! Opening your seller dashboard...` 
            });
            
            router.push('/seller-dashboard');
        } catch (error: any) {
            console.error('Seller profile creation failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-3">
                    <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-full">
                        <Store className="w-9 h-9" />
                    </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900">
                    {mode === 'login' ? 'Marketplace Seller Portal' : 'Become a Seller'}
                </h2>
                <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">
                    {mode === 'login' ? 'Access your shop dashboard & live orders' : 'Reach thousands of food lovers with Bookeato'}
                </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-stone-200/60 p-1.5 rounded-2xl border border-stone-200 shadow-inner">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                        mode === 'login' 
                            ? 'bg-emerald-950 text-white shadow-md' 
                            : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Seller Login
                </button>
                <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                        mode === 'register' 
                            ? 'bg-emerald-950 text-white shadow-md' 
                            : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                    <Store className="w-4 h-4 text-emerald-400" />
                    Register New Seller
                </button>
            </div>

            {/* LOGIN MODE */}
            {mode === 'login' ? (
                <div className="space-y-6">
                    {/* ONE-CLICK DEMO SELLER LOGIN CARD */}
                    <div className="p-6 bg-emerald-950 text-white rounded-3xl border-2 border-emerald-500 shadow-xl space-y-4 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-amber-400 text-stone-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Quick Demo Account
                            </Badge>
                            <span className="text-[10px] text-emerald-300 font-extrabold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Demo
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Swadeshi Organic Farm</h3>
                            <p className="text-xs text-stone-300 font-medium">Demo Seller ID: seller@bookeato.com • Mobile: +91 9876543210</p>
                        </div>
                        <Button
                            type="button"
                            onClick={handleDemoLogin}
                            className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <KeyRound className="w-4 h-4" />
                            ⚡ Login with Demo Seller & View Interface
                        </Button>
                    </div>

                    {/* STANDARD LOGIN FORM */}
                    <form onSubmit={handleLoginSubmit} className="space-y-4 p-6 bg-white rounded-3xl border-4 border-stone-100 shadow-xl shadow-stone-200/50">
                        <h3 className="text-base font-black text-stone-900 border-b-2 border-stone-100 pb-2 mb-4 flex items-center justify-between">
                            <span>Standard Seller Login</span>
                            <Lock className="w-4 h-4 text-stone-400" />
                        </h3>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Registered Mobile / Email</label>
                            <Input 
                                type="text" 
                                placeholder="e.g. 9876543210 or seller@bookeato.com" 
                                value={loginMobile}
                                onChange={(e) => setLoginMobile(e.target.value)}
                                className="h-12 rounded-xl bg-stone-50 border-stone-200 font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Password / Security PIN</label>
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="h-12 rounded-xl bg-stone-50 border-stone-200 font-medium"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-white font-black text-sm active:scale-95 transition-all shadow-md mt-2"
                        >
                            Login to Seller Dashboard
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </form>
                </div>
            ) : (
                /* REGISTER MODE */
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4 p-6 bg-white rounded-3xl border-4 border-stone-100 shadow-xl shadow-stone-200/50">
                            <h3 className="text-lg font-black text-stone-900 border-b-2 border-stone-100 pb-2 mb-4">Personal Details</h3>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-stone-500">Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} className="h-12 rounded-xl bg-stone-50 border-stone-200 font-medium" />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-red-500" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-stone-500">Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10-digit mobile number" {...field} className="h-12 rounded-xl bg-stone-50 border-stone-200 font-medium" />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 p-6 bg-white rounded-3xl border-4 border-stone-100 shadow-xl shadow-stone-200/50">
                            <h3 className="text-lg font-black text-stone-900 border-b-2 border-stone-100 pb-2 mb-4">Business Details</h3>
                            <FormField
                                control={form.control}
                                name="shopName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-stone-500">Shop / Kitchen Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Swadeshi Organic Farm" {...field} className="h-12 rounded-xl bg-stone-50 border-stone-200 font-medium" />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-red-500" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-stone-500">Complete Address</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Building, Street, Area, City, Pincode" {...field} className="min-h-[100px] rounded-xl bg-stone-50 border-stone-200 font-medium resize-none" />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-red-500" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Product Addition Section */}
                        <div className="space-y-6 p-6 bg-white rounded-3xl border-4 border-stone-100 shadow-xl shadow-stone-200/50">
                            <div className="flex justify-between items-center border-b-2 border-stone-100 pb-2">
                                <div>
                                    <h3 className="text-lg font-black text-stone-900">Initial Products to List</h3>
                                    <p className="text-xs text-stone-400 font-medium">Add at least one product you wish to sell.</p>
                                </div>
                            </div>

                            {products.map((product, index) => (
                                <div key={product.id} className="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-4 relative">
                                    {products.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeProduct(product.id)}
                                            className="absolute top-2 right-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 block">Product Name</label>
                                        <Input 
                                            placeholder="e.g., Spicy Mango Pickle" 
                                            value={product.name}
                                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                            className="h-12 rounded-xl bg-white border-stone-200 font-medium" 
                                        />
                                    </div>

                                    {/* Product Short Description (Placed below Product Name and above Price) */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 block">
                                            Product Short Description (Summary tagline)
                                        </label>
                                        <Input 
                                            placeholder="e.g., Authentic Andhra style raw mango pickle with hand-ground spices" 
                                            value={product.shortDescription}
                                            onChange={(e) => updateProduct(product.id, 'shortDescription', e.target.value)}
                                            className="h-11 rounded-xl bg-white border-stone-200 font-medium text-sm" 
                                        />
                                        <p className="text-[10px] text-stone-400 mt-1 font-medium">Displayed right below product name and above price on marketplace cards.</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 block">Product Price (₹)</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-4 font-bold text-stone-400 select-none">₹</span>
                                            <Input 
                                                type="number"
                                                placeholder="e.g., 250" 
                                                value={product.price}
                                                onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                                                className="h-12 pl-10 rounded-xl bg-white border-stone-200 font-medium tracking-wider" 
                                            />
                                        </div>
                                    </div>

                                    {/* Customization Options Builder Section */}
                                    <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Product Customization Options</h4>
                                                <p className="text-[10px] text-stone-400">Add options like Spice Level, Packaging, Size, or Add-ons for buyers to choose.</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addCustomizationGroupToProduct(product.id)}
                                                className="h-8 rounded-lg text-xs font-bold text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option Group
                                            </Button>
                                        </div>

                                        {product.customizationGroups.map((group, gIdx) => (
                                            <div key={gIdx} className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 relative">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCustomizationGroup(product.id, gIdx)}
                                                    className="absolute top-1.5 right-1.5 h-6 w-6 text-stone-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-stone-500">Group Title (e.g. Spice Level)</label>
                                                        <Input 
                                                            placeholder="e.g. Select Spice Level"
                                                            value={group.groupTitle}
                                                            onChange={(e) => updateCustomizationGroup(product.id, gIdx, 'groupTitle', e.target.value)}
                                                            className="h-9 text-xs rounded-lg bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-stone-500">Options (Comma separated)</label>
                                                        <Input 
                                                            placeholder="e.g. Mild (+0), Medium (+0), Extra Spicy (+20)"
                                                            value={group.optionsStr}
                                                            onChange={(e) => updateCustomizationGroup(product.id, gIdx, 'optionsStr', e.target.value)}
                                                            className="h-9 text-xs rounded-lg bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 block">Product Description</label>
                                        <Textarea 
                                            placeholder="Describe the product..." 
                                            value={product.description}
                                            onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                                            className="min-h-[80px] rounded-xl bg-white border-stone-200 font-medium resize-none" 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2 block">Product Image (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={(el) => { fileInputRefs.current[product.id] = el; }}
                                            onChange={(e) => handleImageChange(product.id, e)}
                                        />
                                        {product.imagePreview ? (
                                            <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-stone-200">
                                                <Image src={product.imagePreview} alt="Preview" fill className="object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => removeImage(product.id)}
                                                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[product.id]?.click()}
                                                className="w-full h-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-50 transition-colors text-stone-500 group"
                                            >
                                                <ImagePlus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform text-stone-400" />
                                                <span className="text-sm font-bold">Upload Image</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addProduct}
                            className="w-full h-12 rounded-xl border-2 border-stone-200 border-dashed text-stone-600 hover:bg-stone-50 font-bold gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Another Product
                        </Button>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-blue-200 group"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Application
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </form>
            </Form>
            )}
        </div>
    );
}
