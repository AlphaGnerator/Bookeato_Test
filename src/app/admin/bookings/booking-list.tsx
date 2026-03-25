
'use client';

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
import { CalendarCheck, AlertTriangle, Eye, ChefHat, ArrowUp, ArrowDown, Sparkles, Home, UtensilsCrossed } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { defaultUser } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';

function BookingRow({ booking, customer: providedCustomer }: { booking: Booking, customer?: UserProfile | null }) {
    const router = useRouter();
    
    const displayCustomer = useMemo(() => {
        if (providedCustomer) return providedCustomer;
        
        // Fallback to denormalized data if available, or a generic placeholder
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
        cancelled: 'destructive'
    } as const;

    const serviceTypeIcon = {
        'cook': <ChefHat className="h-4 w-4 text-orange-500" />,
        'maid': <Sparkles className="h-4 w-4 text-green-500" strokeWidth={2.5}/>,
    }

    const serviceTypeLabel = {
        'cook': 'Cook Service',
        'maid': 'Maid Service',
    }

    return (
        <TableRow onClick={handleRowClick} className="cursor-pointer hover:bg-muted/50">
            <TableCell>{displayCustomer.name}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {serviceTypeIcon[booking.type as 'cook' | 'maid'] || <ChefHat className="h-4 w-4 text-stone-400" />}
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        {serviceTypeLabel[booking.type as 'cook' | 'maid'] || 'Cook Service'}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                {booking.cookName ? (
                    <span className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        {booking.cookName}
                    </span>
                ) : (
                    <span className="text-muted-foreground">Not Assigned</span>
                )}
            </TableCell>
            <TableCell>{format(new Date(booking.bookingDate), 'PPP p')}</TableCell>
            <TableCell>{formatDistanceToNow(new Date(booking.bookingDate), { addSuffix: true })}</TableCell>
            <TableCell>
                <Badge variant={statusVariant[booking.status] || 'secondary'} className="capitalize">
                    {booking.status}
                </Badge>
            </TableCell>
        </TableRow>
    )
}


export function BookingList() {
  const firestore = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const allBookingsQuery = useMemoFirebase(() => {
    if (firestore && firebaseUser && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return query(collectionGroup(firestore, 'bookings'));
    }
    return null;
  }, [firestore, firebaseUser]);

  const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(allBookingsQuery);

  // Optimization: Fetch all customers in one go to avoid N+1 queries in rows
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

  const filteredAndSortedBookings = useMemo(() => {
    if (!bookings) return [];
    
    const now = new Date();
    
    const filteredByDate = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        if (dateFilter === 'upcoming') {
            return bookingDate >= now;
        } else {
            return bookingDate < now;
        }
    });

    const filteredByStatus = statusFilter === 'all' 
      ? filteredByDate
      : filteredByDate.filter(b => b.status === statusFilter);

    return filteredByStatus.sort((a, b) => {
      const dateA = new Date(a.bookingDate).getTime();
      const dateB = new Date(b.bookingDate).getTime();
      
      if (dateFilter === 'upcoming') {
        // For upcoming, default sort is ascending (soonest first)
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // For past, default sort is descending (most recent first)
        return sortOrder === 'asc' ? dateB - dateA : dateA - dateB;
      }
    });

  }, [bookings, statusFilter, sortOrder, dateFilter]);
  
  useEffect(() => {
    // When switching to 'past', it makes more sense to show the most recent past bookings first.
    // When switching to 'upcoming', it makes sense to show the soonest bookings first.
    setSortOrder(dateFilter === 'past' ? 'desc' : 'asc');
  }, [dateFilter]);

  const handleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  }

  const showLoading = isBookingsLoading || isCustomersLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          A real-time list of all customer booking requests across the platform. Click a row for details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
                <Button variant={dateFilter === 'upcoming' ? 'default' : 'outline'} onClick={() => setDateFilter('upcoming')}>Upcoming</Button>
                <Button variant={dateFilter === 'past' ? 'default' : 'outline'} onClick={() => setDateFilter('past')}>Past</Button>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-auto"/>
            <div className="flex flex-wrap gap-2">
                <Button variant={statusFilter === 'all' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
                <Button variant={statusFilter === 'pending' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
                <Button variant={statusFilter === 'confirmed' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('confirmed')}>Confirmed</Button>
                <Button variant={statusFilter === 'completed' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('completed')}>Completed</Button>
                <Button variant={statusFilter === 'cancelled' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('cancelled')}>Cancelled</Button>
            </div>
        </div>

        {showLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!isUserLoading && !firebaseUser && !isBookingsLoading && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You must be logged in as an admin to view this page.
                </AlertDescription>
            </Alert>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Data</AlertTitle>
                <AlertDescription>
                    Could not retrieve the booking list.
                    <p className="mt-2 text-xs font-mono bg-destructive-foreground/20 p-2 rounded">
                        {error.message}
                    </p>
                </AlertDescription>
            </Alert>
        )}

        {!showLoading && !error && firebaseUser && (
          filteredAndSortedBookings && filteredAndSortedBookings.length > 0 ? (
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Assigned Pro</TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={handleSort} className="-ml-4">
                            Booking Date
                            {sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
                          </Button>
                        </TableHead>
                        <TableHead>Due In</TableHead>
                        <TableHead>Status</TableHead>
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
            <Alert>
                <CalendarCheck className="h-4 w-4" />
                <AlertTitle>No Bookings Found</AlertTitle>
                <AlertDescription>
                    There are no customer bookings that match the current filter.
                </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
    </Card>
  );
}
