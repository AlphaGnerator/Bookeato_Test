'use client';

import { useState } from 'react';
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
import { useAuth, useFirestore } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Phone, User, ArrowRight, ChefHat, Sparkles, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from "@/components/loading-state";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: "Please select your gender.",
  }),
});

export function PartnerSignUpForm() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [step, setStep] = useState<1 | 2>(1);
    const [serviceType, setServiceType] = useState<'maid' | 'cook' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', phoneNumber: '', gender: undefined },
    });

    const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
        if (!firestore || !auth || !serviceType) return;

        setIsLoading(true);
        try {
            // Sign in anonymously to get a valid UID for Firestore permissions
            const userCredential = await signInAnonymously(auth);
            const uid = userCredential.user.uid;
            const fullPhone = `+91${values.phoneNumber}`;
            
            const profile = {
                id: uid,
                name: values.name,
                contactNumber: fullPhone,
                status: 'pending',
                joinedDate: new Date().toISOString(),
                createdAt: serverTimestamp(),
                type: serviceType,
                gender: values.gender,
            };

            const collectionName = serviceType === 'maid' ? 'maids' : 'cooks';
            await setDoc(doc(firestore, collectionName, uid), profile);

            toast({ 
                title: 'Application Submitted', 
                description: `Your ${serviceType} profile is under review. Our team will contact you soon.` 
            });
            
            router.push(`/${serviceType}/pending`);
        } catch (error: any) {
            console.error('Profile creation failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="w-full max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-stone-900">Join Bookeato</h2>
                    <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Step 1: Select your service</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <button 
                        onClick={() => setServiceType('maid')}
                        className={cn(
                            "relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all duration-300 group",
                            serviceType === 'maid' 
                                ? "border-stone-900 bg-stone-50 scale-[1.02] shadow-xl shadow-stone-200" 
                                : "border-stone-100 bg-white hover:border-stone-200"
                        )}
                    >
                        <div className="relative w-24 h-24 mb-2">
                            <Image 
                                src="/images/maid_icon.png" 
                                alt="Maid Service" 
                                fill
                                className="object-contain group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-stone-900">Maid</h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Cleaning Professional</p>
                        </div>
                        {serviceType === 'maid' && (
                            <div className="absolute top-4 right-4 bg-stone-900 text-white p-1 rounded-full">
                                <Check className="w-4 h-4" strokeWidth={4} />
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={() => setServiceType('cook')}
                        className={cn(
                            "relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all duration-300 group",
                            serviceType === 'cook' 
                                ? "border-stone-900 bg-stone-50 scale-[1.02] shadow-xl shadow-stone-200" 
                                : "border-stone-100 bg-white hover:border-stone-200"
                        )}
                    >
                        <div className="relative w-24 h-24 mb-2">
                            <Image 
                                src="/images/cook_icon.png" 
                                alt="Cook Service" 
                                fill
                                className="object-contain group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-stone-900">Cook</h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Culinary Professional</p>
                        </div>
                        {serviceType === 'cook' && (
                            <div className="absolute top-4 right-4 bg-stone-900 text-white p-1 rounded-full">
                                <Check className="w-4 h-4" strokeWidth={4} />
                            </div>
                        )}
                    </button>
                </div>

                <Button 
                    disabled={!serviceType}
                    onClick={() => setStep(2)}
                    className="w-full h-16 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xl shadow-xl disabled:opacity-30 transition-all"
                >
                    Continue <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
            </div>
        );
    }

    return (
    <>
      {isLoading && <LoadingState fullPage type={serviceType === 'maid' ? 'maid' : 'cook'} message="Submitting your application..." />}
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    className="text-stone-400 font-bold hover:text-stone-900 mb-4"
                >
                    ← Back to selection
                </Button>
                <div className="mx-auto w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 mb-4">
                    {serviceType === 'maid' ? <Sparkles className="w-8 h-8" /> : <ChefHat className="w-8 h-8" />}
                </div>
                <h2 className="text-3xl font-black tracking-tight">Tell us about you</h2>
                <p className="text-sm text-muted-foreground font-medium">Join as a {serviceType} today.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your full name" className="h-14 rounded-2xl border-2 border-stone-100 font-bold px-5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500">Phone Number</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-4 bg-stone-50 rounded-2xl text-sm font-black border-2 border-stone-100">
                                            +91
                                        </div>
                                        <Input placeholder="10-digit number" className="h-14 rounded-2xl border-2 border-stone-100 font-bold px-5" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-500 text-center block">Gender</FormLabel>
                                <FormControl>
                                    <div className="flex gap-4">
                                        {['Male', 'Female', 'Other'].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => field.onChange(option)}
                                                className={cn(
                                                    "flex-1 h-12 rounded-xl border-2 font-bold transition-all",
                                                    field.value === option 
                                                        ? "border-stone-900 bg-stone-900 text-white" 
                                                        : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                                                )}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg shadow-xl" disabled={isLoading}>
                        Submit Application <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </Form>

            <div className="pt-8 text-center border-t border-stone-50">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Already a partner?</p>
                <Button variant="link" className="text-stone-900 font-black h-auto p-0 mt-1" onClick={() => router.push(`/${serviceType}/login`)}>
                    Go to Partner Login
                </Button>
            </div>
        </div>
    </>
  );
}
