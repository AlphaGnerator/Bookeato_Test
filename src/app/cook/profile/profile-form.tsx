
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { TagInput } from '@/components/tag-input';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Textarea } from '@/components/ui/textarea';
import type { CookProfile } from '@/lib/types';
import { Upload, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  experience: z.coerce.number().min(0, "Experience can't be negative."),
  rating: z.coerce.number().min(0).max(5),
  specialties: z.array(z.string()).default([]),
  contactNumber: z.string().min(10, 'Please enter a valid phone number.'),
  address: z.string().min(5, 'Address is required.'),
  pincode: z.string().min(5, 'A valid pincode is required.'),
  kycDocument: z.any().optional(),
  totalEarnings: z.coerce.number().optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CookProfileForm() {
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const cookProfileRef = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
      return doc(firestore, 'cooks', firebaseUser.uid);
    }
    return null;
  }, [firestore, firebaseUser]);
  
  const { data: cookProfile, isLoading: isProfileLoading } = useDoc<CookProfile>(cookProfileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: cookProfile ? { ...cookProfile } : undefined,
    mode: 'onChange',
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!cookProfileRef) {
        toast({ title: "Error", description: "Not logged in.", variant: "destructive"});
        return;
    };
    // We don't save the file or total earnings to Firestore from the form
    const { kycDocument, totalEarnings, status, ...profileData } = data;
    await setDoc(cookProfileRef, profileData, { merge: true });
    toast({
      title: 'Profile Updated',
      description: 'Your information has been saved successfully.',
    });
  };
  
  if (isProfileLoading) {
    return <ProfileFormSkeleton />;
  }

  const statusVariant = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
  } as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Status</FormLabel>
              <div>
                {field.value && (
                  <Badge variant={statusVariant[field.value] || 'secondary'} className="text-base">
                    {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                  </Badge>
                )}
              </div>
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                <Input placeholder="Your Name" {...field} />
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
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                <Input placeholder="+1 123 456 7890" {...field} />
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
                <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="grid md:grid-cols-3 gap-8">
            <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g., 4.5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="totalEarnings"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total Earnings</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="e.g., 2345" {...field} disabled className="pl-8 bg-muted/50" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <FormControl>
                <TagInput {...field} placeholder="Add a specialty..." />
              </FormControl>
              <FormDescription>
                List cuisines or dishes you specialize in (e.g., North Indian, Baking, Desserts).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kycDocument"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KYC Document</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input type="file" className="w-full pr-16" onChange={(e) => field.onChange(e.target.files)} />
                   <Button type="button" size="sm" className="absolute top-1/2 right-1 -translate-y-1/2" disabled>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Upload a document for identity verification (e.g., Aadhar, PAN). Feature coming soon.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button variant="accent" type="submit" disabled={!form.formState.isDirty}>Update Profile</Button>
      </form>
    </Form>
  );
}


function ProfileFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-20 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-11 w-32" />
        </div>
    )
}
