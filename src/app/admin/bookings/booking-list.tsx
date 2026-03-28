'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, doc, collection, where, onSnapshot } from 'firebase/firestore';
import type { Booking, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    CalendarCheck, AlertTriangle, Eye, ChefHat, ArrowUp, ArrowDown, 
    Sparkles, Home, UtensilsCrossed, Search, Filter, 
    TrendingUp, TrendingDown, DollarSign, Star, MessageSquare 
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, subDays, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function BookingRow({ booking, customer: providedCustomer }: { booking: Booking, customer?: UserProfile | null }) {
    const router = useRouter();
    
    const displayCustomer = useMemo(() => {
        if (providedCustomer) return providedCustomer;
        return {
            id: booking.customerId,
            name: booking.customerName || 'Unknown Customer',
            contactNumber: booking.customerContact || 'N/A',
            address: booking.customerAddress || 'N/A'
        } as UserProfile;
    }, [providedCustomer, booking]);
    
    const handleRowClick = () => {
        router.push(`/admin/bookings/${booking.id}?customerId=${booking.customerId}`);
    }
    
    const statusVariant = {
        pending: 'accent',
        confirmed: 'default',
        in_progress: 'default',
        completed: 'default',
        delivered: 'default',
        cancelled: 'destructive'
    } as const;

    const serviceTypeIcon: Record<string, React.ReactNode> = {
        'cook': <ChefHat className="h-4 w-4 text-orange-500" strokeWidth={2.5}/>,
        'maid': <Sparkles className="h-4 w-4 text-green-500" strokeWidth={2.5}/>,
        'subscription': <Sparkles className="h-4 w-4 text-purple-500" strokeWidth={2.5}/>,
    }

    return (
        <TableRow onClick={handleRowClick} className="cursor-pointer hover:bg-muted/50 transition-colors group border-stone-50">
            <TableCell className="pl-8 py-4">
                <div className="flex flex-col">
                    <span className="font-black text-stone-900 tracking-tight group-hover:text-orange-600 transition-colors">{displayCustomer.name}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{displayCustomer.contactNumber}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="bg-stone-50 p-1.5 rounded-lg group-hover:bg-stone-100 transition-colors">
                        {serviceTypeIcon[booking.type as any] || <ChefHat className="h-4 w-4 text-stone-400" />}
                    </div>
                    <span className="text-[11px] font-black text-stone-700 uppercase tracking-tighter">
                        {booking.type || 'Custom'}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">{booking.cookName || booking.maidName || 'Unassigned'}</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Partner</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">{format(new Date(booking.bookingDate), 'MMM d, h:mm a')}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(booking.bookingDate), { addSuffix: true })}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant={statusVariant[booking.status] || 'secondary'} className="rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none pointer-events-none">
                    {booking.status.replace('_', ' ')}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-stone-950">₹{booking.totalCost}</span>
                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Profit: ₹{Math.round(booking.earnings || booking.totalCost * 0.2)}</span>
                </div>
            </TableCell>
            <TableCell className="pr-8 text-right">
                <div className="flex justify-end">
                    {booking.customerRating ? (
                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg w-fit">
                            <span className="text-xs font-black">{booking.customerRating}</span>
                            <Star className="h-3 w-3 fill-current" />
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">No Feedback</span>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

export function BookingList() {
  const firestore = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const allBookingsQuery = useMemoFirebase(() => {
    if (firestore && firebaseUser && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return query(collectionGroup(firestore, 'bookings'));
    }
    return null;
  }, [firestore, firebaseUser]);

  const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(allBookingsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (firestore && bookings && bookings.length > 0) {
        return collection(firestore, 'customers');
    }
    return null;
  }, [firestore, bookings?.length]);

  const { data: allCustomers, isLoading: isCustomersLoading } = useCollection<UserProfile>(customersQuery);

  const customerMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    if (allCustomers) {
        allCustomers.forEach(c => {
            if (c.id) map.set(c.id, c);
        });
    }
    return map;
  }, [allCustomers]);

  const analytics = useMemo(() => {
    if (!bookings) return { totalEarnings: 0, growth: 0, todayCount: 0, yesterdayCount: 0 };
    
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    let totalEarnings = 0;
    let todayCount = 0;
    let yesterdayCount = 0;

    bookings.forEach(b => {
        const bDate = new Date(b.bookingDate);
        if (b.status === 'completed' || b.status === 'delivered') {
            totalEarnings += b.earnings || (b.totalCost * 0.2);
        }
        if (isToday(bDate)) todayCount++;
        if (isYesterday(bDate)) yesterdayCount++;
    });

    const growth = yesterdayCount === 0 ? 100 : ((todayCount - yesterdayCount) / yesterdayCount) * 100;

    return { totalEarnings, growth, todayCount, yesterdayCount };
  }, [bookings]);

  const filteredAndSortedBookings = useMemo(() => {
    if (!bookings) return [];
    
    const now = new Date();
    const q = searchQuery.toLowerCase();
    
    const filteredBySearch = bookings.filter(b => {
        const customer = customerMap.get(b.customerId);
        return (
            b.id.toLowerCase().includes(q) ||
            b.customerName?.toLowerCase().includes(q) ||
            b.customerContact?.toLowerCase().includes(q) ||
            b.cookName?.toLowerCase().includes(q) ||
            b.maidName?.toLowerCase().includes(q) ||
            customer?.name.toLowerCase().includes(q) ||
            customer?.contactNumber?.toLowerCase().includes(q)
        );
    });

    const filteredByDate = filteredBySearch.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return dateFilter === 'upcoming' ? bookingDate >= now : bookingDate < now;
    });

    const filteredByStatus = statusFilter === 'all' 
      ? filteredByDate
      : filteredByDate.filter(b => b.status === statusFilter);

    return filteredByStatus.sort((a, b) => {
      const dateA = new Date(a.bookingDate).getTime();
      const dateB = new Date(b.bookingDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  }, [bookings, statusFilter, sortOrder, dateFilter, searchQuery, customerMap]);

  const showLoading = isBookingsLoading || isCustomersLoading || isUserLoading;

  if (isUserLoading || !firebaseUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 mt-4">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-stone-200/40 bg-stone-900 text-white overflow-hidden relative group p-2">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-120 transition-transform">
             <DollarSign className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Total Platform Earnings</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter">₹{analytics.totalEarnings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% vs Last Period</span>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-stone-200/40 bg-white overflow-hidden p-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Active Bookings (Today)</CardDescription>
            <CardTitle className="text-4xl font-black text-stone-900 tracking-tighter">{analytics.todayCount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between items-end">
                <div className={cn(
                    "flex items-center gap-1.5 text-xs font-black px-2 py-1 rounded-full",
                    analytics.growth >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                    {analytics.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(Math.round(analytics.growth))}% {analytics.growth >= 0 ? 'Increase' : 'Decrease'}
                </div>
                <span className="text-[10px] font-bold text-stone-400 italic">vs Yesterday: {analytics.yesterdayCount}</span>
             </div>
             <Progress value={Math.min(100, (analytics.todayCount / (analytics.yesterdayCount || 1)) * 100)} className="h-1.5 bg-stone-100" />
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-stone-200/40 bg-white overflow-hidden p-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Platform NPS/Rating</CardDescription>
            <CardTitle className="text-4xl font-black text-stone-900 tracking-tighter">4.92</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                <span className="ml-2 text-xs font-bold text-stone-400">Stable benchmark rating</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl shadow-stone-200/50 overflow-hidden bg-white">
        <CardHeader className="p-10 border-b border-stone-50 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-1">
                    <CardTitle className="text-3xl font-black text-stone-900 tracking-tight">Booking Inventory</CardTitle>
                    <CardDescription className="text-base font-bold text-stone-400">Comprehensive view of all platform transactions and requests.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
                        <Input 
                            placeholder="Search by ID, Customer, Partner, or Phone..." 
                            className="pl-11 h-14 w-full md:w-[400px] rounded-[1.25rem] border-stone-100 bg-stone-50 font-bold focus-visible:ring-stone-900 placeholder:text-stone-400 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-14 w-14 rounded-[1.25rem] border-stone-100 p-0 hover:bg-white shadow-sm transition-all active:scale-95">
                        <Filter className="w-5 h-5 text-stone-400" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex bg-stone-50 p-1.5 rounded-[1.25rem] w-fit shadow-inner border border-stone-100">
                    <button 
                        onClick={() => setDateFilter('upcoming')}
                        className={cn("px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", dateFilter === 'upcoming' ? "bg-white shadow-md text-stone-900" : "text-stone-400 hover:text-stone-600")}
                    >Upcoming</button>
                    <button 
                        onClick={() => setDateFilter('past')}
                        className={cn("px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", dateFilter === 'past' ? "bg-white shadow-md text-stone-900" : "text-stone-400 hover:text-stone-600")}
                    >Historical</button>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <Button 
                            key={status}
                            variant="ghost" 
                            size="sm"
                            onClick={() => setStatusFilter(status as any)}
                            className={cn(
                                "rounded-full px-5 h-9 text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                statusFilter === status ? "bg-stone-900 text-white border-stone-900 shadow-lg" : "border-stone-50 bg-stone-50/50 text-stone-400 hover:border-stone-200"
                            )}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {showLoading ? (
            <div className="p-10 space-y-6">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : (
            filteredAndSortedBookings.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-stone-50/30">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6 pl-10">Customer Profile</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6">Service Type</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6">Assigned Pro</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6">Timeline</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6">Request Status</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6 text-right">Revenue/Profit</TableHead>
                                <TableHead className="font-black text-stone-400 uppercase tracking-widest text-[10px] py-6 pr-10 text-right">CSAT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedBookings.map((booking) => (
                                <BookingRow 
                                    key={booking.id} 
                                    booking={booking} 
                                    customer={customerMap.get(booking.customerId)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                    <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex items-center justify-center text-stone-200 shadow-inner">
                        <CalendarCheck className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-stone-900 tracking-tight text-2xl uppercase">Inventory Empty</h4>
                        <p className="text-stone-400 font-bold text-sm max-w-xs mx-auto">Adjust your filters or search query to find specific booking records.</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                        className="rounded-xl font-black text-xs uppercase tracking-widest border-2 hover:bg-stone-50"
                    >Reset All Filters</Button>
                </div>
            )
          )}
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="rounded-[2.5rem] border-none bg-red-50 text-red-900 p-8">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <AlertTitle className="text-lg font-black tracking-tight">System Sync Error</AlertTitle>
            <AlertDescription className="font-bold opacity-80 mt-2">
                We encountered an issue while synchronizing current booking data: {error.message}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
