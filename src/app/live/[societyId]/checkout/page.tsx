'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LiveItem, LiveOrder } from '@/types/bookeato-live';
import { ChevronLeft, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CartItem extends LiveItem {
   cartQuantity: number;
}

export default function LiveCheckout() {
  const router = useRouter();
  const params = useParams();
  const societyId = params.societyId as string;
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<{name: string, phone: string, email: string, uid: string} | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
     try {
       const savedCart = localStorage.getItem('bookeato_live_cart');
       const savedSession = localStorage.getItem('bookeato_live_customer');
       
       if (savedCart) setCart(JSON.parse(savedCart));
       if (savedSession) setCustomer(JSON.parse(savedSession));
     } catch (e) {
       console.error("Failed to parse cart", e);
     }
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handlePlaceOrder = async () => {
     if (!firestore || !customer || cart.length === 0) return;
     setIsPlacing(true);

     try {
       const newOrder: LiveOrder = {
          societyId,
          customer: {
             name: customer.name,
             phone: customer.phone,
             email: customer.email,
             uid: customer.uid
          },
          items: cart.map(item => ({
             itemId: item.id,
             name: item.name,
             price: item.price,
             quantity: item.cartQuantity,
             status: "Queued"
          })),
          status: "Queued",
          totalAmount: total,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
       };

       const docRef = await addDoc(collection(firestore, 'liveOrders'), newOrder);
       
       // Clear cart
       localStorage.removeItem('bookeato_live_cart');
       
       toast({ title: 'Order Received', description: 'Sending order to the stall kitchen...' });
       
       // Go to order tracking
       router.replace(`/live/${societyId}/order/${docRef.id}`);
     } catch (e) {
       console.error(e);
       toast({ title: 'Payment Failed', description: 'There was an issue processing your order.', variant: 'destructive' });
       setIsPlacing(false);
     }
  };

  if (cart.length === 0) {
     return (
        <div className="min-h-screen bg-[#2a2b2e] flex flex-col items-center justify-center p-6 text-center">
           <ShoppingBag className="w-16 h-16 text-stone-600 mb-4" />
           <h2 className="text-2xl font-black text-white">Your cart is empty</h2>
           <Button onClick={() => router.back()} variant="outline" className="mt-6 border-stone-700 text-stone-300">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Menu
           </Button>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#2a2b2e] pb-32">
       <header className="sticky top-0 z-30 bg-[#2a2b2e]/90 backdrop-blur-xl border-b border-stone-800 px-4 py-4 flex items-center gap-4 shadow-lg">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
             <ChevronLeft className="w-5 h-5 text-stone-400" />
          </button>
          <h1 className="text-xl font-black text-white leading-tight">Checkout</h1>
       </header>

       <main className="px-6 py-6 max-w-lg mx-auto space-y-6">
          <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 shadow-xl">
             <h2 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-4">Order Summary</h2>
             
             <ul className="space-y-4">
                {cart.map((item, idx) => (
                   <li key={idx} className="flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                         <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-stone-900 border border-stone-700 shrink-0">
                            {item.imageUrl.startsWith('/') || item.imageUrl.startsWith('http') ? (
                               <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                            ) : null}
                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-stone-900 border-none shadow drop-shadow z-10">{item.cartQuantity}</div>
                         </div>
                         <div className="flex flex-col flex-1 pl-1">
                            <span className="font-bold text-stone-100 text-sm">{item.name}</span>
                            <span className="text-xs text-stone-400 mt-0.5 max-w-[12rem] truncate">x {item.cartQuantity}</span>
                         </div>
                      </div>
                      <span className="font-bold text-white whitespace-nowrap">₹{item.price * item.cartQuantity}</span>
                   </li>
                ))}
             </ul>

             <div className="border-t border-stone-700 mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-stone-400 font-medium">
                   <span>Subtotal</span>
                   <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-400 font-medium pb-2 border-b border-stone-700/50">
                   <span>Tax & Fees</span>
                   <span>₹0</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                   <span className="font-black text-white text-lg">Total</span>
                   <span className="font-black text-orange-500 text-3xl">₹{total}</span>
                </div>
             </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 flex gap-3 text-emerald-500">
             <CheckCircle2 className="w-6 h-6 shrink-0" />
             <p className="text-xs font-medium leading-relaxed">
                By tapping Pay, you authorize us to begin preparing your order immediately. You will be notified the moment it's plated.
             </p>
          </div>
       </main>

       <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#2a2b2e] via-[#2a2b2e]/90 to-transparent">
          <Button 
            onClick={handlePlaceOrder} 
            disabled={isPlacing}
            className="w-full h-16 max-w-lg mx-auto bg-orange-500 hover:bg-orange-600 rounded-2xl flex items-center justify-center gap-2 shadow-[0_15px_30px_rgba(249,115,22,0.3)] transition-all active:scale-95"
          >
             <span className="font-black text-xl text-stone-900 tracking-tight">
                {isPlacing ? 'Confirming...' : 'Pay ₹' + total}
             </span>
             {!isPlacing && <span className="bg-stone-900/20 text-stone-900 text-xs font-black px-2 py-0.5 rounded-lg ml-2">UPI / CARD</span>}
          </Button>
       </div>
    </div>
  );
}
