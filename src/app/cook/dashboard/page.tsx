
'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, differenceInMinutes } from 'date-fns';
import { ArrowRight, CalendarPlus, CookingPot, Wallet, Soup, Lock, Unlock, Phone, AlertTriangle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Booking, UserProfile, Assignment, CookProfile } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SessionCard({ booking }: { booking: Booking }) {
    const firestore = useFirestore();
    const [isUnlocked, setIsUnlocked] = useState(true);

    const customerRef = useMemoFirebase(() => {
        if(firestore && booking.customerId) {
            return doc(firestore, 'customers', booking.customerId);
        }
        return null;
    }, [firestore, booking.customerId]);

    const {data: customer, isLoading} = useDoc<UserProfile>(customerRef);
    
    if (isLoading) {
        return <Skeleton className="h-40 w-full" />
    }
    
    const dishTitle = (booking.items && booking.items.length > 1) ? `${booking.items.length} dishes` : (booking.items?.[0]?.dishName);
    
    const Wrapper = isUnlocked ? Link : 'div';
    // The key change is here: link to the bookingId instead of a dish slug
    const wrapperProps = isUnlocked ? { href: `/cook/tutorials/${booking.id}?customerId=${booking.customerId}` } : {};

    return (
        <Wrapper {...wrapperProps}>
            <Card className={cn(
                "transition-all",
                isUnlocked ? "cursor-pointer hover:border-primary hover:shadow-lg" : "cursor-not-allowed bg-muted/50 text-muted-foreground",
            )}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className={cn("text-xl flex items-center gap-2", !isUnlocked && "text-muted-foreground/80")}>
                                <CookingPot className="h-5 w-5"/>
                                {dishTitle}
                            </CardTitle>
                             <div className="text-sm mt-3 space-y-2">
                                <p><strong>Pincode:</strong> {booking.customerPincode || '--'}</p>
                                <p><strong>Time:</strong> {format(new Date(booking.bookingDate), 'EEE, MMM d, h:mm a')}</p>
                            </div>
                        </div>
                        <Badge variant={isUnlocked ? 'default' : 'secondary'}>
                            {isUnlocked ? <Unlock className="mr-2 h-4 w-4"/> : <Lock className="mr-2 h-4 w-4"/>}
                            {isUnlocked ? "Details Unlocked" : "Locked"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {isUnlocked ? (
                         <Button variant="outline" className="w-full">
                            View Details & Start
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <p className="text-xs text-center p-2 rounded-md bg-background/50">
                            Customer details will be revealed 1 hour before the session starts.
                        </p>
                    )}
                </CardContent>
            </Card>
        </Wrapper>
    )
}

function AssignedBooking({ assignment }: { assignment: Assignment }) {
    const firestore = useFirestore();
    const bookingRef = useMemoFirebase(() => {
        if (firestore) {
            return doc(firestore, 'customers', assignment.customerId, 'bookings', assignment.id);
        }
        return null;
    }, [firestore, assignment]);

    const { data: booking, isLoading } = useDoc<Booking>(bookingRef);

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!booking) {
        return null; // Or some error/placeholder if a booking is expected but not found
    }

    return <SessionCard booking={booking} />;
}


function CookDashboardContent() {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const assignmentsQuery = useMemoFirebase(() => {
    if (firestore && firebaseUser) {
        return query(collection(firestore, 'assignments'), where('cookId', '==', firebaseUser.uid));
    }
    return null;
  }, [firestore, firebaseUser]);

  const { data: assignments, isLoading: areAssignmentsLoading, error } = useCollection<Assignment>(assignmentsQuery);
  const { data: cookProfile, isLoading: isProfileLoading } = useDoc<CookProfile>(useMemoFirebase(() => firestore && firebaseUser ? doc(firestore, 'cooks', firebaseUser.uid) : null, [firestore, firebaseUser]));

  const isInitialized = !isUserLoading && !areAssignmentsLoading && !isProfileLoading;
  
  const upcomingAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments
        .filter(assignment => new Date(assignment.bookingDate) >= new Date())
        .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
  }, [assignments]);


  const todaysEarnings = upcomingAssignments
    .filter(assignment => isToday(new Date(assignment.bookingDate)))
    .reduce((total) => total + 500, 0); // Mock price logic, needs real data
    
  const totalWalletBalance = 15000; // Mock total balance

  if (isUserLoading) {
      return <DashboardSkeleton />;
  }

  // This is a more reliable check. If a cook profile exists for this UID, they are a cook.
  if (!isUserLoading && !cookProfile) {
      return (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cook Profile Not Found</AlertTitle>
              <AlertDescription>
                  We could not find a cook profile associated with your account.
                   <Link href="/cook/login" className="ml-2 font-bold underline">Login Here</Link> or <Link href="/cook/signup" className="ml-2 font-bold underline">Sign Up</Link>.
              </AlertDescription>
          </Alert>
      )
  }

  if (!isInitialized) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8 rounded-lg border border-primary/20 shadow-sm">
        <h1 className="font-headline text-4xl text-foreground">Welcome back, {cookProfile?.name || 'Cook'}!</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Manage your availability, view your upcoming sessions, and update your profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle>Your Upcoming Sessions</CardTitle>
            <CardDescription>Here are the cooking sessions assigned to you.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                    {upcomingAssignments.map(assignment => (
                       <AssignedBooking key={assignment.id} assignment={assignment} />
                    ))}
                </div>
            ) : (
                 <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                    <Soup className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="font-semibold">No Upcoming Sessions</p>
                    <p className="text-sm">You have no bookings assigned to you yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-6 w-6"/>
                    My Wallet
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">Your total available balance.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">₹{totalWalletBalance.toLocaleString('en-IN')}</p>
                <div className="text-xs text-primary-foreground/80 mt-4 border-t border-primary-foreground/30 pt-2">
                    <span className="font-semibold">Today's Earnings:</span> ₹{todaysEarnings.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-accent transition-colors bg-accent/90 text-accent-foreground">
                <Link href="/cook/availability" className="block h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Manage Availability</CardTitle>
                            <CardDescription className="text-accent-foreground/80">Set the times you are available to cook.</CardDescription>
                        </div>
                        <CalendarPlus className="h-8 w-8"/>
                    </CardHeader>
                </Link>
            </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="p-8 rounded-lg">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-3/4 mt-4" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function CookDashboardPage() {
  return (
    <AppLayout pageTitle="Cook Dashboard">
      <CookDashboardContent />
    </AppLayout>
  );
}
