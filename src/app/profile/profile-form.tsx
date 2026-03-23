
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
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { dietaryOptions } from '@/lib/mock-data';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from '@/components/tag-input';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  address: z.string().optional(),
  pincode: z.string().optional(),
  familySize: z.coerce.number().min(1, 'Family size must be at least 1.').default(1),
  calorieTarget: z.coerce.number().min(0, 'Calorie target cannot be negative.').default(2000),
  dietaryNeeds: z.array(z.string()).default([]),
  foodPreferences: z.array(z.string()).default([]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, isInitialized } = useCulinaryStore();
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
      if(firestore && firebaseUser) {
          return doc(firestore, 'customers', firebaseUser.uid);
      }
      return null;
  }, [firestore, firebaseUser]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      ...user,
      address: user.address ?? '',
      pincode: user.pincode ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateUserProfile(data);
    if(userProfileRef) {
        setDocumentNonBlocking(userProfileRef, data, { merge: true });
    }
    toast({
      title: 'Profile Updated',
      description: 'Your preferences have been saved successfully.',
    });
  };
  
  if (!isInitialized) {
    return <ProfileFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Culinary Lane, Foodie City" {...field} />
                </FormControl>
                 <FormDescription>
                    Your full address for the cook to travel to.
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
                 <FormDescription>
                    This is used to check cook availability in your area.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
        />

        <div className="grid md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="familySize"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Family Size</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 4" {...field} />
                </FormControl>
                <FormDescription>
                    Number of people the cook will prepare food for.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="calorieTarget"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Daily Calorie Target (per person)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 2000" {...field} />
                </FormControl>
                <FormDescription>
                    This helps us recommend meals that fit your goals.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="dietaryNeeds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Dietary Needs</FormLabel>
                <FormDescription>
                  Select any dietary restrictions you have.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dietaryOptions.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="dietaryNeeds"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="foodPreferences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Preferences</FormLabel>
              <FormControl>
                <TagInput {...field} placeholder="Add a cuisine or ingredient..." />
              </FormControl>
              <FormDescription>
                List cuisines (e.g., North Indian, South Indian, Mexican, Thai) or foods you enjoy.
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
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-11 w-32" />
        </div>
    )
}
