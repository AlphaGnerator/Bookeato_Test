'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/lib/types';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  address: z.string().min(1, 'Address is required.'),
  pincode: z.string().min(5, 'A valid 5 or 6 digit pincode is required.').max(6),
});

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { guestConfig } = useCulinaryStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      address: '',
      pincode: '',
    },
  });

  // Autopopulate address and pincode from guest session or maid booking if available
  useEffect(() => {
    // 1. Try resolving from Maid Booking Handoff
    const pendingBookingRaw = typeof window !== 'undefined' ? localStorage.getItem('bookeato_pending_maid_booking') : null;
    if (pendingBookingRaw) {
      try {
        const bookingData = JSON.parse(pendingBookingRaw);
        if (bookingData.address) form.setValue('address', bookingData.address);
        if (bookingData.pincode) form.setValue('pincode', bookingData.pincode);
        // We skip phone here as the base Auth schema uses email/pass, 
        // but the address is fully mapped!
        return; // Prioritize maid booking details if they exist
      } catch (e) {
        console.error("Failed to parse maid booking data", e);
      }
    }

    // 2. Fallback to default Culinary Cook Guest Config
    if (guestConfig) {
        let fullAddress = guestConfig.address || '';
        // Seamlessly combine address with city/state if provided
        if (guestConfig.city) fullAddress += (fullAddress ? ', ' : '') + guestConfig.city;
        if (guestConfig.state) fullAddress += (fullAddress ? ', ' : '') + guestConfig.state;
        
        if (fullAddress) form.setValue('address', fullAddress);
        if (guestConfig.pincode) form.setValue('pincode', guestConfig.pincode);
    }
  }, [guestConfig, form]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      const hasDraft = localStorage.getItem('culinary-canvas-draft-bookings');
      if (hasDraft) {
        try {
            const drafts = JSON.parse(hasDraft);
            if (drafts.length > 0) {
                const date = format(new Date(drafts[0].bookingDate), 'yyyy-MM-dd');
                router.push(`/booking/summary/${date}`);
                return;
            }
        } catch (e) {}
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.'})
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (user) {
        const userProfile: UserProfile = {
          id: user.uid,
          name: values.name,
          email: values.email,
          address: values.address,
          pincode: values.pincode,
          familySize: guestConfig?.familySize || 1,
          calorieTarget: 2000,
          dietaryNeeds: [],
          foodPreferences: [],
          walletBalance: 0, // Start with 0 balance
          subscription: { // Start with no plan
              status: 'none',
              planId: 'daily',
              tier: 1,
              cost: 0,
              startDate: new Date().toISOString(),
              expiryDate: new Date().toISOString(),
              config: {
                  people: `${guestConfig?.familySize || 1} people`,
                  meals: 'Lunch',
                  diet: 'Veg',
                  timeSlot: '12:00',
              },
          },
        };
        const userDocRef = doc(firestore, 'customers', user.uid);
        setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

        toast({
          title: 'Account Created!',
          description: 'Welcome! You can now log in.',
        });
        handleSuccess();
      }
    } catch (error: any) {
      console.error('Sign up failed', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'Could not create your account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Culinary Lane, Foodie City" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 110011" {...field} />
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
          Create Account
        </Button>
      </form>
    </Form>
  );
}
