
'use client';

import { useState } from 'react';
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
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { CookProfile } from '@/lib/types';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  contactNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
  pincode: z.string().min(5, 'A valid pincode is required.'),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// A simple function to create a "dummy" email from a phone number
const createEmailFromPhoneNumber = (phone: string) => `${phone.replace(/\D/g, '')}@example.com`;

export function SignUpForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        name: '',
        contactNumber: '',
        pincode: '',
        password: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.' });
        setIsLoading(false);
        return;
    }
    
    try {
      const fullPhoneNumber = `+91${values.contactNumber}`;
      const email = createEmailFromPhoneNumber(fullPhoneNumber);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      const user = userCredential.user;

      if (user) {
        const newCookProfile: Omit<CookProfile, 'id'> = {
            name: values.name,
            contactNumber: fullPhoneNumber,
            pincode: values.pincode,
            status: 'pending', // Correctly set to 'pending' for admin approval
            experience: 0,
            rating: 0,
            specialties: [],
            address: '',
        };
        const cookDocRef = doc(firestore, 'cooks', user.uid);
        
        // Use awaited setDoc to ensure profile is created before proceeding
        await setDoc(cookDocRef, newCookProfile);

        toast({
          title: 'Application Submitted!',
          description: "Your profile is under review. We'll notify you upon approval.",
        });
        
        // After signup, the user is authenticated. Redirect them to the pending page.
        // DO NOT sign them out. They need to be logged in to see their status.
        router.push('/cook/pending'); 
      }
    } catch (error: any) {
      console.error('Sign up failed', error);
      let description = 'Could not create your account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This phone number is already registered. Please log in instead.';
        toast({
          variant: 'default',
          title: 'Account Exists',
          description: description,
        });
        router.push('/cook/login');
        return; // Important: exit the function after redirecting
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div>
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
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login Phone Number</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm">
                        +91
                      </span>
                      <Input placeholder="1234567890" {...field} className="rounded-l-none" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This 10-digit number will be your username.
                  </FormDescription>
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account & Login
            </Button>
          </form>
        </Form>
    </div>
  );
}
