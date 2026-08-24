'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Search, Wallet, ShoppingBag, Phone, Mail, MapPin, Calendar, Clock, Eye } from 'lucide-react';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  walletBalance: number;
  totalOrdersCount: number;
  lastOrderDate: string;
  previousOrders: {
    orderId: string;
    itemTitle: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-201',
    name: 'Ananya Sharma',
    phone: '+91 98765 43210',
    email: 'ananya.s@bookeato.com',
    address: 'Flat 804, Block B, My Home Vihanga, Nanakramguda',
    pincode: '500032',
    walletBalance: 2500,
    totalOrdersCount: 14,
    lastOrderDate: '2026-08-24',
    previousOrders: [
      { orderId: 'SUB-98214', itemTitle: 'Fresh Tender Coconut Water (500ml)', amount: 395, date: '2026-08-24', status: 'Active Subscription' },
      { orderId: 'SUB-77219', itemTitle: 'Customized Organic Salad Box', amount: 645, date: '2026-08-20', status: 'Completed' },
      { orderId: 'ORD-11204', itemTitle: '(V) Indori Poha Special', amount: 100, date: '2026-08-18', status: 'Delivered' },
    ]
  },
  {
    id: 'cust-202',
    name: 'Vikramaditya Verma',
    phone: '+91 98480 99887',
    email: 'vikram.verma@gmail.com',
    address: 'Tower 4, Flat 1202, Prestige High Fields, ISB Road',
    pincode: '500032',
    walletBalance: 1850,
    totalOrdersCount: 8,
    lastOrderDate: '2026-08-23',
    previousOrders: [
      { orderId: 'SUB-55412', itemTitle: 'Overnight Protein Oats Jar (24g Protein)', amount: 845, date: '2026-08-23', status: 'Active Subscription' },
      { orderId: 'COOK-402', itemTitle: 'Monthly North Indian Cook Service', amount: 4500, date: '2026-08-10', status: 'Active' },
    ]
  },
  {
    id: 'cust-203',
    name: 'Priya Nambiar',
    phone: '+91 91212 99001',
    email: 'priya.nambiar@gmail.com',
    address: 'Villa 42, Jayabheri Silicon County, Nanakramguda',
    pincode: '500032',
    walletBalance: 3200,
    totalOrdersCount: 22,
    lastOrderDate: '2026-08-24',
    previousOrders: [
      { orderId: 'SUB-33109', itemTitle: 'Customized Organic Salad Box', amount: 990, date: '2026-08-24', status: 'Active Subscription' },
      { orderId: 'MAID-801', itemTitle: 'Daily Deep Cleaning Maid Service', amount: 3500, date: '2026-08-01', status: 'Active' },
    ]
  }
];

