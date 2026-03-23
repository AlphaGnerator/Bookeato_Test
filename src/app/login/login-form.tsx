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
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { Loader2, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { defaultUser } from '@/lib/mock-data';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      // Smart fallback for standalone auth pages
      const hasDraft = localStorage.getItem('culinary-canvas-guest-config');
      if (hasDraft) {
        router.push('/booking/checkout');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Auth not initialized.'})
        setIsLoading(false);
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
            title: 'Login Successful',
            description: "Welcome back!",
        });
        handleSuccess();
    } catch (error: any) {
      
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Initialization error", description: "Firebase not ready."});
        setIsDemoLoading(false);
        return;
    }
    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        if (user) {
            const demoCustomerProfile: UserProfile = {
                id: user.uid,
                name: "Demo Customer",
                email: `demo-${user.uid.slice(0,5)}@example.com`,
                address: '123 Demo Lane, Anytown, 110011',
                pincode: '110011',
                calorieTarget: 2200,
                dietaryNeeds: ['Vegetarian'],
                foodPreferences: ['North Indian', 'Spicy'],
                familySize: 2,
                walletBalance: 5000,
                subscription: {
                    status: 'none',
                    planId: 'daily',
                    tier: 1,
                    cost: 0,
                    startDate: new Date().toISOString(),
                    expiryDate: new Date().toISOString(),
                    config: {
                        people: '2 people',
                        meals: 'Lunch',
                        diet: 'Veg',
                        timeSlot: '12:00',
                    },
                },
            };
            const customerDocRef = doc(firestore, 'customers', user.uid);
            // Use non-blocking write. UI will optimistically update via culinary store.
            setDocumentNonBlocking(customerDocRef, demoCustomerProfile, { merge: true });

            toast({
                title: "Demo Login Successful",
                description: "You are now logged in as a demo customer.",
            });
            handleSuccess();
        }
    } catch (error: any) {
        console.error("Demo login failed", error);
        toast({
            variant: "destructive",
            title: "Demo Login Failed",
            description: error.message || "Could not sign in for the demo.",
        });
    } finally {
        setIsDemoLoading(false);
    }
  }

  return (
    <div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
            </Button>
        </form>
        </Form>
        <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">
                OR
            </span>
        </div>
        <Button variant="secondary" className="w-full" onClick={handleDemoLogin} disabled={isDemoLoading}>
            {isDemoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <TestTube className="mr-2 h-4 w-4" />
            )}
            Continue as Demo Customer
        </Button>
    </div>
  );
}
