
'use client';
import { AppLayout } from '@/components/app-layout';
import { BookingList } from './booking-list';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export const dynamic = 'force-dynamic';

export default function AdminBookingsPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="All Customer Bookings">
          <BookingList />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
