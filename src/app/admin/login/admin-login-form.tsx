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
import { Loader2, UserCheck, Database, Utensils, BookOpen, CalendarX, Images, Library, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

const formSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export function AdminLoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (values.username === 'anirudh' && values.password === '1111111111') {
        try {
            if (!auth) throw new Error("Auth service not available.");
            // Sign in anonymously to get an authenticated session for admin access
            await signInAnonymously(auth);
            toast({
                title: 'Admin Login Successful',
                description: "Welcome, Admin!",
            });
            setIsAdmin(true);
        } catch (error: any) {
            console.error("Admin anonymous sign-in failed", error);
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Could not establish an admin session.',
            });
        }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password.',
      });
    }
    setIsLoading(false);
  };
  
  if (isAdmin) {
    return (
        <div className="space-y-4">
            <h3 className="font-medium text-center">Select an Admin Panel</h3>
            <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/bookings')}>
                 <span>Customer Bookings</span>
                <BookOpen className="h-4 w-4" />
            </Button>
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/cook-requests')}>
                 <span>Cook Approval Requests</span>
                <UserCheck className="h-4 w-4" />
            </Button>
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/customers')}>
                 <span>Customer Report</span>
                <Database className="h-4 w-4" />
            </Button>
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/availability')}>
                 <span>Slot Availability</span>
                <CalendarX className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/carousel')}>
                 <span>Carousel Images</span>
                <Images className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/image-library')}>
                 <span>Image Library</span>
                <Library className="h-4 w-4" />
            </Button>
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/debug-calculation')}>
                 <span>Debug Calculation</span>
                <Calculator className="h-4 w-4" />
            </Button>
        </div>
    )
  }

  return (
    <div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <Input placeholder="anirudh" {...field} />
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
                    <Input type="password" placeholder="••••••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login as Admin
            </Button>
        </form>
        </Form>
    </div>
  );
}
