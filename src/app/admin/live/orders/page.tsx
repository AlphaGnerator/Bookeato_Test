'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppLayout } from '@/components/app-layout';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, CheckCircle2, PackageSearch, ChefHat, BellRing, RefreshCw, Plus, Filter, Phone, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KDSItem {
  name: string;
  price: number;
  quantity: number;
  portionSize?: string;
  status: 'Queued' | 'Preparing' | 'Ready' | 'Collected';
  customizations?: string[];
  imageUrl?: string;
}

interface KDSOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: 'Queued' | 'Preparing' | 'Ready' | 'Collected';
  createdAt: string;
  items: KDSItem[];
  deliveryDates?: string[];
}

const DEFAULT_LIVE_KITCHEN_ORDERS: KDSOrder[] = [
  {
    id: 'LIVE-9921',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 43210',
    customerAddress: 'Flat 804, Block B, My Home Vihanga, Nanakramguda',
    totalAmount: 395,
    status: 'Preparing',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    deliveryDates: ['Mon, 24 Aug', 'Tue, 25 Aug', 'Wed, 26 Aug', 'Thu, 27 Aug', 'Fri, 28 Aug'],
    items: [
      {
        name: 'Fresh Tender Coconut Water (Glass Bottle)',
        price: 79,
        quantity: 5,
        portionSize: '500 ml Glass Bottle',
        status: 'Preparing',
        customizations: ['Glass Bottle with Bookeato Sticker', 'Natural Unsweetened Raw Water'],
        imageUrl: '/live_menu/bookeato_coconut_glass_bottle.jpg'
      }
    ]
  },
  {
    id: 'LIVE-9922',
    customerName: 'Vikramaditya Verma',
    customerPhone: '+91 98480 99887',
    customerAddress: 'Tower 4, Flat 1202, Prestige High Fields, ISB Road',
    totalAmount: 845,
    status: 'Queued',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    deliveryDates: ['Mon, 24 Aug', 'Tue, 25 Aug', 'Wed, 26 Aug', 'Thu, 27 Aug', 'Fri, 28 Aug'],
    items: [
      {
        name: 'Overnight Protein Oats Jar (24g Protein)',
        price: 169,
        quantity: 5,
        portionSize: 'Glass Jar Mug',
        status: 'Queued',
        customizations: ['Belgian Chocolate Whey (24g)', 'Almond Milk', 'Strawberries & Bananas', 'Roasted Almond Flakes'],
        imageUrl: '/live_menu/bookeato_oats_glass_jar.jpg'
      }
    ]
  },
  {
    id: 'LIVE-9923',
    customerName: 'Priya Nambiar',
    customerPhone: '+91 91212 99001',
    customerAddress: 'Villa 42, Jayabheri Silicon County, Nanakramguda',
    totalAmount: 990,
    status: 'Ready',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    deliveryDates: ['Mon, 24 Aug', 'Tue, 25 Aug', 'Wed, 26 Aug', 'Thu, 27 Aug', 'Fri, 28 Aug'],
    items: [
      {
        name: 'Customized Organic Salad Box',
        price: 198,
        quantity: 5,
        portionSize: 'Large 450g Box',
        status: 'Ready',
        customizations: ['Chickpeas', 'Black-Eyed Peas (Lobiya)', 'Red Onions', 'Crisp Tomatoes', 'Lemon Mint Vinaigrette'],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    id: 'LIVE-9924',
    customerName: 'Rohan Mehta',
    customerPhone: '+91 99001 11223',
    customerAddress: 'Flat 302, Block C, Financial District, Hyderabad',
    totalAmount: 200,
    status: 'Queued',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    items: [
      {
        name: '(V) Indori Poha Special',
        price: 100,
        quantity: 2,
        portionSize: 'Single Serving',
        status: 'Queued',
        customizations: ['Jeeravan Masala', 'Pomegranate Seeds', 'Yellow Sev'],
        imageUrl: '/live_menu/indori_poha.png'
      }
    ]
  }
];

function LiveOrderKDSContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync Logic
  const syncKitchenOrders = () => {
    setIsSyncing(true);
    try {
      const localSaved = localStorage.getItem('bookeato_kds_orders');
      if (localSaved) {
        setOrders(JSON.parse(localSaved));
      } else {
        setOrders(DEFAULT_LIVE_KITCHEN_ORDERS);
        localStorage.setItem('bookeato_kds_orders', JSON.stringify(DEFAULT_LIVE_KITCHEN_ORDERS));
      }
    } catch (e) {
      setOrders(DEFAULT_LIVE_KITCHEN_ORDERS);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    syncKitchenOrders();

    if (!firestore) return;

    let unsubscribe: (() => void) | undefined;
    try {
      const q = query(collection(firestore, 'liveOrders'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const remoteOrders: KDSOrder[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          remoteOrders.push({
            id: docSnap.id,
            customerName: d.customer?.name || 'Customer',
            customerPhone: d.customer?.phone || '',
            customerAddress: d.customer?.address || '',
            totalAmount: d.totalAmount || 0,
            status: d.status || 'Queued',
            createdAt: d.createdAt || new Date().toISOString(),
            deliveryDates: d.deliveryDates || [],
            items: (d.items || []).map((i: any) => ({
              name: i.name || 'Live Stall Item',
              price: i.price || 0,
              quantity: i.quantity || 1,
              portionSize: i.portionSize || 'Standard',
              status: i.status || 'Queued',
              customizations: i.customizations || [],
              imageUrl: i.imageUrl || '/live_menu/indori_poha.png'
            }))
          });
        });

        if (remoteOrders.length > 0) {
          setOrders(prev => {
            const mergedMap = new Map();
            remoteOrders.forEach(o => mergedMap.set(o.id, o));
            prev.forEach(o => { if (!mergedMap.has(o.id)) mergedMap.set(o.id, o); });
            const merged = Array.from(mergedMap.values());
            localStorage.setItem('bookeato_kds_orders', JSON.stringify(merged));
            return merged;
          });
        }
      }, (err) => {
        console.warn("Firestore sync warning, using local KDS stream:", err);
      });
    } catch (e) {
      console.warn("KDS Stream fallback to local mode");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firestore]);

  const handleUpdateItemStatus = (orderId: string, itemIdx: number, newStatus: 'Queued' | 'Preparing' | 'Ready' | 'Collected') => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const newItems = [...order.items];
        newItems[itemIdx].status = newStatus;
        
        const allReady = newItems.every(i => i.status === 'Ready' || i.status === 'Collected');
        const allCollected = newItems.every(i => i.status === 'Collected');
        const anyPreparing = newItems.some(i => i.status === 'Preparing');
        
        let newOrderStatus: 'Queued' | 'Preparing' | 'Ready' | 'Collected' = order.status;
        if (allCollected) newOrderStatus = 'Collected';
        else if (allReady) newOrderStatus = 'Ready';
        else if (anyPreparing) newOrderStatus = 'Preparing';

        return { ...order, items: newItems, status: newOrderStatus };
      }
      return order;
    });

    setOrders(updated);
    localStorage.setItem('bookeato_kds_orders', JSON.stringify(updated));

    if (firestore) {
      try {
        updateDoc(doc(firestore, 'liveOrders', orderId), { status: newStatus }).catch(() => {});
      } catch (e) {}
    }

    toast({
      title: `Order #${orderId.slice(-4)} Updated`,
      description: `Item status set to ${newStatus}`
    });
  };

  const handleSimulateNewOrder = () => {
    const newDemoOrder: KDSOrder = {
      id: `LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Kavita Menon',
      customerPhone: '+91 97766 55443',
      customerAddress: 'Flat 501, Block A, Jayabheri Peak, Nanakramguda',
      totalAmount: 495,
      status: 'Queued',
      createdAt: new Date().toISOString(),
      deliveryDates: ['Mon, 24 Aug', 'Tue, 25 Aug', 'Wed, 26 Aug'],
      items: [
        {
          name: 'Overnight Protein Oats Jar (24g Protein)',
          price: 165,
          quantity: 3,
          portionSize: 'Glass Jar Mug',
          status: 'Queued',
          customizations: ['French Vanilla Bean (24g)', 'Oat Milk', 'Wild Blueberries', 'Dark Choco Chips'],
          imageUrl: '/live_menu/bookeato_oats_glass_jar.jpg'
        }
      ]
    };

    const updated = [newDemoOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('bookeato_kds_orders', JSON.stringify(updated));

    toast({
      title: '⚡ New Live Order Received!',
      description: `Overnight Protein Oats Jar order from ${newDemoOrder.customerName}`
    });
  };

  const activeOrders = orders.filter(o => filterStatus === 'all' || o.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KDS Header Banner */}
      <div className="bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500/20 p-4 rounded-2xl animate-pulse text-orange-500">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <Badge className="bg-orange-500 text-stone-950 font-black text-xs uppercase mb-1">Live Kitchen Stream</Badge>
            <h2 className="text-3xl font-black tracking-tight">Kitchen Display System (KDS)</h2>
            <p className="text-stone-400 text-sm font-medium mt-1">Real-time morning kitchen order sync for Coconut Water, Salad Boxes, and Oats Jars.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={syncKitchenOrders}
            variant="outline"
            className="border-stone-800 bg-stone-900 text-white hover:bg-stone-800 rounded-xl h-10 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin text-orange-400' : ''}`} /> Refresh Stream
          </Button>

          <Button 
            onClick={handleSimulateNewOrder}
            className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black rounded-xl h-10 text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Test Live Order
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Queue Counter */}
      <div className="flex justify-between items-center gap-4 flex-wrap bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Queued', 'Preparing', 'Ready', 'Collected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterStatus === status ? 'bg-orange-500 text-stone-950 shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-stone-800">
            {orders.filter(o => o.status !== 'Collected').length} Orders in Queue
          </span>
        </div>
      </div>

      {/* Kitchen Display Grid */}
      {activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem] space-y-3">
          <PackageSearch className="w-16 h-16 text-stone-300 mx-auto" />
          <h3 className="text-xl font-black text-stone-900">No active kitchen orders in this view.</h3>
          <p className="text-xs text-stone-500 font-semibold max-w-sm mx-auto">Click "Test Live Order" above to simulate new incoming customer subscriptions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map(order => (
            <Card key={order.id} className="border border-stone-200 shadow-sm hover:shadow-md transition-shadow rounded-[2rem] overflow-hidden flex flex-col bg-white">
              {/* Header Status Bar */}
              <div className={`p-4 text-white flex justify-between items-center ${
                order.status === 'Ready' ? 'bg-emerald-600' :
                order.status === 'Preparing' ? 'bg-orange-500' :
                order.status === 'Collected' ? 'bg-stone-800' : 'bg-stone-900'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">#{order.id.slice(-4)}</span>
                  <Badge className="bg-white/20 text-white border-none font-extrabold text-[10px] uppercase">
                    {order.status}
                  </Badge>
                </div>

                <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-stone-50 border-b border-stone-100 text-xs space-y-1">
                <div className="flex justify-between items-start">
                  <p className="font-extrabold text-stone-900 text-sm">{order.customerName}</p>
                  <span className="font-black text-orange-600 text-sm">₹{order.totalAmount}</span>
                </div>
                <p className="text-stone-500 font-medium flex items-center gap-1"><Phone className="w-3 h-3 text-stone-400" /> {order.customerPhone}</p>
                <p className="text-stone-500 font-medium truncate flex items-center gap-1"><MapPin className="w-3 h-3 text-stone-400 shrink-0" /> {order.customerAddress}</p>
                {order.deliveryDates && order.deliveryDates.length > 0 && (
                  <p className="text-[10px] font-bold text-orange-800 flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3 text-orange-600" /> {order.deliveryDates.length} Active Delivery Days Scheduled
                  </p>
                )}
              </div>

              {/* Item Details */}
              <div className="p-4 flex-1 space-y-3 text-xs">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">Ordered Items & Customizations</span>

                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-stone-200 shrink-0 bg-white">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-stone-900 text-xs leading-tight">
                          <span className="text-orange-600 font-black mr-1">{item.quantity}x</span> {item.name}
                        </p>
                        {item.portionSize && <p className="text-[10px] text-stone-500 font-semibold">{item.portionSize}</p>}
                      </div>
                    </div>

                    {/* Customization Badges */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.customizations.map((cust, cIdx) => (
                          <span key={cIdx} className="bg-white text-stone-800 px-2 py-0.5 rounded-lg text-[9.5px] font-bold border border-stone-200">
                            {cust}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Item Action Controls */}
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-stone-500">Status: {item.status}</span>
                      
                      <div className="flex gap-1.5">
                        {item.status === 'Queued' && (
                          <Button 
                            onClick={() => handleUpdateItemStatus(order.id, idx, 'Preparing')}
                            className="bg-orange-500 hover:bg-orange-600 text-stone-950 font-black text-[11px] h-7 rounded-xl px-2.5"
                          >
                            Start Prep
                          </Button>
                        )}

                        {item.status === 'Preparing' && (
                          <Button 
                            onClick={() => handleUpdateItemStatus(order.id, idx, 'Ready')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] h-7 rounded-xl px-2.5"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Ready
                          </Button>
                        )}

                        {item.status === 'Ready' && (
                          <Button 
                            onClick={() => handleUpdateItemStatus(order.id, idx, 'Collected')}
                            variant="outline"
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-[11px] h-7 rounded-xl px-2.5"
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        <AppLayout pageTitle="Kitchen Display System (KDS)">
          <LiveOrderKDSContent />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