export function CustomerList() {
  const firestore = useFirestore();
  const [customers, setCustomers] = useState<CustomerRecord[]>(DEFAULT_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!firestore) return;
      try {
        const snap = await getDocs(collection(firestore, 'customers'));
        const fetched: CustomerRecord[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            name: data.name || 'Anonymous Customer',
            phone: data.phone || '+91 90000 00000',
            email: data.email || `${docSnap.id}@bookeato.com`,
            address: data.address || 'Nanakramguda, Hyderabad',
            pincode: data.pincode || '500032',
            walletBalance: data.walletBalance || 2500,
            totalOrdersCount: data.totalOrdersCount || 5,
            lastOrderDate: data.lastOrderDate || '2026-08-24',
            previousOrders: data.previousOrders || []
          });
        });

        if (fetched.length > 0) {
          const merged = [...fetched];
          DEFAULT_CUSTOMERS.forEach(def => {
            if (!merged.find(m => m.name === def.name)) merged.push(def);
          });
          setCustomers(merged);
        }
      } catch (e) {
        console.error("Failed to fetch customer database", e);
      }
    };
    fetchCustomers();
  }, [firestore]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[2.5rem] border border-stone-200 shadow-md overflow-hidden">
        <CardHeader className="bg-stone-950 text-white p-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <Badge className="bg-orange-500 text-stone-950 font-black text-xs uppercase mb-2">Customer Intelligence</Badge>
              <CardTitle className="text-3xl font-black">Customer Database & Wallet Balances</CardTitle>
              <CardDescription className="text-stone-400 font-medium mt-1">
                Inspect customer profiles, delivery addresses, wallet balances, and previous subscription history.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-stone-900 border border-stone-800 px-4 py-2 rounded-2xl text-center">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Customers</span>
                <span className="text-2xl font-black text-white">{customers.length}</span>
              </div>
              <div className="bg-stone-900 border border-stone-800 px-4 py-2 rounded-2xl text-center">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Wallet Reserve</span>
                <span className="text-2xl font-black text-orange-400">₹{customers.reduce((sum, c) => sum + c.walletBalance, 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search by customer name, phone number, email or address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-stone-900 border-stone-800 text-white text-xs rounded-xl focus:ring-orange-500 placeholder:text-stone-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-stone-50">
                <TableRow>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Contact Info</TableHead>
                  <TableHead className="font-bold">Delivery Address</TableHead>
                  <TableHead className="font-bold text-center">Wallet Balance</TableHead>
                  <TableHead className="font-bold text-center">Total Orders</TableHead>
                  <TableHead className="font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(cust => (
                  <TableRow key={cust.id} className="hover:bg-stone-50/80 transition-colors">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-stone-900 text-sm block">{cust.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">ID: #{cust.id}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs text-stone-600 font-medium">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-stone-400" /> {cust.phone}</span>
                        <span className="flex items-center gap-1 text-[11px] text-stone-500"><Mail className="w-3 h-3 text-stone-400" /> {cust.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-stone-600 font-medium max-w-xs truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>{cust.address} ({cust.pincode})</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className="bg-orange-100 text-orange-950 font-black border border-orange-300 text-xs px-3 py-1">
                        ₹{cust.walletBalance.toLocaleString('en-IN')}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-bold text-xs">
                      {cust.totalOrdersCount} Orders
                    </TableCell>

                    <TableCell className="text-right">
                      <Button 
                        onClick={() => setSelectedCustomer(cust)}
                        variant="outline"
                        className="h-8 border-stone-300 text-stone-800 hover:bg-stone-100 text-xs font-bold rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-orange-600" /> View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER DETAILS & PREVIOUS ORDERS DIALOG */}
      <Dialog open={selectedCustomer !== null} onOpenChange={open => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader className="space-y-1 text-left border-b border-stone-100 pb-3">
                <Badge className="bg-orange-100 text-orange-950 font-black text-[9px] uppercase w-fit">Customer Intelligence Profile</Badge>
                <DialogTitle className="text-2xl font-black text-stone-950">{selectedCustomer.name}</DialogTitle>
                <DialogDescription className="text-xs text-stone-500 font-medium">
                  Inspect delivery location, wallet reserves, and past order trajectory.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs text-left">
                {/* Customer Contact & Address Banner */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-stone-700 font-medium">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-orange-600" /> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-orange-600" /> {selectedCustomer.email}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 text-stone-700 font-medium flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <span>{selectedCustomer.address}, Pincode: {selectedCustomer.pincode}</span>
                  </div>
                </div>

                {/* Wallet & Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-stone-950 text-white rounded-2xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block">Bookeato Pay Balance</span>
                    <span className="text-2xl font-black text-orange-400">₹{selectedCustomer.walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-4 bg-orange-50 text-orange-950 rounded-2xl border border-orange-200">
                    <span className="text-[10px] text-orange-800 font-extrabold uppercase block">Lifetime Completed Orders</span>
                    <span className="text-2xl font-black text-orange-950">{selectedCustomer.totalOrdersCount} Orders</span>
                  </div>
                </div>

                {/* Previous Orders & Subscriptions History */}
                <div className="space-y-2">
                  <span className="font-extrabold text-stone-900 text-sm block">Previous Orders & Subscriptions History</span>
                  
                  {selectedCustomer.previousOrders && selectedCustomer.previousOrders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomer.previousOrders.map((ord, idx) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200 rounded-xl flex justify-between items-center shadow-xs">
                          <div>
                            <span className="font-bold text-stone-900 text-xs block">{ord.itemTitle}</span>
                            <span className="text-[10px] text-stone-400 font-mono">#{ord.orderId} • {ord.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-950 text-xs block">₹{ord.amount}</span>
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-[9px] font-bold">
                              {ord.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-stone-50 rounded-xl text-stone-500 font-medium text-xs">
                      No previous orders recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
