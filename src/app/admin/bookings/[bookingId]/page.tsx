
'use client';
import { AppLayout } from '@/components/app-layout';
import { BookingDetails } from './booking-details';
import { FirebaseClientProvider } from '@/firebase';
import React, { Suspense, use } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function AdminBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();

  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="Booking Details">
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
          <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/admin/bookings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Bookings
            </Button>
            <BookingDetails bookingId={bookingId} />
          </div>
        </Suspense>
      </AppLayout>
    </FirebaseClientProvider>
  );
}
