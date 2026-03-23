
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Booking, Dish, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, User, Calendar, Clock, MapPin, Mail, Phone, Flame, Utensils, Hash, CheckCircle, Hourglass, ChefHat } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { AssignCook } from './assign-cook';
import { useSearchParams } from 'next/navigation';

function BookingDetailsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}

// This is now a proper React component that fetches its own data
function DishDetails({ dishId, dishName: providedName, portions, type }: { dishId?: string, dishName?: string, portions: number, type?: 'cook' | 'maid' }) {
    const firestore = useFirestore();
    const dishRef = useMemoFirebase(() => (firestore && dishId) ? doc(firestore, 'dishes', dishId) : null, [firestore, dishId]);
    const { data: dish, isLoading } = useDoc<Dish>(dishRef);

    if (isLoading && dishId) {
        return (
             <div className="flex gap-4 border p-3 rounded-md">
                <Skeleton className="rounded-md w-24 h-24" />
                <div className="flex-grow space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        )
    }
    
    const dishName = dish?.displayName_en || providedName || 'Unknown Item';
    const isMaid = type === 'maid';

    return (
        <div className="flex gap-4 border p-4 rounded-2xl bg-white shadow-sm border-stone-100">
            <div className={`rounded-xl flex items-center justify-center w-20 h-20 shrink-0 ${isMaid ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                {dish?.heroImageUrl ? (
                    <Image 
                        src={dish.heroImageUrl}
                        alt={dishName}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover w-full h-full"
                    />
                ) : (
                    isMaid ? <Sparkles className="w-8 h-8" /> : <ChefHat className="w-8 h-8" />
                )}
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <h4 className="font-bold text-stone-900">{dishName}</h4>
                <div className="flex gap-4 mt-1">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Qty: {portions}</p>
                    {!isMaid && dish?.cuisine && <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Cuisine: {dish.cuisine}</p>}
                </div>
            </div>
        </div>
    )
}

function CustomerDetails({ customerId }: { customerId: string }) {
    const firestore = useFirestore();
    const customerRef = useMemoFirebase(() => {
        if (firestore && customerId) {
            return doc(firestore, 'customers', customerId);
        }
        return null;
    }, [firestore, customerId]);
    
    const { data: customer, isLoading } = useDoc<UserProfile>(customerRef);

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }
    
    if (!customer) {
        return (
            <CardContent>
                <p>Customer details not found.</p>
            </CardContent>
        )
    }

    return (
        <CardContent className="space-y-3">
             <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{customer.name || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">{customer.email || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{customer.contactNumber || 'Not Provided'}</span>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                <span>{customer.address || 'Address not provided'} <br/> Pincode: {customer.pincode || 'N/A'}</span>
            </div>
        </CardContent>
    )
}

export function BookingDetails({ bookingId }: { bookingId: string }) {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const bookingRef = useMemoFirebase(() => {
    if (firestore && customerId) {
      return doc(firestore, 'customers', customerId, 'bookings', bookingId);
    }
    return null;
  }, [firestore, customerId, bookingId]);

  const { data: booking, isLoading: isBookingLoading, error: bookingError } = useDoc<Booking>(bookingRef);

  const allDishesRef = useMemoFirebase(() => firestore ? collection(firestore, 'dishes') : null, [firestore]);
  const { data: allDishes, isLoading: areDishesLoading } = useCollection<Dish>(allDishesRef);

  const isLoading = isBookingLoading || areDishesLoading;
  const error = bookingError;

  if (isLoading) {
    return <BookingDetailsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Fetching Data</AlertTitle>
        <AlertDescription>
          Could not retrieve booking details. It's possible the data is inconsistent or you lack permissions.
          <p className="mt-2 text-xs font-mono bg-destructive-foreground/20 p-2 rounded">{error.message}</p>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!booking || !booking.items) {
    return (
       <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Booking Not Found</AlertTitle>
        <AlertDescription>
          The requested booking does not exist or could not be found. Try finding it from the main bookings list.
        </AlertDescription>
      </Alert>
    )
  }
  
  const totalCookTime = booking.items.reduce((acc, item) => {
    const dish = allDishes?.find(d => d.id === item.dishId);
    return acc + (dish?.totalCookTimeMinutes || 0) * item.numberOfPortions;
  }, 0);
  const totalPortions = booking.items.reduce((acc, item) => acc + item.numberOfPortions, 0);

  const statusVariant = {
      pending: 'accent',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive'
  } as const;

  const statusIcon = {
      pending: <Hourglass className="mr-2 h-4 w-4"/>,
      confirmed: <CheckCircle className="mr-2 h-4 w-4"/>,
      completed: <CheckCircle className="mr-2 h-4 w-4" />,
      cancelled: <AlertTriangle className="mr-2 h-4 w-4"/>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Booking #{booking.id.slice(0, 8)}</CardTitle>
                        <CardDescription className="text-stone-500 font-medium">
                            Scheduled for {format(new Date(booking.bookingDate), 'EEE, MMM d, yyyy @ p')}
                        </CardDescription>
                    </div>
                    <Badge variant={statusVariant[booking.status] || 'secondary'} className="text-base capitalize font-bold px-4 py-1.5 rounded-full border-none">
                        {statusIcon[booking.status]}
                        {booking.status}
                    </Badge>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        {booking.type === 'maid' ? (
                            <div className="bg-green-100 p-2.5 rounded-full text-green-600"><Sparkles className="w-6 h-6" strokeWidth={2.5}/></div>
                        ) : (
                            <div className="bg-orange-100 p-2.5 rounded-full text-orange-600"><ChefHat className="w-6 h-6" /></div>
                        )}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 leading-none mb-1">Service Type</p>
                            <p className="font-bold text-stone-900">{booking.type === 'maid' ? 'Maid & Cleaning' : 'Private Chef Session'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total {booking.type === 'maid' ? 'Chores' : 'Dishes'}</p>
                            <p className="font-bold text-stone-900 flex items-center gap-2"><Utensils className="h-4 w-4 text-stone-300" /> {booking.items.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Portions</p>
                            <p className="font-bold text-stone-900 flex items-center gap-2"><Hash className="h-4 w-4 text-stone-300" /> {totalPortions}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time Remain</p>
                            <p className="font-bold text-stone-900 flex items-center gap-2"><Clock className="h-4 w-4 text-stone-300" /> {formatDistanceToNowStrict(new Date(booking.bookingDate))}</p>
                        </div>
                        <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Cost</p>
                             <p className="font-bold text-orange-600">₹{booking.totalCost}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AssignCook bookingId={booking.id} customerId={booking.customerId} bookingDate={booking.bookingDate} />

            <Card className="rounded-[2rem] border-stone-100 shadow-sm overflow-hidden bg-stone-50/30">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl font-black text-stone-900 tracking-tight">
                        {booking.type === 'maid' ? 'Service Checklist' : 'Ordered Dishes'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                    {booking.items.map((item, idx) => (
                       <DishDetails 
                         key={item.dishId || `item-${idx}`} 
                         dishId={item.dishId} 
                         dishName={item.dishName} 
                         portions={item.numberOfPortions} 
                         type={booking.type}
                       />
                    ))}
                </CardContent>
            </Card>
        </div>
        <div className="lg:sticky lg:top-24">
             <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CustomerDetails customerId={booking.customerId} />
            </Card>
        </div>
    </div>
  );
}

    