'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import Image from 'next/image';
import { 
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoginForm } from '@/app/login/login-form';
import { SignUpForm } from '@/app/signup/signup-form';
import { useToast } from '@/hooks/use-toast';
import { cn, getLocationFromPincode } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { 
    ArrowLeft, ShoppingBag, MapPin, Phone, User as UserIcon, 
    Clock, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, 
    Tag, Plus, Minus, Trash2, ShieldCheck, ChevronRight, 
    CreditCard, Wallet, QrCode, Banknote, Sparkles, 
    Truck, Receipt, Lock, Loader2, Edit2, MessageSquare, Check
} from 'lucide-react';

// Available Vouchers Data
const AVAILABLE_VOUCHERS = [
    { code: 'WELCOME50', discount: 50, minOrder: 200, type: 'flat', description: 'Flat ₹50 OFF on your first booking' },
    { code: 'BOOKEATO20', discount: 20, minOrder: 300, maxDiscount: 100, type: 'percent', description: '20% OFF up to ₹100' },
    { code: 'FREEDEL', discount: 40, minOrder: 250, type: 'delivery', description: 'Free Delivery on orders above ₹250' }
];

export default function CheckoutPage() {
    const { 
        draftBookings, 
        removeDraftBooking, 
        addOrUpdateDraftBooking, 
        marketplaceCart, 
        updateMarketplaceQuantity, 
        removeFromMarketplaceCart, 
        dishes, 
        guestConfig, 
        user: appUser, 
        updateUserProfile,
        executeUnifiedCheckout,
        checkBalance
    } = useCulinaryStore();

    const { user: firebaseUser } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    // States
    const [voucherInput, setVoucherInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number; description: string } | null>(null);
    const [voucherError, setVoucherError] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    
    // Address Edit Mode state for logged-in user
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [customerName, setCustomerName] = useState(appUser.name || '');
    const [phone, setPhone] = useState(appUser.contactNumber ? appUser.contactNumber.replace('+91', '') : '');
    const activePincode = appUser.pincode || guestConfig?.pincode || '560001';
    const [pincode, setPincode] = useState(activePincode);
    const initialLocation = useMemo(() => getLocationFromPincode(activePincode), [activePincode]);
    const [city, setCity] = useState(guestConfig?.city || initialLocation.city || 'Bengaluru');
    const [state, setState] = useState(guestConfig?.state || initialLocation.state || 'Karnataka');
    const [address, setAddress] = useState(appUser.address || guestConfig?.address || '');

    // Payment Window Dialog state
    const [isPaymentWindowOpen, setIsPaymentWindowOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>('upi');
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (appUser.name && !customerName) setCustomerName(appUser.name);
        if (appUser.contactNumber && !phone) setPhone(appUser.contactNumber.replace('+91', ''));
        if (appUser.address && !address) setAddress(appUser.address);
        if (appUser.pincode && !pincode) setPincode(appUser.pincode);
    }, [appUser]);

    // Service Cart Items & Marketplace Items
    const serviceDraft = draftBookings?.[0];
    const marketplaceItems = marketplaceCart || [];

    const hasServices = !!serviceDraft && serviceDraft.items.length > 0;
    const hasMarketplace = marketplaceItems.length > 0;
    const isCartEmpty = !hasServices && !hasMarketplace;

    // Service Items subtotal calculation
    const serviceSubtotal = useMemo(() => {
        if (!hasServices || !dishes) return 0;
        return serviceDraft.items.reduce((total, item) => {
            const dish = dishes.find(d => d.id === item.dishId);
            const price = (dish as any)?.price || 149;
            return total + (price * item.numberOfPortions);
        }, 0);
    }, [serviceDraft, dishes, hasServices]);

    // Marketplace Items subtotal calculation
    const marketplaceSubtotal = useMemo(() => {
        return marketplaceItems.reduce((acc, item) => {
            const extraModifiers = item.selectedCustomizations?.reduce((sum, c) => sum + (c.priceModifier || 0), 0) || 0;
            return acc + ((item.product.price + extraModifiers) * item.quantity);
        }, 0);
    }, [marketplaceItems]);

    // Subtotal
    const itemsSubtotal = serviceSubtotal + marketplaceSubtotal;

    // Base Delivery Charge & Handling Fee
    const baseDeliveryCharge = itemsSubtotal >= 500 ? 0 : 40;
    const handlingCharge = itemsSubtotal > 0 ? 15 : 0;

    // Apply Voucher Calculation
    const voucherDiscountAmount = useMemo(() => {
        if (!appliedVoucher) return 0;
        return appliedVoucher.discountAmount;
    }, [appliedVoucher]);

    const deliveryCharge = (appliedVoucher?.code === 'FREEDEL') ? 0 : baseDeliveryCharge;

    // GST Calculation (5% of Subtotal after discount)
    const taxableAmount = Math.max(0, itemsSubtotal - voucherDiscountAmount);
    const gstAmount = Math.round(taxableAmount * 0.05);

    // Final Total Amount to be Paid
    const grandTotal = Math.max(0, itemsSubtotal + deliveryCharge + handlingCharge + gstAmount - voucherDiscountAmount);

    // Estimated Delivery Date & Slot
    const estimatedDeliveryDate = useMemo(() => {
        if (serviceDraft?.bookingDate) {
            return format(new Date(serviceDraft.bookingDate), 'PPP • p');
        }
        return format(addDays(new Date(), 1), 'EEE, MMM d') + ' • 10:00 AM - 12:00 PM';
    }, [serviceDraft]);

    // Apply Voucher Handler
    const handleApplyVoucher = (codeToApply?: string) => {
        const code = (codeToApply || voucherInput).trim().toUpperCase();
        setVoucherError('');

        if (!code) {
            setVoucherError('Please enter a voucher code');
            return;
        }

        const voucher = AVAILABLE_VOUCHERS.find(v => v.code === code);
        if (!voucher) {
            setVoucherError('Invalid voucher code');
            return;
        }

        if (itemsSubtotal < voucher.minOrder) {
            setVoucherError(`Minimum order amount for ${code} is ₹${voucher.minOrder}`);
            return;
        }

        let calculatedDiscount = 0;
        if (voucher.type === 'flat') {
            calculatedDiscount = voucher.discount;
        } else if (voucher.type === 'percent') {
            calculatedDiscount = Math.min(Math.round((itemsSubtotal * voucher.discount) / 100), voucher.maxDiscount || 100);
        } else if (voucher.type === 'delivery') {
            calculatedDiscount = baseDeliveryCharge;
        }

        setAppliedVoucher({
            code: voucher.code,
            discountAmount: calculatedDiscount,
            description: voucher.description
        });
        setVoucherInput(voucher.code);
        toast({
            title: "Voucher Applied! 🎉",
            description: `You saved ₹${calculatedDiscount} with coupon ${voucher.code}.`
        });
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherInput('');
        setVoucherError('');
        toast({
            title: "Voucher Removed",
            description: "Coupon code has been unapplied."
        });
    };

    // Item Quantity Edit Handlers
    const handleServicePortionChange = (dishId: string, delta: number) => {
        if (!serviceDraft) return;
        const updatedItems = serviceDraft.items.map(item => {
            if (item.dishId === dishId) {
                return { ...item, numberOfPortions: Math.max(0, item.numberOfPortions + delta) };
            }
            return item;
        }).filter(item => item.numberOfPortions > 0);

        if (updatedItems.length === 0) {
            removeDraftBooking(serviceDraft.bookingDate);
        } else {
            addOrUpdateDraftBooking({ ...serviceDraft, items: updatedItems });
        }
    };

    // Step 1 -> Open Payment Window Modal
    const handleProceedToPaymentWindow = () => {
        if (!address || address.trim().length < 5) {
            toast({
                variant: "destructive",
                title: "Delivery Address Required",
                description: "Please enter your delivery address to continue."
            });
            setIsEditingAddress(true);
            return;
        }

        if (!firebaseUser) {
            setIsAuthDialogOpen(true);
            return;
        }

        // Open Payment Window Modal
        setIsPaymentWindowOpen(true);
    };

    // Step 2 -> Final Payment & Order Placement Submission
    const handleFinalizePayment = async () => {
        if (paymentMethod === 'wallet') {
            const hasEnough = checkBalance(grandTotal);
            if (!hasEnough) {
                router.push(`/wallet?redirect=/checkout&requiredAmount=${grandTotal - (appUser.walletBalance || 0)}`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            try {
                // Save address and contact info to user profile
                updateUserProfile({
                    name: customerName,
                    address: address,
                    pincode: pincode,
                    contactNumber: "+91" + phone
                });
            } catch (e) {
                console.error("Profile update optional skip:", e);
            }

            const checkoutPayload = {
                type: 'unified_order',
                cost: grandTotal,
                configuration: {
                    address,
                    pincode,
                    city,
                    paymentMethod,
                    appliedVoucher: appliedVoucher?.code || null,
                    notes: deliveryNotes
                },
                startDate: new Date()
            };

            await executeUnifiedCheckout(checkoutPayload, 0);
            setIsPaymentWindowOpen(false);
            toast({
                title: "Order Placed Successfully! 🚀",
                description: `Estimated Delivery: ${estimatedDeliveryDate}`
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Checkout submission failed:", error);
            toast({
                variant: "destructive",
                title: "Order Placement Failed",
                description: error.message || "An error occurred while confirming your order."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCartEmpty) {
        return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
                    <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">Your Cart is Empty</h2>
                    <p className="text-muted-foreground text-sm">You have no active services or products in your cart.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button onClick={() => router.push('/booking/menu')} className="bg-orange-500 hover:bg-orange-600 font-bold rounded-2xl h-12">
                        Book a Home Cook
                    </Button>
                    <Button onClick={() => router.push('/marketplace')} variant="outline" className="font-bold rounded-2xl h-12">
                        Explore Marketplace
                    </Button>
                </div>
            </div>
        );
    }

    const isLoggedIn = !!firebaseUser;

    return (
        <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
            <div className="min-h-screen bg-stone-50/50 pb-36">
                {/* Navbar */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 py-3.5 px-4 sm:px-8">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.back()}
                                className="rounded-xl hover:bg-stone-100 font-bold text-stone-600"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Logo className="scale-75 origin-left" />
                        </div>
                        <Badge variant="outline" className="font-extrabold text-orange-600 bg-orange-50 border-orange-200 px-3 py-1 rounded-full text-xs">
                            <Lock className="w-3 h-3 mr-1" /> 100% Secure Checkout
                        </Badge>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-6">
                    
                    {/* Header: Title */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">Order Summary</h1>
                        <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-0.5">
                            Review your items, delivery details, and coupon discounts before payment.
                        </p>
                    </div>

                    {/* 1. Customer Delivery Address & Estimated Arrival Header */}
                    <Card className="rounded-3xl border-stone-200/60 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-stone-50/60 border-b border-stone-100 py-3.5 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-black text-stone-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-500" /> Delivery Address & Estimated Arrival
                            </CardTitle>
                            {isLoggedIn && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                                    className="text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl"
                                >
                                    {isEditingAddress ? 'Done' : 'Change Address'}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Logged in display view vs editing view */}
                            {isLoggedIn && !isEditingAddress ? (
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-stone-900 text-base">{customerName || 'Customer'}</h3>
                                            {phone && (
                                                <Badge variant="secondary" className="font-bold text-xs bg-stone-100 text-stone-600">
                                                    +91 {phone}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-stone-700 leading-relaxed max-w-xl">
                                            {address || 'No address saved. Click Change Address to add.'}
                                        </p>
                                        <p className="text-xs font-bold text-stone-400">
                                            {city}, {state} • {pincode}
                                        </p>
                                    </div>

                                    {/* Estimated Arrival Badge */}
                                    <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-4 shrink-0 sm:text-right flex sm:flex-col justify-between items-center sm:items-end gap-2">
                                        <div>
                                            <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Estimated Arrival</p>
                                            <p className="text-sm font-black text-orange-950 flex items-center gap-1.5 mt-0.5">
                                                <Clock className="w-4 h-4 text-orange-600" /> {estimatedDeliveryDate}
                                            </p>
                                        </div>
                                        <Badge className="bg-orange-500 font-extrabold text-[10px]">On Schedule</Badge>
                                    </div>
                                </div>
                            ) : (
                                /* Address Input Form (Shown when editing or not logged in) */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">Full Name</Label>
                                            <Input 
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="h-10 rounded-xl font-semibold border-stone-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">Phone Number (+91)</Label>
                                            <Input 
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                maxLength={10}
                                                placeholder="99999 99999"
                                                className="h-10 rounded-xl font-semibold border-stone-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-stone-600">Delivery Address (House/Flat No, Society/Building, Landmark)</Label>
                                        <Textarea 
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Flat 402, Tower B, My Home Society..."
                                            className="rounded-xl min-h-[80px] font-semibold border-stone-200"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">Pincode</Label>
                                            <Input 
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value)}
                                                maxLength={6}
                                                className="h-10 rounded-xl font-bold border-stone-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">City</Label>
                                            <Input 
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="h-10 rounded-xl font-semibold border-stone-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">State</Label>
                                            <Input 
                                                value={state}
                                                readOnly
                                                disabled
                                                className="h-10 rounded-xl font-semibold bg-stone-100 border-stone-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Review & Edit Order Section */}
                    <Card className="rounded-3xl border-stone-200/60 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-stone-50/60 border-b border-stone-100 py-3.5 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-black text-stone-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-orange-500" /> Review & Edit Order
                            </CardTitle>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(hasServices ? '/booking/menu' : '/marketplace')}
                                className="rounded-xl text-xs font-extrabold text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Add More Items
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Service items */}
                            {hasServices && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                        <span className="text-xs font-black text-stone-400 uppercase tracking-widest">
                                            Culinary Service ({serviceDraft.mealType})
                                        </span>
                                        <span className="text-xs font-bold text-stone-500">
                                            {format(new Date(serviceDraft.bookingDate), 'EEE, MMM d')}
                                        </span>
                                    </div>

                                    {serviceDraft.items.map((item) => {
                                        const dish = dishes.find(d => d.id === item.dishId);
                                        const unitPrice = (dish as any)?.price || 149;
                                        return (
                                            <div key={item.dishId} className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-orange-100/80 flex items-center justify-center font-black text-orange-600 text-base">
                                                        🍳
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-stone-900 text-sm">{item.dishName}</h4>
                                                        <p className="text-xs text-stone-400">₹{unitPrice} per portion</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-stone-200 shadow-sm">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 rounded-lg"
                                                            onClick={() => handleServicePortionChange(item.dishId, -1)}
                                                        >
                                                            <Minus className="w-3 h-3 text-stone-600" />
                                                        </Button>
                                                        <span className="w-4 text-center font-bold text-sm">{item.numberOfPortions}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 rounded-lg"
                                                            onClick={() => handleServicePortionChange(item.dishId, 1)}
                                                        >
                                                            <Plus className="w-3 h-3 text-stone-600" />
                                                        </Button>
                                                    </div>
                                                    <span className="font-bold text-stone-900 text-sm w-14 text-right">
                                                        ₹{unitPrice * item.numberOfPortions}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {hasServices && hasMarketplace && <Separator className="my-4" />}

                            {/* Marketplace items */}
                            {hasMarketplace && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                        <span className="text-xs font-black text-stone-400 uppercase tracking-widest">
                                            Marketplace Products ({marketplaceItems.length})
                                        </span>
                                    </div>

                                    {marketplaceItems.map((item) => (
                                        <div key={item.product.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-stone-100 relative overflow-hidden shrink-0">
                                                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-900 text-sm">{item.product.name}</h4>
                                                    {item.product.shortDescription && (
                                                        <p className="text-xs text-stone-500 font-medium line-clamp-1">{item.product.shortDescription}</p>
                                                    )}
                                                    <p className="text-[11px] text-stone-400 font-bold">₹{item.product.price} / {item.product.unit}</p>
                                                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.selectedCustomizations.map((cust, cIdx) => (
                                                                <Badge key={cIdx} variant="secondary" className="bg-emerald-50 text-emerald-800 text-[9px] font-bold border-emerald-100">
                                                                    {cust.optionLabel}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-stone-200 shadow-sm">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 rounded-lg"
                                                        onClick={() => updateMarketplaceQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="w-3 h-3 text-stone-600" />
                                                    </Button>
                                                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 rounded-lg"
                                                        onClick={() => updateMarketplaceQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="w-3 h-3 text-stone-600" />
                                                    </Button>
                                                </div>
                                                {(() => {
                                                    const customModifiers = item.selectedCustomizations?.reduce((sum, c) => sum + (c.priceModifier || 0), 0) || 0;
                                                    const itemTotal = (item.product.price + customModifiers) * item.quantity;
                                                    return (
                                                        <span className="font-bold text-stone-900 text-sm w-14 text-right">
                                                            ₹{itemTotal}
                                                        </span>
                                                    );
                                                })()}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => removeFromMarketplaceCart(item.product.id)}
                                                    className="text-stone-300 hover:text-red-500 h-8 w-8"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. Delivery Instructions (Placed right below review order section) */}
                            <div className="pt-4 border-t border-stone-100 space-y-2">
                                <Label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-orange-500" /> Delivery Instructions & Cooking Notes
                                </Label>
                                <Input 
                                    value={deliveryNotes}
                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                    placeholder="e.g. Leave with security guard, call before arrival, medium spicy..."
                                    className="h-11 rounded-xl text-sm font-medium border-stone-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Voucher / Coupon Section */}
                    <Card className="rounded-3xl border-stone-200/60 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-stone-50/60 border-b border-stone-100 py-3.5 px-6">
                            <CardTitle className="text-base font-black text-stone-900 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-orange-500" /> Apply Voucher / Coupon
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {appliedVoucher ? (
                                <div className="p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-green-900 text-sm">{appliedVoucher.code}</span>
                                                <Badge className="bg-green-600 text-[10px]">Applied</Badge>
                                            </div>
                                            <p className="text-xs text-green-700 mt-0.5">Saving ₹{appliedVoucher.discountAmount} on this order</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleRemoveVoucher} className="text-stone-400 hover:text-red-500 font-bold text-xs">
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input 
                                            value={voucherInput}
                                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                            placeholder="Enter Voucher Code (e.g. WELCOME50)"
                                            className="rounded-xl font-bold uppercase border-stone-200"
                                        />
                                        <Button 
                                            onClick={() => handleApplyVoucher()}
                                            className="bg-stone-950 hover:bg-orange-600 text-white font-bold rounded-xl px-5"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    {voucherError && (
                                        <p className="text-xs font-bold text-red-500 pl-1">{voucherError}</p>
                                    )}
                                </div>
                            )}

                            {/* Available Coupons */}
                            <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Available Coupons</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {AVAILABLE_VOUCHERS.map(v => (
                                        <div key={v.code} className="p-3 rounded-2xl border border-dashed border-stone-200 flex flex-col justify-between bg-stone-50/50 space-y-2">
                                            <div>
                                                <span className="font-black text-xs text-stone-900">{v.code}</span>
                                                <p className="text-[11px] text-stone-500 leading-tight mt-0.5">{v.description}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleApplyVoucher(v.code)}
                                                className="text-orange-600 hover:bg-orange-50 font-bold text-xs self-start h-7 px-2"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Order Summary Breakdown */}
                    <Card className="rounded-3xl border-stone-200/60 shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-stone-950 text-white py-5 px-6">
                            <CardTitle className="text-xl font-black flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-orange-400" /> Amount Breakdown
                                </span>
                                <Badge className="bg-orange-500 font-bold text-xs">
                                    {hasServices ? 'Service + Items' : 'Marketplace Order'}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3 text-sm">
                            <div className="flex justify-between items-center text-stone-600">
                                <span>Items Subtotal</span>
                                <span className="font-bold text-stone-900">₹{itemsSubtotal.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-stone-600">
                                <span>Delivery Charge</span>
                                <span className="font-bold text-stone-900">
                                    {deliveryCharge === 0 ? <span className="text-green-600 font-black">FREE</span> : `₹${deliveryCharge}`}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-stone-600">
                                <span>Handling & Platform Fee</span>
                                <span className="font-bold text-stone-900">₹{handlingCharge}</span>
                            </div>

                            <div className="flex justify-between items-center text-stone-600">
                                <span>GST & Govt Taxes (5%)</span>
                                <span className="font-bold text-stone-900">₹{gstAmount}</span>
                            </div>

                            {appliedVoucher && (
                                <div className="flex justify-between items-center text-green-700 bg-green-50 p-3 rounded-xl font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="w-4 h-4" /> Voucher ({appliedVoucher.code})
                                    </span>
                                    <span>-₹{appliedVoucher.discountAmount}</span>
                                </div>
                            )}

                            <Separator className="my-3 opacity-60" />

                            <div className="flex justify-between items-baseline pt-1">
                                <div>
                                    <p className="text-base font-black text-stone-950">Amount to be Paid</p>
                                    <p className="text-[10px] text-stone-400 font-bold">Includes all taxes & delivery fees</p>
                                </div>
                                <span className="text-3xl font-black text-orange-600">₹{grandTotal.toLocaleString()}</span>
                            </div>
                        </CardContent>

                        {/* Main Step 1 Action Button */}
                        <CardFooter className="p-6 bg-stone-50 border-t border-stone-100">
                            <Button 
                                size="lg" 
                                onClick={handleProceedToPaymentWindow}
                                disabled={isCartEmpty}
                                className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-6 h-6" /> Confirm Order & Proceed to Payment (₹{grandTotal.toLocaleString()})
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Guarantee Badge */}
                    <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200/60 flex items-start gap-3 text-stone-600 text-xs">
                        <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-stone-900">Bookeato Satisfaction Guarantee</p>
                            <p className="mt-0.5 leading-relaxed text-stone-500">
                                Certified home cooks & verified vendors. Free cancellation up to 2 hours before scheduled slot.
                            </p>
                        </div>
                    </div>

                </main>

                {/* Fixed Mobile Bottom Action Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-stone-100 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
                    <div className="max-w-xl mx-auto flex justify-between items-center gap-4">
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Grand Total</p>
                            <p className="text-2xl font-black text-orange-600">₹{grandTotal.toLocaleString()}</p>
                        </div>
                        <Button 
                            size="lg"
                            onClick={handleProceedToPaymentWindow}
                            disabled={isCartEmpty}
                            className="h-13 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                        >
                            Proceed to Payment
                        </Button>
                    </div>
                </div>

                {/* --- Step 2: PAYMENT WINDOW MODAL --- */}
                <Dialog open={isPaymentWindowOpen} onOpenChange={setIsPaymentWindowOpen}>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-stone-950 text-white p-6 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-orange-500 text-white font-black text-[10px] uppercase mb-1">
                                        Step 2: Select Payment
                                    </Badge>
                                    <DialogTitle className="text-2xl font-black text-white">Complete Payment</DialogTitle>
                                    <DialogDescription className="text-stone-400 text-xs mt-1">
                                        Delivering to: <span className="text-white font-semibold">{address.slice(0, 35)}...</span>
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-stone-400 uppercase">Amount Due</p>
                                    <p className="text-2xl font-black text-orange-400">₹{grandTotal.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 bg-white">
                            <Tabs defaultValue="upi" value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)} className="w-full">
                                <TabsList className="grid grid-cols-5 w-full bg-stone-100 p-1 rounded-2xl h-14">
                                    <TabsTrigger value="upi" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        UPI
                                    </TabsTrigger>
                                    <TabsTrigger value="card" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Card
                                    </TabsTrigger>
                                    <TabsTrigger value="netbanking" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Netbank
                                    </TabsTrigger>
                                    <TabsTrigger value="wallet" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Wallet
                                    </TabsTrigger>
                                    <TabsTrigger value="cod" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Pay Later
                                    </TabsTrigger>
                                </TabsList>

                                {/* UPI Tab */}
                                <TabsContent value="upi" className="pt-4 space-y-4">
                                    <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <QrCode className="w-7 h-7 text-orange-600" />
                                            <div>
                                                <h4 className="font-bold text-stone-900 text-sm">Instant UPI Payment</h4>
                                                <p className="text-xs text-stone-500">GPay, PhonePe, Paytm, BHIM</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-orange-500 font-bold text-[10px]">Recommended</Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-stone-600">Enter UPI ID (VPA)</Label>
                                        <Input placeholder="username@upi or 9999999999@paytm" className="h-11 rounded-xl border-stone-200" />
                                    </div>
                                </TabsContent>

                                {/* Card Tab */}
                                <TabsContent value="card" className="pt-4 space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-stone-600">Card Number</Label>
                                        <Input placeholder="4532 •••• •••• 8921" className="h-11 rounded-xl border-stone-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">Expiry Date</Label>
                                            <Input placeholder="MM / YY" className="h-11 rounded-xl border-stone-200" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-stone-600">CVV</Label>
                                            <Input placeholder="123" maxLength={4} type="password" className="h-11 rounded-xl border-stone-200" />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Netbanking Tab */}
                                <TabsContent value="netbanking" className="pt-4 space-y-3">
                                    <Label className="text-xs font-bold text-stone-600">Select Bank</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map(bank => (
                                            <Button key={bank} variant="outline" className="h-11 rounded-xl font-bold text-xs border-stone-200 hover:border-orange-500 hover:bg-orange-50">
                                                {bank}
                                            </Button>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Wallet Tab */}
                                <TabsContent value="wallet" className="pt-4 space-y-3">
                                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="w-6 h-6 text-orange-500" />
                                            <div>
                                                <h4 className="font-bold text-stone-900 text-sm">Bookeato Wallet</h4>
                                                <p className="text-xs text-stone-500">Balance: ₹{(appUser.walletBalance || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {(appUser.walletBalance || 0) < grandTotal ? (
                                            <Badge variant="destructive" className="font-bold">Insufficient</Badge>
                                        ) : (
                                            <Badge className="bg-green-600 font-bold">Sufficient</Badge>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Pay Later / COD Tab */}
                                <TabsContent value="cod" className="pt-4">
                                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center gap-3">
                                        <Banknote className="w-6 h-6 text-amber-700 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-amber-900 text-sm">Pay After Service / Delivery</h4>
                                            <p className="text-xs text-amber-800/80">Pay via cash or UPI scan after delivery / session.</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button 
                                size="lg" 
                                onClick={handleFinalizePayment}
                                disabled={isSubmitting}
                                className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                <Lock className="w-5 h-5" /> Pay ₹{grandTotal.toLocaleString()} & Complete Booking
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Authentication Dialog */}
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Login to Place Order</DialogTitle>
                        <DialogDescription>
                            Please login or sign up to finalize your checkout details.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="login" className="w-full mt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login" className="pt-4">
                            <LoginForm onSuccess={() => setIsAuthDialogOpen(false)} />
                        </TabsContent>
                        <TabsContent value="signup" className="pt-4">
                            <SignUpForm onSuccess={() => setIsAuthDialogOpen(false)} />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </div>
        </Dialog>
    );
}
