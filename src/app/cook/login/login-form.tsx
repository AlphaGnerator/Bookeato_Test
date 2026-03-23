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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import type { CookProfile } from '@/lib/types';

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

// This function must match the one in signup-form.tsx
const createEmailFromPhoneNumber = (phone: string) => `${phone.replace(/\D/g, '')}@example.com`;

export function LoginForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: '9898989898', password: '123456789' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Auth not initialized.'})
        setIsLoading(false);
        return;
    }
    try {
        const fullPhoneNumber = `+91${values.phoneNumber}`;
        // Use the corrected email creation function
        const email = createEmailFromPhoneNumber(fullPhoneNumber);

        const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
        const user = userCredential.user;

        // After successful login, check the cook's status
        const cookDocRef = doc(firestore, 'cooks', user.uid);
        const cookDoc = await getDoc(cookDocRef);

        if (cookDoc.exists()) {
            const cookProfile = cookDoc.data() as CookProfile;
            if (cookProfile.status === 'pending') {
                toast({
                    title: 'Login Successful',
                    description: "Your application is still pending review.",
                });
                router.push('/cook/pending');
            } else if (cookProfile.status === 'approved') {
                 toast({
                    title: 'Login Successful',
                    description: "Welcome back!",
                });
                router.push('/cook/dashboard');
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Account Rejected',
                    description: "Your application was not approved. Please contact support for more information.",
                });
                await auth.signOut(); // Log out the user
            }
        } else {
            // This case should ideally not happen if signup is correct
            throw new Error('Cook profile not found.');
        }

    } catch (error: any) {
      console.error('Login failed:', error.code, error.message);
      
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Invalid phone number or password. Please check your credentials and try again.';
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
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.' });
      setIsDemoLoading(false);
      return;
    }
    
    const demoPhoneNumber = '9898989898';
    const demoPassword = '123456789';
    const demoEmail = createEmailFromPhoneNumber(`+91${demoPhoneNumber}`);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      const user = userCredential.user;

      const cookDocRef = doc(firestore, 'cooks', user.uid);
      const cookDoc = await getDoc(cookDocRef);
      if (!cookDoc.exists()) {
        const demoCookProfile: CookProfile = {
            id: user.uid,
            name: 'Demo Cook',
            contactNumber: `+91${demoPhoneNumber}`,
            pincode: '110011',
            experience: 5,
            rating: 4.8,
            specialties: ['North Indian', 'Tandoori'],
            address: 'Demo Address, Culinary City',
            status: 'approved',
        };
        setDocumentNonBlocking(cookDocRef, demoCookProfile);
      }
      
      toast({
        title: 'Demo Login Successful!',
        description: 'Welcome, Demo Cook!',
      });
      router.push('/cook/dashboard');
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
                const user = newUserCredential.user;
                const demoCookProfile: CookProfile = {
                    id: user.uid,
                    name: 'Demo Cook',
                    contactNumber: `+91${demoPhoneNumber}`,
                    pincode: '110011',
                    experience: 5,
                    rating: 4.8,
                    specialties: ['North Indian', 'Tandoori'],
                    address: 'Demo Address, Culinary City',
                    status: 'approved',
                };
                const cookDocRef = doc(firestore, 'cooks', user.uid);
                setDocumentNonBlocking(cookDocRef, demoCookProfile);
                toast({
                    title: 'Demo Account Created!',
                    description: 'Logging you in as Demo Cook.',
                });
                router.push('/cook/dashboard');
            } catch (creationError: any) {
                 toast({
                    variant: 'destructive',
                    title: 'Demo Setup Failed',
                    description: creationError.message || 'An error occurred during demo account creation.',
                });
            }
        } else {
            console.error('Demo cook login failed', error);
            toast({
                variant: 'destructive',
                title: 'Demo Login Failed',
                description: error.message || 'An error occurred during demo login.',
            });
        }
    } finally {
      setIsDemoLoading(false);
    }
  };


  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm">
                        +91
                    </span>
                    <Input placeholder="1234567890" {...field} className="rounded-l-none" />
                  </div>
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
          Login as Demo Cook
      </Button>
    </div>
  );
}
