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
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from "@/components/loading-state";
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter your 10-digit phone number.'),
});

export function MaidLoginForm() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { phoneNumber: '' },
    });

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        if (!firestore) return;

        setIsLoading(true);
        setError(null);
        try {
            const fullPhone = `+91${values.phoneNumber}`;
            
            // Query for the maid with this phone number
            const q = query(
                collection(firestore, 'maids'),
                where('contactNumber', '==', fullPhone)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError("This phone number is not registered. Please sign up first.");
                return;
            }

            const maidData = querySnapshot.docs[0].data();
            
            if (maidData.status !== 'approved') {
                router.push('/maid/pending');
                return;
            }

            // "Login" successful - Save session in localStorage
            localStorage.setItem('maid_session_id', maidData.id);
            localStorage.setItem('maid_session_name', maidData.name);
            localStorage.setItem('maid_session_phone', maidData.contactNumber);

            toast({ 
                title: 'Welcome Back!', 
                description: `Logged in as ${maidData.name}` 
            });
            
            router.push('/maid/dashboard');
        } catch (error: any) {
            console.error('Login failed', error);
            setError("Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <>
      {isLoading && <LoadingState fullPage type="maid" message="Authenticating partner..." />}
      <div className="space-y-6">
            {error && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-stone-400">Registered Phone Number</FormLabel>
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
                        Login to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </Form>

            <div className="pt-4 text-center">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">New partner?</p>
                <Button variant="link" className="text-stone-900 font-black h-auto p-0 mt-1" onClick={() => router.push('/maid/signup')}>
                    Join the Network
                </Button>
            </div>
        </div>
    </>
  );
}
