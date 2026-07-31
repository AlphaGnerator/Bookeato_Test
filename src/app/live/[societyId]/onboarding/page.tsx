'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat, ArrowRight } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function FrictionlessOnboarding() {
  const router = useRouter();
  const params = useParams();
  const societyId = params.societyId as string;
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // In a real app we'd use react-hook-form + zod, but keeping it simple for zero friction
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '' });

  useEffect(() => {
    // Check local storage for existing session
    const savedSession = localStorage.getItem('bookeato_live_customer');
    if (savedSession && auth?.currentUser) {
      // Bypass onboarding
      router.replace(`/live/${societyId}/menu`);
    } else {
      setIsChecking(false);
    }
  }, [auth, router, societyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    if (!formData.name || !formData.phone) {
      toast({ title: 'Almost there', description: 'Please provide at least your Name and Phone relative to your order.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      let uid = '';

      // If user provided email and password, use standard auth
      if (formData.email && formData.password) {
         try {
           const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
           uid = userCredential.user.uid;
         } catch (err: any) {
           // If email already exists, try to sign in instead
           if (err.code === 'auth/email-already-in-use') {
             const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
             uid = userCredential.user.uid;
           } else {
             throw err; // Re-throw other errors to be caught by outer catch
           }
         }
      } else {
         // 1. Frictionless Anonymous SignIn
         const userCredential = await signInAnonymously(auth);
         uid = userCredential.user.uid;
      }

      // 2. Save profile mapping to Firestore
      await setDoc(doc(firestore, 'liveCustomers', uid), {
         uid,
         name: formData.name,
         phone: formData.phone,
         email: formData.email,
         registeredAt: new Date().toISOString()
      }, { merge: true });

      // 3. Save local session flag
      const customerData = { ...formData, uid };
      localStorage.setItem('bookeato_live_customer', JSON.stringify(customerData));

      toast({ title: 'Welcome!', description: "Let's grab some food.", variant: 'default' });

      // 4. Redirect to menu
      router.push(`/live/${societyId}/menu`);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Connection Error', description: 'Could not start your session. Please try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#2a2b2e] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-t-orange-500 border-orange-500/30 animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#2a2b2e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20 pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-20">
         <Button onClick={() => router.push('/live')} variant="ghost" className="text-stone-400 hover:text-white px-2 hover:bg-stone-800 h-10 w-10 p-0 rounded-full">
            <ArrowRight className="w-5 h-5 rotate-180" />
         </Button>
      </div>

      <div className="max-w-md w-full relative z-10 mt-12 md:mt-0">
         <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
               <ChefHat className="w-8 h-8 text-stone-900" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Who's ordering?</h1>
            <p className="text-stone-400 mt-3 font-medium">Just a few details so we know who to give the hot food to.</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800/80 p-8 rounded-[2rem] border-2 border-stone-700 backdrop-blur-md shadow-2xl">
            <div className="space-y-2">
               <Label htmlFor="name" className="text-stone-300 font-bold uppercase tracking-wider text-xs ml-1">Your Name</Label>
               <Input 
                 id="name" 
                 required
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="bg-stone-900 border-stone-700 h-14 rounded-xl text-lg text-white placeholder:text-stone-600 focus-visible:ring-orange-500" 
                 placeholder="e.g. John Doe" 
               />
            </div>
            <div className="space-y-2">
               <Label htmlFor="phone" className="text-stone-300 font-bold uppercase tracking-wider text-xs ml-1">Phone Number</Label>
               <Input 
                 id="phone" 
                 type="tel"
                 required
                 value={formData.phone}
                 onChange={e => setFormData({...formData, phone: e.target.value})}
                 className="bg-stone-900 border-stone-700 h-14 rounded-xl text-lg text-white placeholder:text-stone-600 focus-visible:ring-orange-500" 
                 placeholder="For order updates" 
               />
            </div>
            <div className="space-y-2">
               <Label htmlFor="email" className="text-stone-400 font-bold uppercase tracking-wider text-xs ml-1">Email <span className="lowercase font-normal text-stone-500">(Optional)</span></Label>
               <Input 
                 id="email" 
                 type="email"
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="bg-stone-900 border-stone-700 h-14 rounded-xl text-lg text-white placeholder:text-stone-600 focus-visible:ring-orange-500" 
                 placeholder="For receipts" 
               />
            </div>
            
            <div className="space-y-2">
               <Label htmlFor="password" className="text-stone-400 font-bold uppercase tracking-wider text-xs ml-1">Password <span className="lowercase font-normal text-stone-500">(Optional account creation)</span></Label>
               <Input 
                 id="password" 
                 type="password"
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 className="bg-stone-900 border-stone-700 h-14 rounded-xl text-lg text-white placeholder:text-stone-600 focus-visible:ring-orange-500" 
                 placeholder="Leave blank for quick guest checkout" 
               />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 text-lg font-black bg-orange-500 hover:bg-orange-600 text-stone-900 rounded-xl mt-4 shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all flex items-center justify-between px-6"
            >
               {isLoading ? 'Connecting...' : 'Dive In'}
               {!isLoading && <ArrowRight className="w-5 h-5 bg-stone-900/20 rounded-full p-1" />}
            </Button>
            
            <p className="text-[10px] text-center text-stone-500 mt-4 leading-relaxed font-medium">
               By proceeding, you agree to our expedited popup terms. If you provide a password, we'll create an account for you. Otherwise, your device will be temporarily paired to your order.
            </p>
         </form>
      </div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
