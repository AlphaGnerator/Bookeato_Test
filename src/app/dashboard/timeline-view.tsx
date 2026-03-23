
'use client';

import { useMemo } from 'react';
import { useCulinaryStore } from '@/hooks/use-culinary-store';
import { addDays, format, isSameDay, startOfToday, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Soup, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TimelineView() {
  const { bookings, user, isInitialized } = useCulinaryStore();
  const router = useRouter();

  const timelineDays = useMemo(() => {
    const today = new Date();
    const planStartDate = user.subscription?.startDate ? new Date(user.subscription.startDate) : today;
    
    // Show the next 7 days, or the 7 days from the plan start date if it's in the future
    const displayStartDate = today > planStartDate ? today : planStartDate;

    return Array.from({ length: 7 }, (_, i) => addDays(displayStartDate, i));
  }, [user.subscription]);

  const planDetails = useMemo(() => {
    if (!user.subscription || user.subscription.planId === 'daily' || !user.subscription.startDate || !user.subscription.expiryDate) {
      return { planType: 'day', duration: 0, start: null, end: null };
    }

    const startDate = new Date(user.subscription.startDate);
    const endDate = new Date(user.subscription.expiryDate);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
        planType: user.subscription.planId,
        duration,
        start: startDate,
        end: endDate,
    };

  }, [user]);

  const handleClick = (day: Date, hasBooking: boolean) => {
    const dateString = format(day, 'yyyy-MM-dd');
    if (hasBooking) {
        router.push(`/booking/summary/${dateString}`);
    } else {
        // If user is on a plan, redirect to select dishes for that day.
        if (user.subscription && user.subscription.planId !== 'daily' && planDetails.start && planDetails.end && day >= planDetails.start && day <= planDetails.end) {
            router.push(`/booking/slots?date=${dateString}`);
        } else {
            router.push('/pricing');
        }
    }
  }

  if (!isInitialized) {
    return <TimelineSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Your Week Ahead
          </CardTitle>
          {planDetails.start && planDetails.duration > 1 && (
              <CardDescription className="mt-2">
                  Plan Duration: {format(planDetails.start, 'MMM d')} - {format(planDetails.end, 'MMM d, yyyy')}
              </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {timelineDays.map((day) => {
            const today = startOfToday();
            const isPastDay = day < today;
            const bookingForDay = bookings?.find((b) => isSameDay(new Date(b.bookingDate), day) && b.status !== 'cancelled');
            const hasBooking = !!bookingForDay;

            let dayStatus: 'booked' | 'open_slot' | 'no_plan' | 'past' = 'no_plan';

            if (isPastDay) {
                dayStatus = 'past';
            } else if (hasBooking) {
                dayStatus = 'booked';
            } else if (planDetails.start && planDetails.end && day >= planDetails.start && day <= planDetails.end) {
                dayStatus = 'open_slot';
            }

            const getDayContent = () => {
              switch (dayStatus) {
                case 'booked':
                  return (
                    <div className="text-xs font-semibold text-green-700 truncate">
                      {bookingForDay.items.length > 1
                        ? `${bookingForDay.items.length} dishes`
                        : bookingForDay.items[0]?.dishName || 'Booked'}
                    </div>
                  );
                case 'open_slot':
                  return <div className="text-xs font-semibold text-amber-600">Select Meal</div>;
                case 'past':
                  return <div className="text-xs text-muted-foreground">{hasBooking ? 'Completed' : 'Past'}</div>;
                case 'no_plan':
                default:
                  return <div className="text-xs text-muted-foreground">No Plan</div>;
              }
            };

            return (
              <div
                key={day.toISOString()}
                onClick={() => !isPastDay && handleClick(day, hasBooking)}
                className={cn(
                    "relative rounded-lg border p-3 text-center space-y-2 transition-colors",
                    !isPastDay && "cursor-pointer hover:bg-muted/50",
                    dayStatus === 'past' && "bg-muted/50 opacity-60 cursor-not-allowed",
                    dayStatus === 'booked' && 'bg-green-100/50',
                    (dayStatus === 'open_slot' || dayStatus === 'no_plan') && !isPastDay && 'bg-white'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0 left-0 right-0 h-1 rounded-t-md',
                    {
                        'bg-green-500': dayStatus === 'booked',
                        'bg-amber-500': dayStatus === 'open_slot',
                        'bg-red-500': dayStatus === 'no_plan',
                        'bg-gray-400': dayStatus === 'past',
                    }
                  )}
                />
                <p className="text-sm font-medium">{format(day, 'EEE')}</p>
                <p className="text-2xl font-bold">{format(day, 'd')}</p>
                {getDayContent()}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({length: 7}).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
