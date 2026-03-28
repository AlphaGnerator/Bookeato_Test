'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { LiveOrder } from '@/types/bookeato-live';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, CheckCircle2, PackageSearch, ChefHat, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function LiveOrderKDS() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    
    // Listen for live orders
    const q = query(
      collection(firestore, 'liveOrders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: LiveOrder[] = [];
      snapshot.forEach(doc => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as LiveOrder);
      });
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast({ title: "Sync Error", description: "Failed to connect to Live Kitchen Stream", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [firestore]);

  const updateItemStatus = async (orderId: string, itemIndex: number, newStatus: "Preparing" | "Ready" | "Collected") => {
    if (!firestore) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = [...order.items];
    newItems[itemIndex].status = newStatus;

    // Check if ALL items in order are Ready or Collected
    const allReady = newItems.every(i => i.status === "Ready" || i.status === "Collected");
    const orderStatus = allReady ? "Ready" : "Preparing";

    try {
      await updateDoc(doc(firestore, 'liveOrders', orderId), {
        items: newItems,
        status: orderStatus
      });
      toast({ title: `Order ${orderId.slice(-4).toUpperCase()} Item Updated`, description: `Marked as ${newStatus}` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update item status.', variant: 'destructive' });
    }
  };

  const activeOrders = orders.filter(o => o.status !== "Collected");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-stone-900 text-white rounded-[2rem] p-8 -mt-2">
        <div className="flex items-center gap-4">
           <div className="bg-red-500/20 p-4 rounded-2xl animate-pulse">
              <Flame className="w-8 h-8 text-red-500" />
           </div>
           <div>
              <h1 className="text-3xl font-black">Kitchen Display System</h1>
              <p className="text-stone-400 mt-2 font-medium">Real-time order sync for Bookeato Live stalls.</p>
           </div>
        </div>
        <div className="text-right space-y-2">
           <div className="flex items-center gap-2 justify-end">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </span>
             <span className="font-bold text-sm text-stone-300">STREAM ACTIVE</span>
           </div>
           <p className="text-2xl font-black">{activeOrders.length} <span className="text-lg text-stone-500 font-bold">IN QUEUE</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3].map(i => <div key={i} className="bg-stone-100 rounded-[2rem] h-64 animate-pulse" />)}
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2rem]">
           <PackageSearch className="w-16 h-16 text-stone-300 mx-auto mb-4" />
           <h3 className="text-xl font-black text-stone-900">Waiting for orders...</h3>
           <p className="text-stone-500 mt-2 max-w-sm mx-auto">The stall is open. Orders from customers will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map(order => (
            <Card key={order.id} className="border-none shadow-xl shadow-stone-200/50 rounded-[2rem] overflow-hidden flex flex-col">
               <div className={`p-4 text-white flex justify-between items-center ${order.status === 'Ready' ? 'bg-emerald-500' : order.status === 'Preparing' ? 'bg-orange-500' : 'bg-stone-500'}`}>
                  <div className="flex items-center gap-2">
                     <span className="font-black text-lg">#{order.id?.slice(-4).toUpperCase()}</span>
                     <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
                        {order.status.toUpperCase()}
                     </Badge>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                     <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
               
               <div className="p-4 bg-stone-50 border-b border-stone-100">
                  <p className="font-bold text-stone-900">{order.customer.name}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                     <span>{order.customer.phone}</span>
                     <span>•</span>
                     <span className="font-bold text-stone-700">₹{order.totalAmount}</span>
                  </p>
               </div>
               
               <div className="p-6 flex-1 bg-white">
                 <h4 className="text-xs font-black uppercase text-stone-400 mb-4 tracking-widest">Order Details</h4>
                 <ul className="space-y-4">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center group">
                         <div>
                            <p className="font-bold text-stone-900"><span className="text-orange-500 mr-1">{item.quantity}x</span> {item.name}</p>
                            {item.portionSize && <p className="text-xs text-stone-500 mt-0.5">Portion: {item.portionSize}</p>}
                         </div>
                         <div className="flex flex-col gap-1 items-end">
                            {item.status === 'Queued' ? (
                               <Button size="sm" onClick={() => updateItemStatus(order.id!, idx, 'Preparing')} variant="outline" className="h-7 text-xs rounded-lg font-bold">
                                  Start Prep
                               </Button>
                            ) : item.status === 'Preparing' ? (
                               <div className="flex gap-2">
                                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">Prep</Badge>
                                  <Button size="sm" onClick={() => updateItemStatus(order.id!, idx, 'Ready')} className="h-7 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold px-3">
                                     <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Ready
                                  </Button>
                               </div>
                            ) : (
                               <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 pr-3">
                                 <CheckCircle2 className="w-3 h-3" /> Ready
                               </Badge>
                            )}
                         </div>
                      </li>
                    ))}
                 </ul>
               </div>

               {order.status === "Ready" && (
                 <div className="p-4 bg-emerald-50 text-center border-t border-emerald-100">
                    <p className="text-sm font-bold text-emerald-700 mb-3 flex items-center justify-center gap-2">
                       <BellRing className="w-4 h-4" /> Customer Notified
                    </p>
                    <Button 
                       onClick={async () => {
                         if (!firestore) return;
                         await updateDoc(doc(firestore, 'liveOrders', order.id!), { status: 'Collected' });
                         toast({ title: 'Order Collected', description: 'Moved to history.' });
                       }} 
                       className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                    >
                       Mark as Collected
                    </Button>
                 </div>
               )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLiveOrdersPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Live Kitchen Display">
          <LiveOrderKDS />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  )
}
