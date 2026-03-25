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
import { Phone, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from "@/components/loading-state";
import { useRouter } from 'next/navigation';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
});

export function MaidSignUpForm() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: '', phoneNumber: '' },
    });

    const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
        if (!firestore || !auth) return;

        setIsLoading(true);
        try {
            // Sign in anonymously to get a valid UID for Firestore permissions
            const userCredential = await signInAnonymously(auth);
            const uid = userCredential.user.uid;
            const fullPhone = `+91${values.phoneNumber}`;
            
            const maidProfile = {
                id: uid,
                name: values.name,
                contactNumber: fullPhone,
                status: 'pending',
                joinedDate: new Date().toISOString(),
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, 'maids', uid), maidProfile);

            toast({ 
                title: 'Application Submitted', 
                description: 'Your profile is under review. Our team will contact you soon.' 
            });
            router.push('/maid/pending');
        } catch (error: any) {
            console.error('Profile creation failed', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <>
      {isLoading && <LoadingState fullPage type="maid" message="Submitting your application..." />}
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    <User className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Join Bookeato</h2>
                <p className="text-sm text-muted-foreground font-medium">Start your journey as a service partner today.</p>
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
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg shadow-xl" disabled={isLoading}>
                        Submit Application <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </Form>

            <div className="pt-8 text-center">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Already a partner?</p>
                <Button variant="link" className="text-stone-900 font-black h-auto p-0 mt-1" onClick={() => router.push('/maid/login')}>
                    Go to Partner Login
                </Button>
            </div>
        </div>
    </>
  );
}
