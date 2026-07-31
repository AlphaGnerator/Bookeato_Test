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
import { Store, Loader2, ArrowRight, Plus, Trash2, ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const sellerSignUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  shopName: z.string().min(2, 'Shop/Business Name must be at least 2 characters.'),
  address: z.string().min(10, 'Please enter a complete business address.'),
});

type ProductItem = {
    id: string;
    name: string;
    price: string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
};

export function SellerSignUpForm() {
    const { auth, firestore, storage } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [products, setProducts] = useState<ProductItem[]>([
        { id: '1', name: '', price: '', description: '', imageFile: null, imagePreview: null }
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

    const addProduct = () => {
        setProducts([...products, { 
            id: Math.random().toString(36).substring(7), 
            name: '', 
            price: '',
            description: '', 
            imageFile: null, 
            imagePreview: null 
        }]);
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

            toast({ 
                title: 'Application Submitted', 
                description: `Your seller profile for ${values.shopName} is under review. Our team will contact you soon.` 
            });
            
            router.push('/partner-signup/pending');
        } catch (error: any) {
            console.error('Seller profile creation failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                        <Store className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-stone-900">Become a Seller</h2>
                <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Reach more customers with Bookeato</p>
            </div>

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
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 font-bold text-stone-400 select-none">+91</div>
                                            <Input placeholder="9876543210" {...field} maxLength={10} className="h-12 pl-12 rounded-xl bg-stone-50 border-stone-200 font-medium tracking-wider" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold text-red-500" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4 p-6 bg-white rounded-3xl border-4 border-blue-100 shadow-xl shadow-blue-200/20">
                        <h3 className="text-lg font-black text-blue-900 border-b-2 border-blue-100 pb-2 mb-4">Business Details</h3>
                        <FormField
                            control={form.control}
                            name="shopName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-blue-500">Shop / Business Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Doe's Homemade Spices" {...field} className="h-12 rounded-xl bg-blue-50/50 border-blue-100 font-medium" />
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
                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-blue-500">Business Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Full address of your shop or home kitchen" {...field} className="min-h-[80px] rounded-xl bg-blue-50/50 border-blue-100 font-medium resize-none" />
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold text-red-500" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4 p-6 bg-white rounded-3xl border-4 border-stone-100 shadow-xl shadow-stone-200/50">
                        <div className="flex items-center justify-between border-b-2 border-stone-100 pb-2 mb-4">
                            <h3 className="text-lg font-black text-stone-900">Products</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {products.map((product, index) => (
                                <div key={product.id} className="p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 relative">
                                    {products.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeProduct(product.id)}
                                            className="absolute top-2 right-2 h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 block">Product Name</label>
                                            <Input 
                                                placeholder="e.g., Spicy Mango Pickle" 
                                                value={product.name}
                                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                                className="h-12 rounded-xl bg-white border-stone-200 font-medium" 
                                            />
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
                    </div>

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
        </div>
    );
}
