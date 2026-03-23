
'use client';
import { AppLayout } from '@/components/app-layout';
import { BookingList } from './booking-list';
import { FirebaseClientProvider } from '@/firebase';

export const dynamic = 'force-dynamic';

export default function AdminBookingsPage() {
  return (
    <FirebaseClientProvider>
      <AppLayout pageTitle="All Customer Bookings">
        <BookingList />
      </AppLayout>
    </FirebaseClientProvider>
  );
}
