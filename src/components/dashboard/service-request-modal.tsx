'use client';

import React, { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    ChefHat, Sparkles, Heart, Activity, 
    Dumbbell, Calendar, Clock, CheckCircle2, 
    User, ShieldCheck, Zap, ArrowRight, X, AlertCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceId: 'Cook' | 'Maid' | 'Elder Care' | 'Yoga & Wellness' | 'Sports Coach' | string;
}

const SERVICE_CONFIGS: Record<string, {
    title: string;
    subtitle: string;
    icon: any;
    colorBg: string;
    colorText: string;
    basePrice: number;
    options: {
        label: string;
        choices: string[];
    }[];
}> = {
    'Cook': {
        title: 'Book Home Cook',
        subtitle: 'Trained, hygienic culinary experts for fresh home-cooked meals.',
        icon: ChefHat,
        colorBg: 'bg-orange-500',
        colorText: 'text-orange-600',
        basePrice: 349,
        options: [
            { label: 'Meal Type', choices: ['Lunch Only', 'Dinner Only', 'Lunch & Dinner'] },
            { label: 'Family Size', choices: ['1-2 People', '3-4 People', '5+ People'] },
            { label: 'Diet Preference', choices: ['Pure Veg', 'Non-Veg', 'Jain Special'] }
        ]
    },
    'Maid': {
        title: 'Book Maid Service',
        subtitle: 'Verified, reliable house help for spotless home infrastructure.',
        icon: Sparkles,
        colorBg: 'bg-emerald-500',
        colorText: 'text-emerald-600',
        basePrice: 299,
        options: [
            { label: 'Home Configuration', choices: ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'] },
            { label: 'Primary Chores', choices: ['Floor Cleaning', 'Utensils Washing', 'Deep Dusting', 'Full Package'] }
        ]
    },
    'Elder Care': {
        title: 'Book Elder Companion',
        subtitle: 'Warm, certified specialists for compassionate elderly care at home.',
        icon: Heart,
        colorBg: 'bg-rose-500',
        colorText: 'text-rose-600',
        basePrice: 499,
        options: [
            { label: 'Support Duration', choices: ['2 Hours Visit', '4 Hours Half Day', '8 Hours Full Day'] },
            { label: 'Care Focus', choices: ['Companionship & Walks', 'Medication & Meal Help', 'Mobility Assistance'] }
        ]
    },
    'Yoga & Wellness': {
        title: 'Book Personal Yoga Instructor',
        subtitle: 'Tailored 1-on-1 yoga and wellness sessions at your home.',
        icon: Activity,
        colorBg: 'bg-amber-500',
        colorText: 'text-amber-600',
        basePrice: 599,
        options: [
            { label: 'Goal Focus', choices: ['Weight Loss & Flexibility', 'Stress Relief & Meditation', 'Posture & Back Pain'] },
            { label: 'Session Type', choices: ['Single Individual', 'Couple Session', 'Family Group'] }
        ]
    },
    'Sports Coach': {
        title: 'Book Private Sports Coach',
        subtitle: 'Professional training for Badminton, Tennis, Fitness & Swimming.',
        icon: Dumbbell,
        colorBg: 'bg-blue-500',
        colorText: 'text-blue-600',
        basePrice: 699,
        options: [
            { label: 'Sport Selected', choices: ['Badminton', 'Tennis & Squash', 'Fitness & Strength', 'Swimming'] },
            { label: 'Skill Level', choices: ['Beginner', 'Intermediate', 'Advanced Training'] }
        ]
    }
};

const TIME_SLOTS = [
    { id: 'morning_8am', label: '08:00 AM - 10:00 AM', tag: 'Morning' },
    { id: 'afternoon_12pm', label: '12:00 PM - 02:00 PM', tag: 'Afternoon' },
    { id: 'evening_6pm', label: '06:00 PM - 08:00 PM', tag: 'Evening' },
];

export function ServiceRequestModal({ isOpen, onClose, serviceId }: ServiceRequestModalProps) {
    const config = SERVICE_CONFIGS[serviceId] || SERVICE_CONFIGS['Cook'];
    const IconComponent = config.icon;

    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: firebaseUser } = useUser();
    const { user: profileUser } = useCulinaryStore();

    const [bookingType, setBookingType] = useState<'onetime' | 'monthly'>('onetime');
    const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0].id);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        config.options.forEach(opt => {
            initial[opt.label] = opt.choices[0];
        });
        return initial;
    });
    const [specialNotes, setSpecialNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Calculated price
    const calculatedPrice = bookingType === 'monthly' ? config.basePrice * 22 : config.basePrice;

    const handleOptionSelect = (groupLabel: string, choice: string) => {
        setSelectedOptions(prev => ({ ...prev, [groupLabel]: choice }));
    };

    const handleSubmitRequest = async () => {
        setIsSubmitting(true);
        try {
            const bookingPayload = {
                serviceType: serviceId,
                bookingType,
                bookingDate: selectedDate,
                timeSlot: selectedSlot,
                slotLabel: TIME_SLOTS.find(s => s.id === selectedSlot)?.label || '08:00 AM',
                selectedOptions,
                specialNotes,
                status: 'confirmed', // Confirmed booking
                amount: calculatedPrice,
                otp: Math.floor(1000 + Math.random() * 9000).toString(),
                createdAt: new Date().toISOString(),
                customerId: firebaseUser?.uid || 'guest-user',
                customerName: profileUser.name || 'Demo Customer',
                address: profileUser.address || 'My Home Vihanga, Nanakramguda'
            };

            // Save to Firestore if connected
            if (firestore && firebaseUser?.uid) {
                await addDoc(collection(firestore, 'customers', firebaseUser.uid, 'bookings'), {
                    ...bookingPayload,
                    timestamp: serverTimestamp()
                });
            }

            // Save to local storage for immediate UI reactivity
            const existing = JSON.parse(localStorage.getItem('bookeato_user_custom_bookings') || '[]');
            existing.unshift({ id: `bk-${Date.now()}`, ...bookingPayload });
            localStorage.setItem('bookeato_user_custom_bookings', JSON.stringify(existing));

            // Notify custom listener for page update
            window.dispatchEvent(new Event('bookeato_bookings_updated'));

            toast({
                title: "Service Request Confirmed! 🎉",
                description: `Your ${serviceId} request for ${format(new Date(selectedDate), 'MMM d')} is placed. OTP: ${bookingPayload.otp}`,
            });

            onClose();
        } catch (error) {
            console.error("Failed to submit service request", error);
            toast({
                variant: 'destructive',
                title: "Submission Error",
                description: "Failed to place request. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden bg-white border-none shadow-2xl">
                
                {/* Modal Banner Header */}
                <div className={`${config.colorBg} text-white p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
                            <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                            <Badge className="bg-white/20 text-white font-bold text-[9px] uppercase tracking-widest border-none px-2 py-0.5 mb-1">
                                Instant Dashboard Booking
                            </Badge>
                            <DialogTitle className="text-xl font-black tracking-tight text-white">{config.title}</DialogTitle>
                        </div>
                    </div>
                    <p className="text-xs text-white/90 font-medium mt-2 leading-relaxed">{config.subtitle}</p>
                </div>

                {/* Form Body */}
                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                    
                    {/* 1. Plan Type Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Service Frequency</label>
                        <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setBookingType('onetime')}
                                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                                    bookingType === 'onetime' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                                }`}
                            >
                                Single Visit
                            </button>
                            <button
                                type="button"
                                onClick={() => setBookingType('monthly')}
                                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                                    bookingType === 'monthly' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                                }`}
                            >
                                Monthly Plan (Save 20%)
                            </button>
                        </div>
                    </div>

                    {/* 2. Date Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Select Date</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((daysToAdd) => {
                                const d = addDays(new Date(), daysToAdd);
                                const dStr = format(d, 'yyyy-MM-dd');
                                const isSelected = selectedDate === dStr;
                                return (
                                    <button
                                        key={dStr}
                                        type="button"
                                        onClick={() => setSelectedDate(dStr)}
                                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                                            isSelected 
                                                ? 'bg-stone-950 text-white border-stone-950 shadow-md font-extrabold' 
                                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 font-semibold'
                                        }`}
                                    >
                                        <p className="text-[10px] uppercase font-bold text-stone-400">{format(d, 'EEE')}</p>
                                        <p className="text-sm font-black">{format(d, 'MMM d')}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Preferred Time Slot */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Preferred Time Slot</label>
                        <div className="space-y-2">
                            {TIME_SLOTS.map((slot) => {
                                const isSelected = selectedSlot === slot.id;
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => setSelectedSlot(slot.id)}
                                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                            isSelected 
                                                ? 'bg-stone-950 text-white border-stone-950 font-bold shadow-md' 
                                                : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                                            <span className="text-xs font-bold">{slot.label}</span>
                                        </div>
                                        <Badge className={`${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'} text-[9px] border-none font-bold`}>
                                            {slot.tag}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Service Config Options */}
                    {config.options.map((optGroup) => (
                        <div key={optGroup.label} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">{optGroup.label}</label>
                            <div className="flex flex-wrap gap-2">
                                {optGroup.choices.map((choice) => {
                                    const isSelected = selectedOptions[optGroup.label] === choice;
                                    return (
                                        <button
                                            key={choice}
                                            type="button"
                                            onClick={() => handleOptionSelect(optGroup.label, choice)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                isSelected 
                                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-500 shadow-sm' 
                                                    : 'bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100'
                                            }`}
                                        >
                                            {choice}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* 5. Special Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Special Instructions / Preferences</label>
                        <Textarea 
                            placeholder="Add specific instructions for partner (e.g. less oil, entrance gate code, specific room focus...)"
                            value={specialNotes}
                            onChange={(e) => setSpecialNotes(e.target.value)}
                            className="rounded-2xl border-stone-200 text-xs font-medium focus-visible:ring-emerald-500 min-h-[70px]"
                        />
                    </div>

                    {/* Pricing Breakdown & Submit CTA */}
                    <div className="pt-2 space-y-3">
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Estimated Total</p>
                                <p className="text-xl font-black text-stone-950">₹{calculatedPrice}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 font-bold border-none text-[10px]">
                                No Hidden Charges
                            </Badge>
                        </div>

                        <Button 
                            onClick={handleSubmitRequest}
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-2xl bg-stone-950 hover:bg-emerald-600 text-white font-black text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Confirming Booking...' : `Confirm & Place Request • ₹${calculatedPrice}`}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
