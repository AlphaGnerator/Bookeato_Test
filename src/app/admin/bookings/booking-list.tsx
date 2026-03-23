
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

function BookingRow({ booking }: { booking: Booking }) {
    const firestore = useFirestore();
    const router = useRouter();
    const [displayCustomer, setDisplayCustomer] = useState<UserProfile | null>(null);

    const customerRef = useMemoFirebase(() => {
        if(firestore && booking.customerId) {
            return doc(firestore, 'customers', booking.customerId);
        }
        return null;
    }, [firestore, booking.customerId]);

    const {data: customer, isLoading} = useDoc<UserProfile>(customerRef);
    
    useEffect(() => {
        if (isLoading) {
            setDisplayCustomer(null); // Explicitly set to null while loading
            return;
        }

        if (customer) {
            setDisplayCustomer(customer);
        } else {
            // Fallback to default user if customer is not found after loading
            setDisplayCustomer({ ...defaultUser, id: booking.customerId, name: 'Unknown Customer' });
        }
    }, [isLoading, customer, booking.customerId]);

    if (!displayCustomer) {
        return (
             <TableRow>
                <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                </TableCell>
            </TableRow>
        )
    }
    
    const handleRowClick = () => {
        router.push(`/admin/bookings/${booking.id}?customerId=${booking.customerId}`);
    }
    
    const statusVariant = {
        pending: 'accent',
        confirmed: 'default',
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
    // Attempt collectionGroup only in admin context
    if (firestore && firebaseUser && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return query(collectionGroup(firestore, 'bookings'));
    }
    return null;
  }, [firestore, firebaseUser]);

  // Try the standard collectionGroup first
  const { data: collectionGroupBookings, isLoading: isCGLoading, error: cgError } = useCollection<Booking>(allBookingsQuery);

  // Fallback state for manual aggregation
  const [manualBookings, setManualBookings] = useState<Booking[]>([]);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [manualError, setManualError] = useState<Error | null>(null);

  // Fetch all customers for manual fallback
  const customersRef = useMemoFirebase(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  const { data: allCustomers } = useCollection<UserProfile>(customersRef);

  useEffect(() => {
    // If collectionGroup failed with permission error, we try the manual approach
    if (cgError && allCustomers && allCustomers.length > 0) {
      console.log("Collection Group failed, attempting manual aggregation for", allCustomers.length, "customers...");
      setIsManualLoading(true);
      
      const unsubscribers: (() => void)[] = [];
      const aggregateMap = new Map<string, Booking[]>();

      allCustomers.forEach(customer => {
        if (!customer.id) return;
        const customerBookingsRef = collection(firestore!, 'customers', customer.id, 'bookings');
        
        try {
          const unsub = onSnapshot(customerBookingsRef, (snapshot) => {
            const customerBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Booking);
            aggregateMap.set(customer.id!, customerBookings);
            
            // Flatten the map into a single array
            const flatBookings: Booking[] = [];
            aggregateMap.forEach(bookings => flatBookings.push(...bookings));
            setManualBookings(flatBookings);
            setIsManualLoading(false);
          }, (err) => {
            console.warn(`Could not fetch bookings for customer ${customer.id}:`, err);
            // We don't set global error if one customer fails, just continue
          });
          unsubscribers.push(unsub);
        } catch (e) {
            console.error(e);
        }
      });

      return () => unsubscribers.forEach(unsub => unsub());
    }
  }, [cgError, allCustomers, firestore]);

  // Resolve final bookings and states
  const bookings = cgError ? manualBookings : collectionGroupBookings;
  const isLoading = cgError ? (isManualLoading && manualBookings.length === 0) : isCGLoading;
  const error = (cgError && allCustomers && allCustomers.length > 0) ? null : cgError; 

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

  const showLoading = isLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Booking Requests</CardTitle>
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

        {!isUserLoading && !firebaseUser && !isLoading && (
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
                        <BookingRow key={booking.id} booking={booking} />
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
